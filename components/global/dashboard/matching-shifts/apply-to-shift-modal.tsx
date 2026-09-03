'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import moment from 'moment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  Sun,
  Moon,
  Navigation,
  Check,
  CloudUpload,
  Loader2,
  X,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useQueryClient } from '@tanstack/react-query';
import ApplyConfirmDialog from './apply-confirm-dialog';

interface ApplyToShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any;
  // SCRUM-118: supplied only by call sites that own the Step 2 signing modal.
  onProceedToSigning?: (packet: any) => void;
}

interface ResolvedDoc {
  title: string;
  // Existing uploaded credential matched by title
  matched?: any;
  // New file the user has just selected for upload
  uploadingFile?: File;
}

function normalizeTitle(t: string) {
  return (t ?? '').trim().toLowerCase();
}

function formatShiftDays(days?: string[]): string {
  if (!days || days.length === 0) return '';
  const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (days.length === 7) return 'Every day';
  return order.filter((d) => days.includes(d)).join(', ');
}

const ApplyToShiftModal: React.FC<ApplyToShiftModalProps> = ({
  open,
  onOpenChange,
  shift,
  onProceedToSigning,
}) => {
  const queryClient = useQueryClient();
  const { data: existingDocs } = useDocuments();
  const [resolved, setResolved] = useState<Record<string, ResolvedDoc>>({});
  const [consent, setConsent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const requested = shift?.documentsNeeded ?? [];

  // Auto-match requested documents against the caregiver's uploaded credentials.
  useEffect(() => {
    if (!open) return;
    const map: Record<string, ResolvedDoc> = {};
    requested.forEach((req: any) => {
      const matched = (existingDocs ?? []).find(
        (d: any) => normalizeTitle(d.title) === normalizeTitle(req.title),
      );
      map[req.title] = { title: req.title, matched };
    });
    setResolved(map);
    setConsent(false);
  }, [open, existingDocs, shift?._id]);

  const handleFileSelect = (
    title: string,
    file: File | null,
  ) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be 5MB or smaller.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['doc', 'docx', 'pdf'].includes(ext)) {
      toast.error('Only doc or pdf formats are supported.');
      return;
    }
    setResolved((prev) => ({
      ...prev,
      [title]: { ...prev[title], uploadingFile: file },
    }));
  };

  const clearFile = (title: string) => {
    setResolved((prev) => ({
      ...prev,
      [title]: { ...prev[title], uploadingFile: undefined },
    }));
    const input = fileRefs.current[title];
    if (input) input.value = '';
  };

  // All requested docs must be either matched OR have a newly selected file.
  // An offer that requests no files has nothing to fulfil. The old
  // `requested.length > 0` made that case permanently unsubmittable, which
  // SCRUM-118 turns from a corner case into a normal one: an agency may want
  // signatures only and request no uploads at all.
  const allFulfilled = useMemo(
    () =>
      requested.every((req: any) => {
        const r = resolved[req.title];
        return !!(r?.matched || r?.uploadingFile);
      }),
    [requested, resolved],
  );

  const canSubmit = allFulfilled && consent && !submitting;

  // SCRUM-118: e-signature is optional per agency, so a failure here must never
  // block an application the backend has already accepted.
  const startSignaturePacket = async () => {
    try {
      const res = await fetch(`/api/esign/offer/${shift._id}`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data ?? null;
    } catch {
      return null;
    }
  };

  const handleConfirmedSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('offerId', shift._id);
      formData.append('consent', 'true');

      // Build action payload describing each requested document.
      const docActions = requested.map((req: any) => {
        const r = resolved[req.title];
        if (r?.matched) {
          return {
            title: req.title,
            action: 'grant',
            documentId: r.matched._id,
          };
        }
        if (r?.uploadingFile) {
          formData.append(`file_${req.title}`, r.uploadingFile);
          return { title: req.title, action: 'upload' };
        }
        return { title: req.title, action: 'pending' };
      });

      formData.append('docActions', JSON.stringify(docActions));

      const res = await fetch(`/api/user/offer/pro-respond?id=${shift._id}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.status === 200 || res.ok) {
        setConfirmOpen(false);

        // SCRUM-118: hand off to Step 2 when the agency has documents to sign —
        // the parent closes this modal, so don't end the flow or refetch here.
        const packet = await startSignaturePacket();
        const hasPending = packet?.items?.some(
          (item: any) => item.status === 'pending',
        );
        if (hasPending && onProceedToSigning) {
          onProceedToSigning(packet);
          return;
        }

        toast.success('Application submitted!');
        queryClient.invalidateQueries({ queryKey: ['offers'] });
        onOpenChange(false);
      } else {
        toast.error(data.message || 'Failed to submit application');
      }
    } catch {
      toast.error('Failed to submit application. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const partner = shift?.partner;
  const partnerName = partner?.personalInfo
    ? `${partner.personalInfo.firstName ?? ''} ${partner.personalInfo.lastName ?? ''}`.trim()
    : 'Agency';
  const companyName = partner?.personalInfo?.companyName ?? '';
  const partnerImage = partner?.personalInfo?.image || '/dummy-profile-pic.jpg';
  const isNight = shift?.shiftType === 'night';

  const hourlyRate = shift?.hourlyRate ?? shift?.rate ?? '—';
  const hoursPerShift = shift?.hoursPerShift ?? 6;
  const totalPerShift =
    typeof hourlyRate === 'number' ? hourlyRate * hoursPerShift : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-full sm:max-w-[680px] p-0'>
          <DialogHeader className='px-6 pt-6'>
            <DialogTitle className='text-xl font-bold text-gray-900 flex items-center gap-2'>
              Respond to offer
              <span className='inline-flex items-center rounded-full bg-[#ECFAF0] px-2.5 py-1 text-xs font-medium text-primary'>
                Step 1 of 2
              </span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className='max-h-[75vh]'>
            <div className='px-6 pb-6 flex flex-col gap-5'>
              {/* Shift details */}
              <div className='border border-gray-200 rounded-2xl p-5 flex flex-col gap-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex flex-col gap-2'>
                    <div className='inline-flex items-center gap-2 text-base font-semibold text-gray-900'>
                      <Calendar className='size-5 text-gray-400' />
                      {shift?.startingDate
                        ? moment(shift.startingDate).format('dddd, MMM DD')
                        : 'Date TBD'}
                    </div>
                    <div className='inline-flex items-center gap-2 text-xs text-gray-500'>
                      <span className='inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md'>
                        {isNight ? (
                          <Moon className='size-3' />
                        ) : (
                          <Sun className='size-3' />
                        )}
                        {isNight ? 'Night Shift' : 'Day Shift'}
                      </span>
                      {shift?.distance && (
                        <span className='inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md'>
                          <Navigation className='size-3' />
                          {shift.distance}mil away
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold text-gray-900'>
                      ${hourlyRate}
                      <span className='text-sm font-normal text-gray-500'>
                        /hr
                      </span>
                    </p>
                    <p className='text-xs text-gray-400'>
                      {hoursPerShift} hrs shift{' '}
                      {totalPerShift !== null && `( Total $${totalPerShift} )`}
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-3'>
                  <div>
                    <p className='text-xs text-gray-400 uppercase mb-1 flex items-center gap-1'>
                      <Clock className='size-3' /> Shift Days
                    </p>
                    <p className='text-sm font-medium text-gray-900'>
                      {formatShiftDays(shift?.shiftDays) || '—'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-400 uppercase mb-1 flex items-center gap-1'>
                      <Clock className='size-3' /> Time Range
                    </p>
                    <p className='text-sm font-medium text-gray-900'>
                      {shift?.timeRange ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-400 uppercase mb-1 flex items-center gap-1'>
                      <MapPin className='size-3' /> Location
                    </p>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {shift?.location ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-400 uppercase mb-1 flex items-center gap-1'>
                      <Briefcase className='size-3' /> Position
                    </p>
                    <p className='text-sm font-medium text-gray-900'>
                      {shift?.position ?? '—'}
                    </p>
                  </div>
                </div>

                <div className='flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3'>
                  <div className='flex items-center gap-3'>
                    <Image
                      unoptimized
                      src={partnerImage}
                      alt={partnerName}
                      width={40}
                      height={40}
                      className='rounded-full object-cover size-10'
                    />
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>
                        {partnerName}
                      </p>
                      <p className='text-xs text-gray-500'>{companyName}</p>
                    </div>
                  </div>
                  {partner?._id && (
                    <Link href={`/pro/partner/${partner._id}`}>
                      <Button
                        variant='outline'
                        size='sm'
                        className='rounded-lg border-primary text-primary hover:bg-primary/5'
                      >
                        View Profile ↗
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Requested documents */}
              {requested.length > 0 && (
                <div>
                  <p className='text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <FileText className='size-4 text-gray-500' />
                    The client is requesting:
                  </p>

                  <div className='flex flex-col gap-3'>
                    {requested.map((req: any) => {
                      const r = resolved[req.title];
                      const isMatched = !!r?.matched;
                      const isUploading = !!r?.uploadingFile;
                      const isFulfilled = isMatched || isUploading;

                      return (
                        <div
                          key={req.title}
                          className='flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3'
                        >
                          <div className='flex items-center gap-3 min-w-0'>
                            <span
                              className={`shrink-0 size-6 rounded-full flex items-center justify-center ${
                                isFulfilled
                                  ? 'bg-primary text-white'
                                  : 'border-2 border-gray-200 text-gray-300'
                              }`}
                            >
                              <Check className='size-3.5' strokeWidth={3} />
                            </span>
                            <div className='min-w-0'>
                              <p className='text-sm font-medium text-gray-900 truncate'>
                                {req.title}
                              </p>
                              {isUploading && (
                                <p className='text-xs text-primary truncate'>
                                  {r!.uploadingFile!.name}
                                </p>
                              )}
                              {!isFulfilled && (
                                <p className='text-xs text-gray-400'>
                                  doc or pdf formats, up to 5MB
                                </p>
                              )}
                            </div>
                          </div>

                          {isMatched ? (
                            <span className='text-xs font-medium text-primary shrink-0'>
                              Matched ✓
                            </span>
                          ) : isUploading ? (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => clearFile(req.title)}
                              className='shrink-0 text-gray-500 hover:text-red-500 gap-1'
                            >
                              <X className='size-4' />
                              Clear
                            </Button>
                          ) : (
                            <>
                              <input
                                ref={(el) => {
                                  fileRefs.current[req.title] = el;
                                }}
                                type='file'
                                accept='.doc,.docx,.pdf'
                                className='hidden'
                                onChange={(e) =>
                                  handleFileSelect(
                                    req.title,
                                    e.target.files?.[0] ?? null,
                                  )
                                }
                              />
                              <Button
                                variant='outline'
                                size='sm'
                                className='shrink-0 gap-1 border-primary text-primary hover:bg-primary/5'
                                onClick={() =>
                                  fileRefs.current[req.title]?.click()
                                }
                              >
                                <CloudUpload className='size-4' />
                                Upload
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Consent */}
              <label className='flex items-start gap-3 cursor-pointer'>
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className='mt-0.5'
                />
                <span className='text-sm text-gray-700'>
                  I approve the agencies to access the provided documents. This
                  is important for the hiring process.
                </span>
              </label>

              {/* Actions */}
              <div className='flex gap-3 pt-2'>
                <Button
                  variant='outline'
                  className='flex-1 h-12 rounded-xl border-gray-200 text-gray-800'
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  className='flex-1 h-12 rounded-xl font-semibold gap-2'
                  disabled={!canSubmit}
                  onClick={() => setConfirmOpen(true)}
                >
                  {submitting ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <>
                      Next
                      <ArrowRight className='size-4' />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ApplyConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmedSubmit}
        loading={submitting}
      />
    </>
  );
};

export default ApplyToShiftModal;
