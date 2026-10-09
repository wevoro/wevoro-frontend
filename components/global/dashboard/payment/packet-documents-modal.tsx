'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Download, Hourglass, Loader2, Lock } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  NOTHING_CONFIRMED,
  agencyFacingMessage,
} from '@/components/global/dashboard/download-package-button';

/**
 * SCRUM-119 — the caregiver's submitted documents, locked or unlocked.
 *
 * One component for both states, driven by the manifest's `paid` flag rather
 * than a prop, so the lock can never disagree with what the server will
 * actually release. Viewing is free: the manifest returns every file's name,
 * type and size, and withholds only the url.
 */

/** "$25" for whole dollars, "$49.99" otherwise — as on Faisal's A9 frame. */
const money = (cents?: number | null) =>
  cents === null || cents === undefined
    ? '—'
    : `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;

const firstName = (full?: string) => (full || '').trim().split(/\s+/)[0] || 'this caregiver';

const prettySize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/**
 * SCRUM-119 (A9): the badge and meta word for a file, from the type the server
 * read off the stored file. PDF red; photos green, as the Driver's License row
 * in Faisal's A9 frame (a green "JPG" badge over "JPEG · 2.1 MB").
 *
 * This used to guess from a `mimeType` nothing ever stored and from the title,
 * which never carries an extension, so every file — photos included — wore a
 * red "PDF". A type the server could not determine now says so plainly rather
 * than claiming to be a PDF.
 */
const fileBadge = (fileType?: string | null, mimeType?: string | null) => {
  const type = String(fileType || '').toUpperCase();
  const mime = String(mimeType || '').toLowerCase();
  if (type === 'PDF' || mime === 'application/pdf') {
    return { label: 'PDF', meta: 'PDF', className: 'bg-[#E22121]' };
  }
  if (type === 'JPG' || type === 'JPEG' || mime === 'image/jpeg') {
    return { label: 'JPG', meta: 'JPEG', className: 'bg-[#219957]' };
  }
  if (type === 'PNG' || mime === 'image/png') {
    return { label: 'PNG', meta: 'PNG', className: 'bg-[#219957]' };
  }
  if (mime.startsWith('image/')) {
    const label = type || mime.slice(6).toUpperCase();
    return { label, meta: label, className: 'bg-[#219957]' };
  }
  if (type) return { label: type.slice(0, 4), meta: type, className: 'bg-[#6C6C6C]' };
  return { label: 'FILE', meta: 'File', className: 'bg-[#6C6C6C]' };
};

interface PacketDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caregiverId: string;
  caregiverName?: string;
  onboardedAt?: string;
  /** Opens the payment gate. Called when the agency chooses to unlock. */
  onUnlock: () => void;
  /** Bumped by the caller after a successful payment to force a refetch. */
  refreshKey?: number;
}

const PacketDocumentsModal: React.FC<PacketDocumentsModalProps> = ({
  open,
  onOpenChange,
  caregiverId,
  caregiverName,
  onboardedAt,
  onUnlock,
  refreshKey = 0,
}) => {
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Downloads go through the server now, so they take a moment and must not be
  // double-fired.
  const [busyAll, setBusyAll] = useState(false);
  const [busyDoc, setBusyDoc] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/document/packet-manifest/${caregiverId}`);
      const json = await res.json();
      if (!res.ok || json?.status !== 200) {
        toast.error(json?.message || 'Could not load documents');
        return;
      }
      setManifest(json.data);
    } catch {
      toast.error('Could not load documents');
    } finally {
      setLoading(false);
    }
  }, [caregiverId]);

  useEffect(() => {
    if (open) load();
  }, [open, load, refreshKey]);

  const paid = !!manifest?.paid;
  const name = manifest?.caregiverName || caregiverName || 'This caregiver';
  const docs = manifest?.documents ?? [];
  // Credentials uploaded but not yet confirmed — the difference between
  // "nothing here yet" and "nothing was ever sent".
  const pendingCount: number = manifest?.pendingCount ?? 0;
  // SCRUM-135: confirmed credentials held back from this agency by a gate.
  const hiddenCredentials: string[] = manifest?.hiddenCredentials ?? [];
  // SCRUM-141: what the caregiver signed for this agency — shipped in the same
  // ZIP as the credentials — and whether they have responded yet. Payment waits
  // on that response.
  const signedDocs: any[] = manifest?.signedDocuments ?? [];
  // SCRUM-117 / SCRUM-67: the ZIP carries both groups, so it is worth building
  // whenever either has something in it. Gating it on credentials alone greyed
  // out "Download all (ZIP)" for a paid agency whose caregiver had signed
  // everything but had nothing confirmed yet.
  const zipCount = docs.length + signedDocs.length;
  const onboardState: string = manifest?.onboard?.state ?? 'none';
  const responded = onboardState === 'submitted';
  // Checkout needs a confirmed credential; a GCHEXS confirmation alone is shown
  // in the list but is not a packet that can be bought.
  const purchasable = manifest?.purchasable !== false && docs.length > 0;
  const canUnlock = responded && purchasable;

  /**
   * Save what the server sends, from our own origin.
   *
   * Everything here used to point an <a download> straight at the Bunny CDN.
   * That is cross-origin, where `download` is ignored — so files opened in tabs
   * instead of saving — and browsers drop repeated programmatic downloads, so
   * "3 documents" delivered one. A blob from our own origin has neither
   * problem, and routing through the server keeps the entitlement check and the
   * audit row that going direct to the CDN skipped.
   */
  const saveFromServer = async (
    path: string,
    fallbackName: string,
    failure = 'Could not prepare this download'
  ): Promise<Response> => {
    const res = await fetch(path);
    if (!res.ok) {
      let message: unknown;
      try {
        message = (await res.json())?.message;
      } catch {
        /* non-JSON body (an unexpected failure); keep the default */
      }
      // SCRUM-67: never a raw database error. The GCHEXS row's arrow used to
      // put the server's "Cast Error" straight into this toast.
      throw new Error(agencyFacingMessage(res.status, message, failure));
    }
    const name =
      /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '')?.[1] ||
      fallbackName;
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
    return res;
  };

  const downloadAll = async () => {
    if (!zipCount) {
      // SCRUM-131: same wording as the download button — an empty packet means
      // nothing has been confirmed or signed yet, which is not a failure.
      toast.error(NOTHING_CONFIRMED);
      return;
    }
    setBusyAll(true);
    try {
      const res = await saveFromServer(
        `/api/document/download-package-zip/${caregiverId}`,
        `${name.replace(/[^\w.-]+/g, '_')}-credentials.zip`,
        'Could not prepare the download'
      );
      // SCRUM-67: what is really in the ZIP, counted by the server that built
      // it. This used to be the credential count alone — "Downloaded 5
      // documents" for a ZIP that also held the 2 signed ones.
      const count = Number(res.headers.get('x-document-count')) || zipCount;
      toast.success(
        `Downloaded ${count} ${count === 1 ? 'document' : 'documents'} for ${name}`
      );
    } catch (e: any) {
      toast.error(e?.message || 'Could not prepare the download');
    } finally {
      setBusyAll(false);
    }
  };

  // A10: signed documents download one by one too, once the package is paid.
  const downloadSigned = async (doc: any) => {
    if (!doc?._id) return;
    setBusyDoc(`signed-${doc._id}`);
    try {
      await saveFromServer(
        `/api/document/download-signed/${caregiverId}/${doc._id}`,
        doc.title || 'signed-document',
        'Could not download this document'
      );
    } catch (e: any) {
      toast.error(e?.message || 'Could not download this document');
    } finally {
      setBusyDoc(null);
    }
  };

  const downloadOne = async (doc: any) => {
    if (!doc?._id) return;
    setBusyDoc(String(doc._id));
    try {
      // Every row carries a real Documents id now, the GCHEXS confirmation
      // included (it used to send the literal id 'gchexs').
      await saveFromServer(
        `/api/document/download-file/${doc._id}`,
        doc.title || 'credential',
        'Could not download this document'
      );
    } catch (e: any) {
      toast.error(e?.message || 'Could not download this document');
    } finally {
      setBusyDoc(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Same reason as the payment gate: a caregiver with many credentials
          makes this taller than the viewport, and a centred dialog with no cap
          overflows off both edges with no way to reach the button. */}
      {/* The dialog is a CSS grid; minmax(0,1fr) stops a long document name
          from widening the column past the dialog (it used to add a sideways
          scrollbar and push the banner and button off the edge). */}
      <DialogContent className='max-h-[92vh] max-w-[640px] grid-cols-[minmax(0,1fr)] gap-0 overflow-x-hidden overflow-y-auto overscroll-contain p-0'>
        <div className='px-6 pt-6 sm:px-8 sm:pt-8'>
          <h2 className='pr-8 text-[20px] font-semibold text-[#1C1C1C]'>{name}&apos;s package</h2>
          <p className='mt-1 text-[14px] text-[#6C6C6C]'>
            {[
              manifest?.onboard?.onboardedAt
                ? `Onboarded ${moment(manifest.onboard.onboardedAt).format('MMM D, YYYY')}`
                : onboardedAt
                  ? `Onboarded ${onboardedAt}`
                  : null,
              paid
                ? 'Payment completed'
                : manifest?.onboard?.submittedAt
                  ? `Signed ${moment(manifest.onboard.submittedAt).format('MMM D, YYYY')}`
                  : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Credentials and signed documents · one ZIP'}
          </p>
        </div>

        {loading ? (
          <p className='px-6 py-10 text-center text-[14px] text-[#6C6C6C]'>Loading documents…</p>
        ) : (
          <>
            {/* Banner — the one thing that differs most between the two states */}
            <div className='px-6 pt-[18px] sm:px-8'>
              {paid ? (
                <div className='flex items-center gap-2.5 rounded-xl bg-[#E0FDED] px-4 py-3'>
                  <Check className='size-5 shrink-0 text-[#006B29]' strokeWidth={2.5} />
                  <p className='text-[14px] font-medium leading-[20px] text-[#006B29]'>
                    Unlocked — everything below is ready to download.
                    {/* SCRUM-142: only claimed once WeVoro has actually sent it. */}
                    {manifest?.receiptEmailSentAt ? ' Receipt sent to your email.' : ''}
                  </p>
                </div>
              ) : (
                <div className='flex items-center gap-2.5 rounded-xl bg-[#FFF8E6] px-4 py-3'>
                  {responded ? (
                    <Lock className='size-5 shrink-0 text-[#7A5600]' />
                  ) : (
                    <Hourglass className='size-5 shrink-0 text-[#7A5600]' />
                  )}
                  <p className='text-[14px] font-medium leading-[20px] text-[#7A5600]'>
                    {!responded
                      ? onboardState === 'none'
                        ? `Onboard ${firstName(name)} first. You can pay and download once ${firstName(name)} has signed.`
                        : `Awaiting ${firstName(name)}’s signature. You can pay and download once ${firstName(name)} has signed.`
                      : !purchasable
                      ? 'Nothing is available to buy yet. A package needs at least one credential WeVoro has verified.'
                      : `These files are locked. Pay ${money(manifest?.priceCents)} once to unlock ${firstName(name)}’s package — re-downloads are free after that.`}
                  </p>
                </div>
              )}
            </div>

            {/* Files — SCRUM-141: two groups, one ZIP */}
            <div className='px-6 pt-[18px] sm:px-8'>
              <p className='mb-[18px] flex items-center justify-between text-[15px] font-semibold text-[#1C1C1C]'>
                Credentials
                <span className='text-[13px] font-normal text-[#6C6C6C]'>
                  {docs.length} {docs.length === 1 ? 'file' : 'files'}
                </span>
              </p>
              <div className='overflow-hidden rounded-xl border border-[#EDF0ED]'>
                {docs.length === 0 ? (
                  /*
                   * SCRUM-131 follow-on: a packet holds confirmed credentials
                   * only, so an empty one usually means the review has not
                   * happened yet — not that the caregiver did nothing. Saying
                   * "has not submitted any documents" in that case is wrong and
                   * unfair to a caregiver who uploaded everything.
                   */
                  <p className='px-4 py-6 text-[14px] text-[#6C6C6C]'>
                    {pendingCount > 0
                      ? `${pendingCount} credential${pendingCount === 1 ? ' is' : 's are'} uploaded and waiting for WeVoro to confirm ${pendingCount === 1 ? 'it' : 'them'}. They appear here once confirmed.`
                      : 'This caregiver has not submitted any documents yet.'}
                  </p>
                ) : (
                  docs.map((d: any) => {
                    const badge = fileBadge(d.fileType, d.mimeType);
                    const size = prettySize(d.fileSize);
                    return (
                      <div
                        key={String(d._id)}
                        className='flex items-center gap-3.5 border-b border-[#EDF0ED] px-5 py-3.5 last:border-0'
                      >
                        <span
                          className={`flex size-[42px] shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <div className='min-w-0 flex-1'>
                          <p
                            title={d.title}
                            className='line-clamp-2 break-words text-[16px] font-medium leading-[21px] text-[#1C1C1C]'
                          >
                            {d.title}
                          </p>
                          <p className='mt-[3px] text-[13px] text-[#6C6C6C]'>
                            {badge.meta}
                            {size ? ` · ${size}` : ''}
                          </p>
                        </div>
                        {paid && d.url ? (
                          <button
                            type='button'
                            onClick={() => downloadOne(d)}
                            disabled={busyDoc === String(d._id)}
                            aria-label={`Download ${d.title}`}
                            className='shrink-0 text-[#008000] transition-opacity hover:opacity-70 disabled:opacity-40'
                          >
                            {busyDoc === String(d._id) ? (
                              <Loader2 className='size-[18px] animate-spin' />
                            ) : (
                              <Download className='size-5' />
                            )}
                          </button>
                        ) : (
                          <Lock className='size-5 shrink-0 text-[#9CA3A0]' strokeWidth={1.6} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* SCRUM-135: a confirmed credential the packet is holding back
                  from this agency — today, TB Test under the SCRUM-99 tier gate.
                  Without this the list simply stopped at four and a confirmed
                  credential looked lost from the packet. Access is re-checked on
                  every download, so once the agency is confirmed the credential
                  is included automatically, with no second purchase. */}
              {hiddenCredentials.length > 0 && (
                <p className='mt-3 flex items-start gap-2 rounded-lg bg-[#F4F6F5] px-3.5 py-2.5 text-[13px] leading-[19px] text-[#5E6864]'>
                  <Lock className='mt-0.5 size-3.5 shrink-0 text-[#9CA3A0]' />
                  <span>
                    {hiddenCredentials.join(', ')}{' '}
                    {hiddenCredentials.length === 1 ? 'is' : 'are'} confirmed but not
                    included yet. Health results are shared only with agencies
                    WeVoro has confirmed — {hiddenCredentials.length === 1 ? 'it' : 'they'}{' '}
                    will be added to this packet automatically once your agency is
                    confirmed.
                  </span>
                </p>
              )}
            </div>

            <div className='px-6 pt-[18px] sm:px-8'>
              <p className='mb-[18px] flex items-center justify-between text-[15px] font-semibold text-[#1C1C1C]'>
                <span className='flex items-center gap-2'>
                  Signed documents
                  {/* The fee is for the credential package; the signed
                      documents are the agency's own templates, included. */}
                  <span className='rounded-full bg-[#E0FDED] px-2.5 py-1 text-[12px] font-medium leading-none text-[#006B29]'>
                    Included
                  </span>
                </span>
                <span className='text-[13px] font-normal text-[#6C6C6C]'>
                  {signedDocs.length} {signedDocs.length === 1 ? 'file' : 'files'}
                </span>
              </p>
              <div className='overflow-hidden rounded-xl border border-[#EDF0ED]'>
                {signedDocs.length === 0 ? (
                  <p className='px-4 py-4 text-[13.5px] leading-[20px] text-[#6C6C6C]'>
                    {responded
                      ? `${firstName(name)} responded with nothing to sign, because you had no signing documents for their role.`
                      : `The documents ${firstName(name)} signs for you appear here, and ship in the same ZIP.`}
                  </p>
                ) : (
                  signedDocs.map((d: any) => {
                    const busy = busyDoc === `signed-${d._id}`;
                    // Signed copies are PDFs WeVoro stamped, but the badge
                    // still reads the stored file rather than assuming.
                    const badge = fileBadge(d.fileType || 'PDF', d.mimeType);
                    return (
                      <div
                        key={String(d._id)}
                        className='flex items-center gap-3.5 border-b border-[#EDF0ED] px-5 py-3.5 last:border-0'
                      >
                        <span
                          className={`flex size-[42px] shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <div className='min-w-0 flex-1'>
                          <p
                            title={d.title}
                            className='line-clamp-2 break-words text-[16px] font-medium leading-[21px] text-[#1C1C1C]'
                          >
                            {d.title}
                          </p>
                          <p
                            className='mt-[3px] text-[13px] text-[#6C6C6C]'
                            title={d.signedAt ? `Signed ${moment(d.signedAt).format('MMM D, YYYY')}` : undefined}
                          >
                            {badge.meta}
                            {prettySize(d.fileSize) ? ` · ${prettySize(d.fileSize)}` : ''}
                          </p>
                        </div>
                        {paid ? (
                          <button
                            type='button'
                            onClick={() => downloadSigned(d)}
                            disabled={busy}
                            aria-label={`Download ${d.title}`}
                            className='shrink-0 text-[#008000] transition-opacity hover:opacity-70 disabled:opacity-40'
                          >
                            {busy ? (
                              <Loader2 className='size-[18px] animate-spin' />
                            ) : (
                              <Download className='size-5' />
                            )}
                          </button>
                        ) : (
                          <Lock className='size-5 shrink-0 text-[#9CA3A0]' strokeWidth={1.6} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className='px-6 pb-6 pt-[18px] sm:px-8 sm:pb-8'>
              {paid ? (
                <Button
                  onClick={downloadAll}
                  disabled={busyAll || zipCount === 0}
                  className='h-14 w-full gap-2.5 rounded-2xl bg-[#008000] text-[16px] font-semibold text-white hover:bg-[#016b01]'
                >
                  {busyAll ? (
                    <>
                      <Loader2 className='size-4 animate-spin' />
                      Preparing your download…
                    </>
                  ) : (
                    <>
                      <Download className='size-5' />
                      Download all (ZIP)
                    </>
                  )}
                </Button>
              ) : (
                /*
                 * SCRUM-131: the server refuses checkout when nothing is
                 * confirmed, so offering the button here only leads to an
                 * error. Say why instead of letting the agency click into one.
                 */
                <Button
                  onClick={onUnlock}
                  disabled={!canUnlock}
                  className='h-14 w-full gap-2.5 rounded-2xl bg-[#008000] text-[16px] font-semibold text-white hover:bg-[#016b01] disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {responded ? <Lock className='size-5' /> : <Hourglass className='size-5' />}
                  {!responded
                    ? `Awaiting ${firstName(name)}’s signature`
                    : !purchasable
                      ? 'Nothing to unlock yet'
                      : `Unlock & download all · ${money(manifest?.priceCents)}`}
                </Button>
              )}
              <p className='mt-2 text-center text-[12px] text-[#6C6C6C]'>
                {paid
                  ? 'Free · you already paid · re-downloads anytime'
                  : !responded
                    ? `Payment opens once ${firstName(name)} has signed`
                    : !purchasable
                    ? 'You will be able to buy this package once WeVoro has verified a credential'
                    : 'One-time payment · unlocks this caregiver’s package · re-downloads free'}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PacketDocumentsModal;
