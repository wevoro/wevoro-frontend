'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import moment from 'moment';
import {
  Calendar,
  MoreHorizontal,
  Sun,
  Moon,
  Navigation,
  Check,
  FileText,
  PenLine,
  Link as LinkIcon,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ApplyToShiftModal from '@/components/global/dashboard/matching-shifts/apply-to-shift-modal';
import SignDocumentsModal from '@/components/global/dashboard/esign/sign-documents-modal';
import ShiftDetailGrid from './shift-detail-grid';
import NotesPopup from '../../note-popup';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatShiftDays, getInitialStatus, isNightShift } from './helpers';
import { isCredentialingMode } from '@/lib/credentialing';

/** "10 mins ago", "3 hours ago", "2 days ago" — the wording on Faisal's C1/C5. */
function timeAgo(date?: string) {
  if (!date) return '';
  const mins = Math.max(0, moment().diff(moment(date), 'minutes'));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  return moment(date).fromNow();
}

interface ReceivedCardProps {
  offer: any;
}

interface SigningRow {
  id: string;
  title: string;
  signed: boolean;
}

// SCRUM-118: once a packet exists it is the source of truth. 'outdated' items were
// superseded by a newer version of the agency's document and are never signable.
function toSigningRows(context: any): SigningRow[] {
  const items = context?.packet?.items;
  if (items?.length) {
    return items
      .filter((item: any) => item.status !== 'outdated')
      .map((item: any) => ({
        id: item._id,
        title: item.title,
        signed: item.status === 'signed',
      }));
  }
  return (context?.documents ?? []).map((doc: any) => ({
    id: doc._id,
    title: doc.title,
    signed: false,
  }));
}

const ReceivedCard: React.FC<ReceivedCardProps> = ({ offer }) => {
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [packet, setPacket] = useState<any>(null);
  const hasUnfinishedPacket =
    !!packet && packet.status !== 'completed' &&
    (packet.items ?? []).some((i: any) => i.status === 'pending');
  const [signingRows, setSigningRows] = useState<SigningRow[]>([]);
  // Respond decides between signing and the "nothing to sign" confirmation
  // from the list below, so it must not act before the list has loaded — a
  // quick click used to show "has no documents for you to sign" to a
  // caregiver who had two.
  const [rowsLoaded, setRowsLoaded] = useState(false);
  // SCRUM-141: Respond (was Accept). With documents to sign it goes straight
  // into the SCRUM-118 signing modal; with none, a short confirmation.
  const [responding, setResponding] = useState(false);
  const [confirmRespondOpen, setConfirmRespondOpen] = useState(false);
  // Set by the server once the caregiver has signed everything (or responded
  // with nothing to sign). The card then shows "Submitted" and no action.
  const submittedAt: string | null = offer?.submittedAt ?? null;

  const isNew = moment().diff(moment(offer.createdAt), 'hours') < 24;
  // SCRUM-118: the approved offer box (Figma 10593:3950) carries Job Link,
  // Requested Files and Documents to be signed — and none of the scheduling-era
  // chrome. In credentialing mode there is no shift, rate or start date behind
  // those fields anyway, so they render as "Date TBD", "$—" and a row of dashes.
  const credentialing = isCredentialingMode();
  const isUrgent = !!offer?.urgent;

  // SCRUM-191: what the receipt below may claim.
  //
  // `submittedAt` is resolved server-side and, for an offer that predates
  // SCRUM-141, is INFERRED from the old status (see resolveSubmittedAt) — no
  // packet, no signature. The rows this card lists come from the agency's
  // current library when there is no packet, so "signingRows.length > 0" was
  // never "the caregiver signed": a scheduling-era offer showed the library as
  // "To sign" and, underneath it, "Signed · they can now download your
  // credential package". Only a signed row means signed, and only an Onboard
  // offer releases the package — payment and download wait on that offer's
  // submission, so no other offer gives the agency anything to download.
  const allSigned = signingRows.length > 0 && signingRows.every((r) => r.signed);
  const releasesPackage = offer?.source === 'onboard';

  const partner = offer?.partner;
  const partnerName = partner?.personalInfo
    ? `${partner.personalInfo.firstName ?? ''} ${partner.personalInfo.lastName ?? ''}`.trim()
    : 'Agency';
  const companyName = partner?.personalInfo?.companyName ?? '';
  const partnerImage = partner?.personalInfo?.image || '/dummy-profile-pic.jpg';
  // A dead image link (the signup placeholder is one) falls back to the
  // default avatar instead of a broken-image icon.
  const [avatar, setAvatar] = useState<string>(partnerImage);

  const hourlyRate = offer?.hourlyRate ?? offer?.rate ?? '—';
  const hoursPerShift = offer?.hoursPerShift ?? 6;
  const totalPerShift =
    typeof hourlyRate === 'number' ? hourlyRate * hoursPerShift : null;

  const night = isNightShift(offer?.timeRange);

  // SCRUM-118: e-signature is opt-in per agency, so a failure or empty response
  // just means this offer has nothing to sign and the section stays hidden.
  useEffect(() => {
    const uiStatus = getInitialStatus(offer);
    // 'pending' here is the post-Step-1 state, which is exactly when an
    // unfinished packet needs to be picked back up. A submitted onboarding
    // loads too: its card lists the documents as Signed (Faisal C5).
    const submittedOnboarding = isCredentialingMode() && !!offer?.submittedAt;
    if (uiStatus !== 'received' && uiStatus !== 'pending' && !submittedOnboarding) {
      setRowsLoaded(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/esign/offer/${offer._id}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setSigningRows(toSigningRows(json?.data));
        // SCRUM-118 Scenario 4: a packet that exists but is not finished means
        // the caregiver got through Step 1 and stopped. Without holding onto it
        // there is no route back into signing and the resume requirement cannot
        // be met — the offer stops being 'received' the moment Step 1 submits.
        const existing = json?.data?.packet;
        if (existing && existing.status !== 'completed') setPacket(existing);
      } catch {
        // Silent — the caregiver simply sees no signing section.
      } finally {
        if (!cancelled) setRowsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [offer._id]);

  // SCRUM-118: the application is only complete once the packet is signed, so the
  // success toast and refetch happen here rather than at the end of Step 1.
  const handleSigningComplete = () => {
    setSignOpen(false);
    setPacket(null);
    // Credentialing: the C4 confirmation inside the modal already said it.
    if (!credentialing) toast.success('Application submitted!');
    queryClient.invalidateQueries({ queryKey: ['offers'] });
  };

  /**
   * SCRUM-141: the caregiver's response to an agency's Onboard. The server
   * records the response and snapshots the agency's signing documents into a
   * packet; signing that packet is what submits it. With nothing to sign, the
   * response itself submits.
   */
  const respond = async () => {
    setResponding(true);
    try {
      const formData = new FormData();
      formData.append('offerId', offer._id);
      formData.append('statusUpdates', '[]');
      const res = await fetch(`/api/user/offer/pro-respond?id=${offer._id}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        toast.error(data.message || 'Could not send your response. Try again.');
        return;
      }
      setConfirmRespondOpen(false);

      const started = await fetch(`/api/esign/offer/${offer._id}`, { method: 'POST' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const startedPacket = started?.data ?? null;
      if (startedPacket?.items?.some((i: any) => i.status === 'pending')) {
        setPacket(startedPacket);
        setSignOpen(true);
        return;
      }
      toast.success('Submitted');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    } catch {
      toast.error('Could not send your response. Try again.');
    } finally {
      setResponding(false);
    }
  };

  const onRespondClick = () => {
    if (hasUnfinishedPacket) return setSignOpen(true);
    if (!credentialing) return setApplyOpen(true);
    if (signingRows.length === 0) return setConfirmRespondOpen(true);
    respond();
  };

  const handleNotInterested = async () => {
    try {
      const res = await fetch('/api/user/offer/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer._id,
          status: 'rejected',
          isRemovedByPro: true,
          silent: true,
        }),
      });
      if (res.ok) {
        toast.success('Removed');
        queryClient.invalidateQueries({ queryKey: ['offers'] });
      } else {
        toast.error('Failed to remove. Try again.');
      }
    } catch {
      toast.error('Failed to remove. Try again.');
    }
  };

  return (
    <>
      <div className='flex flex-col items-start gap-4 rounded-[16px] border border-[#DFE2E0] bg-white px-6 py-5'>
        {/* Top row: timestamp + dropdown + rate */}
        <div className='flex w-full items-start justify-between gap-3'>
          <div className='flex flex-col gap-2'>
            <span className='text-[13px] leading-4 text-[#5E6864]'>
              {timeAgo(offer.createdAt)}
            </span>
            {!credentialing && (
              <div className='flex items-center gap-2'>
                {isUrgent && (
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-md bg-red-100 text-red-600 text-xs font-semibold'>
                    URGENT
                  </span>
                )}
                {isNew && (
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold'>
                    NEW
                  </span>
                )}
              </div>
            )}
            {!credentialing && (
              <div className='inline-flex items-center gap-2 text-base md:text-lg font-bold text-gray-900'>
                <Calendar className='size-5 text-gray-400' />
                {offer?.startingDate
                  ? moment(offer.startingDate).format('dddd, MMM DD')
                  : 'Date TBD'}
              </div>
            )}
            <div className={`items-center gap-2 text-xs text-gray-500 ${credentialing ? 'hidden' : 'inline-flex'}`}>
              <span className='inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md'>
                {night ? <Moon className='size-3' /> : <Sun className='size-3' />}
                {night ? 'Night Shift' : 'Day Shift'}
              </span>
              {offer?.distance && (
                <span className='inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md'>
                  <Navigation className='size-3' />
                  {offer.distance}mil away
                </span>
              )}
            </div>
          </div>

          <div className='flex flex-col items-end gap-1'>
            {!(credentialing && submittedAt) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='size-8 -mt-1 -mr-1'>
                  <MoreHorizontal className='size-5 text-gray-500' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={handleNotInterested}>
                  Not interested
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
            {!credentialing && (
              <>
                <p className='text-2xl md:text-3xl font-bold text-gray-900'>
                  ${hourlyRate}
                  <span className='text-sm font-normal text-gray-500'>/hr</span>
                </p>
                <p className='text-xs text-gray-400'>
                  {hoursPerShift} hrs shift{' '}
                  {totalPerShift !== null && `( Total $${totalPerShift} )`}
                </p>
              </>
            )}
          </div>
        </div>

        {!credentialing && (
          <ShiftDetailGrid
            shiftDays={formatShiftDays(offer?.shiftDays)}
            timeRange={offer?.timeRange}
            location={offer?.location}
            position={offer?.position}
          />
        )}

        {/* Agency row — spec: #F2F4F3 fill, 16px padding, 12px radius, 44px
            avatar, 16/19 semibold name over 13/16 company. */}
        <div className='flex w-full items-center justify-between gap-3 rounded-[12px] bg-[#F2F4F3] p-4'>
          <div className='flex items-center gap-3'>
            <Image
              unoptimized
              src={avatar}
              alt={partnerName}
              width={44}
              height={44}
              onError={() => setAvatar('/dummy-profile-pic.jpg')}
              className='size-11 shrink-0 rounded-full object-cover'
            />
            <div className='flex flex-col gap-0.5'>
              <p className='text-[16px] font-semibold leading-[19px] text-[#1C1C1C]'>
                {partnerName}
              </p>
              <p className='text-[13px] leading-4 text-[#5E6864]'>{companyName}</p>
            </div>
          </div>
          {partner?._id && (
            <Link href={`/caregiver/agencies/${partner._id}`}>
              <span className='inline-flex h-[39px] items-center gap-2 rounded-[10px] border border-[#DFE2E0] bg-white pl-[18px] pr-4 text-[14px] font-medium leading-[17px] text-[#1C1C1C] transition-colors hover:bg-[#F9FAFA]'>
                {credentialing ? 'View Agency' : 'View Profile'}
                <ArrowUpRight className='size-4' strokeWidth={1.2} />
              </span>
            </Link>
          )}
        </div>

        {/* Job Link — the design places it directly under the agency row.
            SCRUM-141: retired with the old offer model in credentialing mode. */}
        {!credentialing && offer?.jobLink && (
          <div className='w-full rounded-[12px] border border-[#DFE2E0] bg-white px-4 py-3.5'>
            <div className='flex items-center gap-2'>
              <LinkIcon className='size-[18px] text-[#5E6864]' strokeWidth={1.35} />
              <span className='text-[14px] font-medium leading-[17px] text-[#1C1C1C]'>
                Job Link
              </span>
            </div>
            <a
              href={offer.jobLink}
              target='_blank'
              rel='noopener noreferrer'
              className='mt-2.5 block truncate rounded-lg bg-[#F2F4F3] px-3.5 py-3 text-[13px] leading-4 text-[#008000] hover:underline'
            >
              {offer.jobLink}
            </a>
          </div>
        )}

        {/* Requested files — SCRUM-141: retired in credentialing mode. */}
        {!credentialing && offer?.documentsNeeded && offer.documentsNeeded.length > 0 && (
          <div className='w-full rounded-[12px] border border-[#DFE2E0] bg-white p-4'>
            <p className='mb-3.5 text-[14px] font-semibold leading-[17px] text-[#008000]'>
              Requested Files
            </p>
            <div className='grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2'>
              {offer.documentsNeeded.map((doc: any, i: number) => (
                <div
                  key={i}
                  className='flex items-center gap-2.5'
                >
                  <Check className='size-[18px] shrink-0 text-[#008000]' strokeWidth={1.8} />
                  <span className='truncate text-[14px] font-medium leading-[17px] text-[#1C1C1C]'>
                    {doc.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCRUM-118: documents the agency requires an e-signature on */}
        {signingRows.length > 0 && (
          <div className='w-full rounded-[12px] border border-[#DFE2E0] bg-white p-4'>
            <p className='mb-3.5 text-[14px] font-semibold leading-[17px] text-[#008000]'>
              Documents to be signed
            </p>
            <div className='grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2'>
              {signingRows.map((row) => (
                <div key={row.id} className='flex min-w-0 items-center gap-2.5'>
                  <PenLine className='size-4 shrink-0 text-[#008000]' strokeWidth={1.2} />
                  <span
                    title={row.title}
                    className='min-w-0 flex-1 truncate text-[14px] font-medium leading-[17px] text-[#1C1C1C]'
                  >
                    {row.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full py-[3px] pl-2 pr-2.5 text-[11px] font-semibold leading-[13px] ${
                      row.signed
                        ? 'bg-[#BBF8DC] text-[#01400F]'
                        : 'bg-[#E0FDED] text-[#008000]'
                    }`}
                  >
                    {row.signed ? 'Signed' : 'To sign'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes — SCRUM-141 (Faisal C1): the onboarding card keeps only who
            is asking and what must be signed. */}
        {!credentialing && offer?.notes && offer.notes.length > 0 && (
          <div className='flex items-center gap-2.5 text-[14px] leading-[17px] text-[#1C1C1C]'>
            {/* The design draws a plain grey document glyph here, not a tinted
                tile — the amber chip read as decoration that was not in the frame. */}
            <FileText className='size-[22px] shrink-0 text-[#5E6864]' strokeWidth={1.47} />
            <span>The agency has left additional notes</span>
            <NotesPopup
              notes={offer.notes}
              id={offer._id}
              proId={offer?.pro?._id}
              partnerId={offer?.partner?._id}
            />
          </div>
        )}

        {/* Actions */}
        {/* Spec sizes the actions 340px / 220px rather than splitting the row. */}
        {credentialing && submittedAt ? (
          // SCRUM-141 (Faisal C5): after signing the card carries no action,
          // only a receipt. Nothing is left to do.
          <div data-testid='onboarding-signed' className='flex w-full flex-wrap items-center gap-2.5'>
            <span className='rounded-full bg-[#BBF8DC] px-3 py-1.5 text-[13px] font-medium text-[#01400F]'>
              {allSigned ? 'Signed' : 'Submitted'}
            </span>
            <span className='text-[13px] text-[#6C6C6C]'>
              {allSigned ? 'Signed' : 'Submitted'}{' '}
              {moment(submittedAt).format('MMM D, YYYY')}
              {releasesPackage
                ? ` · ${companyName || partnerName} can now download your credential package.`
                : ''}
            </span>
          </div>
        ) : credentialing ? (
          // SCRUM-141 (Faisal C1): one action, Respond — it opens signing
          // directly. "Not interested" stays reachable from the ⋯ menu.
          <Button
            className='h-12 w-[220px] max-w-full gap-2 rounded-[10px] bg-[#008000] text-[15px] font-semibold leading-[18px] text-white hover:bg-[#016b01]'
            onClick={onRespondClick}
            disabled={responding || !rowsLoaded}
          >
            {(responding || !rowsLoaded) && <Loader2 className='size-4 animate-spin' />}
            {hasUnfinishedPacket ? 'Continue signing' : 'Respond'}
          </Button>
        ) : (
        <div className='flex w-full gap-3'>
          <Button
            className='h-12 w-[340px] max-w-[52%] gap-2 rounded-[10px] bg-[#008000] text-[15px] font-semibold leading-[18px] text-white hover:bg-[#016b01]'
            onClick={onRespondClick}
            disabled={responding}
          >
            {responding && <Loader2 className='size-4 animate-spin' />}
            {hasUnfinishedPacket ? 'Continue signing' : 'Accept'}
          </Button>
          <Button
            variant='outline'
            className='h-12 w-[220px] max-w-[36%] rounded-[10px] border-[#DFE2E0] bg-white text-[15px] font-medium leading-[18px] text-[#6C6C6C] hover:bg-[#F9FAFA]'
            onClick={handleNotInterested}
          >
            Not Interested
          </Button>
        </div>
        )}
      </div>

      {/* SCRUM-141: nothing to sign — confirm before sharing, since responding
          is what lets the agency buy the credential package. */}
      <Dialog open={confirmRespondOpen} onOpenChange={(v) => !responding && setConfirmRespondOpen(v)}>
        <DialogContent className='max-w-[460px] gap-0 p-6'>
          <DialogTitle className='text-[20px] font-bold leading-7 text-[#1C1C1C]'>
            Respond to {companyName || partnerName}?
          </DialogTitle>
          <DialogDescription className='mt-2 text-[14.5px] leading-[22px] text-[#5E6864]'>
            {companyName || partnerName} has no documents for you to sign. When you
            respond, your credential package becomes available for them to
            download.
          </DialogDescription>
          <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
            <Button
              variant='outline'
              onClick={() => setConfirmRespondOpen(false)}
              disabled={responding}
              className='h-11 rounded-[10px] border-[#DFE2E0] px-5 text-[14.5px] font-medium'
            >
              Cancel
            </Button>
            <Button
              onClick={respond}
              disabled={responding}
              className='h-11 gap-2 rounded-[10px] bg-[#008000] px-6 text-[14.5px] font-semibold text-white hover:bg-[#016b01]'
            >
              {responding && <Loader2 className='size-4 animate-spin' />}
              Respond
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ApplyToShiftModal
        open={applyOpen}
        onOpenChange={setApplyOpen}
        shift={offer}
        onProceedToSigning={(startedPacket) => {
          setApplyOpen(false);
          setPacket(startedPacket);
          setSignOpen(true);
        }}
      />

      {packet && (
        <SignDocumentsModal
          open={signOpen}
          onOpenChange={setSignOpen}
          packet={packet}
          onComplete={handleSigningComplete}
          agencyName={companyName || partnerName}
        />
      )}
    </>
  );
};

export default ReceivedCard;
