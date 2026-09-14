'use client';

// SCRUM-118: caregiver-facing signing modal (step 2 of the offer flow).
// Documents are signed one at a time and in order. The packet returned by the
// API is the source of truth for what is still pending, so re-opening the modal
// resumes at the first unsigned document instead of restarting at document 1.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import DrawSignatureModal from './draw-signature-modal';

interface SignDocumentsModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  packet: any;
  onComplete?: () => void;
}

// Browsers report fractional scroll heights on zoomed / hi-dpi displays, so an
// exact bottom match never fires — treat "within 24px" as the end of the doc.
const SCROLL_BOTTOM_TOLERANCE = 24;

// Widths for the placeholder body used when an item carries no fileUrl, so the
// pane still reads as a document (and stays tall enough to require scrolling).
const SKELETON_WIDTHS = [
  'w-full',
  'w-11/12',
  'w-full',
  'w-9/12',
  'w-full',
  'w-10/12',
  'w-full',
  'w-8/12',
  'w-full',
  'w-11/12',
  'w-7/12',
  'w-full',
  'w-10/12',
  'w-full',
  'w-9/12',
];

function formatStampTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SignDocumentsModal({
  open,
  onOpenChange,
  packet,
  onComplete,
}: SignDocumentsModalProps) {
  const [localPacket, setLocalPacket] = useState<any>(packet);
  const [index, setIndex] = useState(0);
  // Scroll gate and applied stamps are keyed by item id, so advancing to the
  // next document automatically starts it locked again.
  const [readIds, setReadIds] = useState<string[]>([]);
  const [stampedAt, setStampedAt] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const paneRef = useRef<HTMLDivElement>(null);
  // Read the freshest packet inside the seed effect without making the whole
  // object a dependency — the parent re-creates it on every render.
  const packetRef = useRef(packet);
  packetRef.current = packet;

  const packetId = packet?._id;
  const items: any[] = useMemo(() => localPacket?.items ?? [], [localPacket]);

  useEffect(() => {
    if (!open) return;
    const source = packetRef.current;
    const sourceItems: any[] = source?.items ?? [];
    const firstPending = sourceItems.findIndex((item) => item.status === 'pending');
    setLocalPacket(source);
    setIndex(firstPending === -1 ? 0 : firstPending);
    setReadIds([]);
    setStampedAt({});
    setSubmitting(false);
    setCompleted(source?.status === 'completed');
  }, [open, packetId]);

  // The document awaiting a signature. 'outdated' items were replaced after the
  // packet was issued, so they are never presented as the active document.
  const activeIndex = useMemo(() => {
    const pending = items.findIndex((item) => item.status === 'pending');
    return pending === -1 ? Math.max(items.length - 1, 0) : pending;
  }, [items]);

  const currentItem = items[index];
  const currentId: string | undefined = currentItem?._id;
  const isOutdated = currentItem?.status === 'outdated';
  // Anything that is not the active pending document is a review-only look back.
  const isReadOnly =
    !currentItem || currentItem.status !== 'pending' || index !== activeIndex;

  // Declared before the derived flags below, which read `signature`.
  const [drawOpen, setDrawOpen] = React.useState(false);
  const [signature, setSignature] = React.useState<string | null>(
    localPacket?.signatureImage ?? null
  );

  const hasRead = !!currentId && readIds.includes(currentId);
  // Both halves matter: the seal must have been applied to THIS document, and
  // a drawing must actually exist to apply. Checking only the stamp let a
  // document be submitted with no signature behind it.
  const hasStamp = !!currentId && !!stampedAt[currentId] && !!signature;
  const showStamp = hasStamp || currentItem?.status === 'signed';

  const markRead = useCallback((id?: string) => {
    if (!id) return;
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const evaluateScrollGate = useCallback(() => {
    const pane = paneRef.current;
    if (!pane || !currentId) return;
    // One formula covers both cases: a document shorter than the pane has no
    // scrollbar at all, which counts as already read rather than trapping the
    // caregiver behind a button that could never enable.
    const distanceToBottom = pane.scrollHeight - pane.scrollTop - pane.clientHeight;
    if (distanceToBottom <= SCROLL_BOTTOM_TOLERANCE) markRead(currentId);
  }, [currentId, markRead]);

  // Every document starts at the top and is re-measured: a short one unlocks
  // immediately, a long one has to be scrolled through.
  useEffect(() => {
    if (!open || completed) return;
    const pane = paneRef.current;
    if (pane) pane.scrollTop = 0;
    const frame = requestAnimationFrame(evaluateScrollGate);
    return () => cancelAnimationFrame(frame);
  }, [open, completed, index, evaluateScrollGate]);

  // The drawing is captured once for the whole packet; on later documents the
  // "Sign here" target applies the signature already on file rather than
  // asking again.

  const handleAdoptStamp = () => {
    if (!currentId || isReadOnly) return;
    if (!signature) {
      setDrawOpen(true);
      return;
    }
    setStampedAt((prev) => ({ ...prev, [currentId]: new Date().toISOString() }));
  };

  const handleDrawn = (dataUrl: string) => {
    setSignature(dataUrl);
    if (currentId) {
      setStampedAt((prev) => ({ ...prev, [currentId]: new Date().toISOString() }));
    }
  };

  const isLastToSign = !items.some(
    (item, i) => i > index && item.status === 'pending'
  );

  const handleSign = async () => {
    if (!currentItem || !localPacket?._id) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/esign/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packetId: localPacket._id,
          itemId: currentItem._id,
          // Only needs to travel once; the backend keeps the first one.
          signatureImage: localPacket.signatureImage ? undefined : signature,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.data) {
        toast.error(json?.message || 'Could not sign this document. Please try again.');
        return;
      }

      const updated = json.data;
      setLocalPacket(updated);
      if (updated.status === 'completed') {
        setCompleted(true);
        return;
      }

      const nextPending = (updated.items ?? []).findIndex(
        (item: any) => item.status === 'pending'
      );
      if (nextPending === -1) {
        setCompleted(true);
        return;
      }
      setIndex(nextPending);
    } catch {
      toast.error('Could not sign this document. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    onComplete?.();
    onOpenChange(false);
  };

  if (!packet) return null;

  const stampName = localPacket?.stampName ?? '';
  const stampId = localPacket?.stampId ?? '';
  const stampTime =
    formatStampTime(currentId ? stampedAt[currentId] : undefined) ||
    formatStampTime(currentItem?.signedAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[960px] gap-0 overflow-hidden rounded-2xl p-0'>
        <DialogHeader className='px-6 pb-4 pt-6'>
          <div className='flex items-center gap-3'>
            <DialogTitle className='text-xl font-semibold text-[#1C1C1C]'>
              Sign your documents
            </DialogTitle>
            <span className='rounded-full bg-[#ECFAF0] px-3 py-1 text-[12px] font-medium text-[#008000]'>
              Step 2 of 2
            </span>
          </div>
          <DialogDescription className='sr-only'>
            Read each document and apply your signature to complete your onboarding
            paperwork.
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className='flex flex-col items-center px-6 pb-8 pt-4 text-center'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFAF0]'>
              <Check className='h-8 w-8 text-[#008000]' strokeWidth={3} />
            </div>
            <h3 className='mt-5 text-lg font-semibold text-[#1C1C1C]'>
              All documents signed
            </h3>
            <p className='mt-2 max-w-sm text-sm text-[#6C6C6C]'>
              Your agency has been notified. Nothing else is needed from you.
            </p>
            <Button
              className='mt-6 h-11 rounded-xl bg-[#008000] px-8 font-semibold text-white hover:bg-[#01400F]'
              onClick={handleDone}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className='flex items-center justify-between bg-[#F4F5F6] px-6 py-3'>
              <span className='flex items-center gap-2 text-[13px] text-[#5E6864]'>
                <Lock className='h-4 w-4' />
                Secure signing powered by SignWell
              </span>
              <span className='text-[13px] font-semibold text-[#008000]'>
                Document {index + 1} of {items.length}
              </span>
            </div>

            <div className='flex flex-wrap gap-2 px-6 py-4'>
              {items.map((item, i) => {
                const isActive = i === index;
                const isSigned = item.status === 'signed';
                // Signing is sequential, so nothing ahead of the active document
                // opens; a signed chip only re-displays that document read-only.
                const clickable = isSigned || i === activeIndex;
                return (
                  <button
                    key={item._id}
                    type='button'
                    disabled={!clickable}
                    onClick={() => setIndex(i)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                      isActive
                        ? 'bg-[#ECFAF0] text-[#008000]'
                        : 'bg-[#F4F5F6] text-[#6C6C6C]'
                    } ${clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                  >
                    {isSigned && !isActive ? (
                      <Check className='h-3.5 w-3.5 text-[#008000]' strokeWidth={3} />
                    ) : (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isActive ? 'bg-[#008000]' : 'bg-[#6C6C6C]'
                        }`}
                      />
                    )}
                    <span className='max-w-[180px] truncate'>{item.title}</span>
                  </button>
                );
              })}
            </div>

            <div className='px-6'>
              <div
                ref={paneRef}
                onScroll={evaluateScrollGate}
                className='max-h-[300px] overflow-y-auto rounded-xl border border-[#DFE2E0] bg-white p-6'
              >
                <h3 className='text-[17px] font-semibold text-[#1C1C1C]'>
                  {currentItem?.title}
                </h3>

                {isOutdated && (
                  <p className='mt-2 text-[13px] text-[#6C6C6C]'>
                    Replaced by a newer version
                  </p>
                )}

                <div className={isOutdated ? 'pointer-events-none opacity-50' : undefined}>
                  {currentItem?.fileUrl ? (
                    // #toolbar=0 hides the browser's built-in PDF chrome. Left
                    // on, it hands the caregiver a text/draw/highlight toolbar
                    // over a document they are about to sign — edits that are
                    // never persisted and never part of what gets signed, so the
                    // screen implies they changed something when they did not.
                    // It also offers Print and Download, neither of which is in
                    // the design.
                    <iframe
                      key={currentItem._id}
                      src={`${currentItem.fileUrl}#toolbar=0&navpanes=0&statusbar=0&view=FitH`}
                      title={currentItem.title}
                      onLoad={evaluateScrollGate}
                      className='mt-4 h-[420px] w-full rounded-lg border border-[#DFE2E0]'
                    />
                  ) : (
                    <div className='mt-4 space-y-3'>
                      {SKELETON_WIDTHS.map((width, i) => (
                        <div key={i} className={`h-3 rounded-full bg-[#F2F4F3] ${width}`} />
                      ))}
                    </div>
                  )}

                  {showStamp ? (
                    // The approved stamp is a round seal, not a signature card:
                    // "Signed by" over the name over the Wevoro wordmark, inside
                    // a 2px green ring (Figma 10769:1551). Time and signature id
                    // sit outside it so the seal itself stays clean.
                    <div className='mt-6 flex items-center gap-4'>
                      {/* The caregiver's drawing IS the mark, so it sits inside
                          the seal where the printed name used to be. */}
                      <div className='flex h-[140px] w-[140px] shrink-0 flex-col items-center justify-center rounded-full border-2 border-[#22B14C] bg-white px-3 text-center'>
                        <span className='font-serif text-[11px] text-[#6C6C6C]'>Signed by</span>
                        {signature ? (
                          <img
                            src={signature}
                            alt='Your signature'
                            className='my-1 h-[46px] w-full object-contain'
                          />
                        ) : (
                          <span className='my-1 line-clamp-2 text-[13px] font-bold leading-tight text-[#008000]'>
                            {stampName}
                          </span>
                        )}
                        <span className='font-serif text-[13px] text-[#008000]'>Wevoro</span>
                      </div>
                      <div className='text-[11px] leading-[17px] text-[#6C6C6C]'>
                        <p>{stampTime}</p>
                        <p>Signature ID {stampId}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={handleAdoptStamp}
                      disabled={isReadOnly}
                      className='mt-6 w-full rounded-[10px] border-2 border-dashed border-[#008000] bg-[#F1FBF4] p-4 text-left disabled:cursor-not-allowed'
                    >
                      <span className='block text-sm font-bold text-[#008000]'>Sign here</span>
                      <span className='mt-1 block text-[13px] text-[#6C6C6C]'>
                        Click to add your signature
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className='mt-5 flex flex-col gap-3 border-t border-[#DFE2E0] px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-[13px] text-[#6C6C6C]'>
                {!isReadOnly && !hasRead
                  ? 'Scroll to the end of the document to enable signing.'
                  : ''}
              </p>
              <div className='flex items-center gap-3'>
                <Button
                  variant='outline'
                  className='h-11 rounded-xl border-[#DFE2E0] px-6 font-semibold text-[#1C1C1C]'
                  disabled={index === 0 || submitting}
                  onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
                >
                  Back
                </Button>
                {isReadOnly ? (
                  <Button
                    className='h-11 rounded-xl bg-[#008000] px-6 font-semibold text-white hover:bg-[#01400F]'
                    onClick={() => setIndex(activeIndex)}
                  >
                    Return to current document
                  </Button>
                ) : (
                  <Button
                    className='h-11 rounded-xl bg-[#008000] px-6 font-semibold text-white hover:bg-[#01400F]'
                    disabled={!hasRead || !hasStamp || submitting}
                    onClick={handleSign}
                  >
                    {submitting ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : isLastToSign ? (
                      'Adopt & sign — Submit'
                    ) : (
                      'Adopt & sign — next document'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
      <DrawSignatureModal
        open={drawOpen}
        onOpenChange={setDrawOpen}
        signerName={stampName}
        onAdopt={handleDrawn}
      />
    </Dialog>
  );
}
