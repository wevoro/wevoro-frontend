'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Download, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * SCRUM-119 — the caregiver's submitted documents, locked or unlocked.
 *
 * One component for both states, driven by the manifest's `paid` flag rather
 * than a prop, so the lock can never disagree with what the server will
 * actually release. Viewing is free: the manifest returns every file's name,
 * type and size, and withholds only the url.
 */

const money = (cents?: number | null) =>
  cents === null || cents === undefined ? '—' : `$${(cents / 100).toFixed(2)}`;

const firstName = (full?: string) => (full || '').trim().split(/\s+/)[0] || 'this caregiver';

const prettySize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/** PDF red, images green — matching the design's file badges. */
const fileBadge = (mimeType?: string | null, title?: string) => {
  const s = `${mimeType || ''} ${title || ''}`.toLowerCase();
  if (s.includes('jpg') || s.includes('jpeg') || s.includes('png') || s.includes('image')) {
    return { label: s.includes('png') ? 'PNG' : 'JPG', className: 'bg-[#22B14C]' };
  }
  return { label: 'PDF', className: 'bg-[#E5342A]' };
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

  const downloadAll = () => {
    const withUrl = docs.filter((d: any) => d.url);
    if (!withUrl.length) {
      toast.error('No downloadable documents found');
      return;
    }
    withUrl.forEach((d: any, i: number) => {
      // Staggered: browsers drop simultaneous programmatic downloads.
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = d.url;
        a.download = d.title || 'credential';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 300);
    });
    toast.success(`Downloading ${withUrl.length} documents for ${name}`);
  };

  const downloadOne = (doc: any) => {
    if (!doc.url) return;
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.title || 'credential';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Same reason as the payment gate: a caregiver with many credentials
          makes this taller than the viewport, and a centred dialog with no cap
          overflows off both edges with no way to reach the button. */}
      <DialogContent className='max-h-[92vh] max-w-[640px] gap-0 overflow-y-auto overscroll-contain p-0'>
        <div className='px-6 pt-6'>
          <h2 className='text-[21px] font-bold text-[#1C1C1C]'>{name}&apos;s documents</h2>
          <p className='mt-1 text-[13.5px] text-[#6C6C6C]'>
            Submitted for your offer
            {onboardedAt ? ` · Onboarded ${onboardedAt}` : ''}
          </p>
        </div>

        {loading ? (
          <p className='px-6 py-10 text-center text-[14px] text-[#6C6C6C]'>Loading documents…</p>
        ) : (
          <>
            {/* Banner — the one thing that differs most between the two states */}
            <div className='px-6 pt-5'>
              {paid ? (
                <div className='flex items-start gap-3 rounded-lg bg-[#E9F7EE] px-4 py-3.5'>
                  <Check className='mt-0.5 size-4 shrink-0 text-[#046A22]' strokeWidth={3} />
                  <p className='text-[14px] font-semibold leading-[21px] text-[#046A22]'>
                    Unlocked — {firstName(name)}&apos;s documents are ready to download. Receipt
                    sent to your email.
                  </p>
                </div>
              ) : (
                <div className='flex items-start gap-3 rounded-lg bg-[#FDF6E3] px-4 py-3.5'>
                  <Lock className='mt-0.5 size-4 shrink-0 text-[#8A5D06]' />
                  <p className='text-[14px] font-semibold leading-[21px] text-[#8A5D06]'>
                    These files are locked. Pay {money(manifest?.priceCents)} to unlock and
                    download everything {firstName(name)} submitted.
                  </p>
                </div>
              )}
            </div>

            {/* Included, not charged for */}
            <div className='px-6 pt-3'>
              <div className='flex items-center justify-between gap-3 rounded-lg border border-[#DFE2E0] px-4 py-3'>
                <div className='min-w-0'>
                  <p className='text-[14px] font-semibold text-[#1C1C1C]'>E-signature tracking</p>
                  <p className='truncate text-[12.5px] text-[#6C6C6C]'>
                    {paid
                      ? 'Included with the packet — no extra charge'
                      : 'Included — runs in the background, separate from payment'}
                  </p>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <span className='inline-flex items-center gap-1.5 rounded-full bg-[#FDF4E3] px-2.5 py-1 text-[11.5px] font-medium text-[#8A5D06]'>
                    <span className='size-1.5 rounded-full bg-[#C8901A]' />
                    In progress
                  </span>
                  <span className='rounded-full bg-[#DDF3E4] px-2.5 py-1 text-[11.5px] font-medium text-[#046A22]'>
                    Included
                  </span>
                </div>
              </div>
            </div>

            {/* Files */}
            <div className='px-6 pt-4'>
              <div className='overflow-hidden rounded-xl border border-[#DFE2E0]'>
                {docs.length === 0 ? (
                  <p className='px-4 py-6 text-[14px] text-[#6C6C6C]'>
                    This caregiver has not submitted any documents yet.
                  </p>
                ) : (
                  docs.map((d: any) => {
                    const badge = fileBadge(d.mimeType, d.title);
                    const size = prettySize(d.fileSize);
                    return (
                      <div
                        key={String(d._id)}
                        className='flex items-center gap-3.5 border-b border-[#DFE2E0] px-4 py-3.5 last:border-0'
                      >
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[10.5px] font-bold text-white ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-[14.5px] font-semibold text-[#1C1C1C]'>
                            {d.title}
                          </p>
                          <p className='text-[12.5px] text-[#6C6C6C]'>
                            {badge.label}
                            {size ? ` · ${size}` : ''}
                          </p>
                        </div>
                        {paid && d.url ? (
                          <button
                            type='button'
                            onClick={() => downloadOne(d)}
                            aria-label={`Download ${d.title}`}
                            className='shrink-0 text-[#046A22] transition-opacity hover:opacity-70'
                          >
                            <Download className='size-[18px]' />
                          </button>
                        ) : (
                          <Lock className='size-[17px] shrink-0 text-[#9CA3A0]' />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className='px-6 pb-6 pt-5'>
              {paid ? (
                <Button
                  onClick={downloadAll}
                  className='h-12 w-full gap-2 rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
                >
                  <Download className='size-4' />
                  Download all (ZIP)
                </Button>
              ) : (
                <Button
                  onClick={onUnlock}
                  className='h-12 w-full gap-2 rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
                >
                  <Lock className='size-4' />
                  Unlock &amp; download all · {money(manifest?.priceCents)}
                </Button>
              )}
              <p className='mt-3 text-center text-[12.5px] text-[#6C6C6C]'>
                {paid
                  ? 'Free · you already paid · re-downloads anytime'
                  : "One-time payment · unlocks this caregiver's documents · re-downloads free"}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PacketDocumentsModal;
