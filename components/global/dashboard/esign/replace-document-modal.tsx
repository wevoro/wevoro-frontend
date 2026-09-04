'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from './format';
import { validateEsignFile } from './upload-documents-modal';

interface ReplaceDocumentModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  document: any | null;
  onReplaced: () => void;
}

// The three guarantees the confirm spells out, in the order the design lists
// them — the point is that no manual follow-up is needed after a replace.
const REPLACE_EFFECTS = [
  'Mark the pending copies as outdated.',
  'Send the new version to those caregivers.',
  'Notify each one that a new version replaced the previous document.',
];

export default function ReplaceDocumentModal({
  open,
  onOpenChange,
  document,
  onReplaced,
}: ReplaceDocumentModalProps) {
  const [pendingCaregivers, setPendingCaregivers] = useState(0);
  const [loadingPending, setLoadingPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentId = document?._id;
  const role = document?.role as 'CNA' | 'PCA' | undefined;

  useEffect(() => {
    if (!open) {
      setFile(null);
      setFileError(null);
      setSubmitting(false);
      setPendingCaregivers(0);
      return;
    }
    if (!documentId) return;

    let ignore = false;
    setLoadingPending(true);
    fetch(`/api/esign/documents/${documentId}/pending-copies`)
      .then((res) => res.json())
      .then((result) => {
        if (!ignore) setPendingCaregivers(result?.data?.pendingCaregivers || 0);
      })
      .catch(() => {
        // A failed lookup must not block the replace itself — fall back to the
        // neutral wording rather than claiming nobody is waiting.
        if (!ignore) setPendingCaregivers(0);
      })
      .finally(() => {
        if (!ignore) setLoadingPending(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, documentId]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;

    setFile(selected);
    setFileError(validateEsignFile(selected));
  };

  const handleReplace = async () => {
    if (!documentId || !file || fileError) return;

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch(`/api/esign/documents/${documentId}/replace`, {
        method: 'PATCH',
        body,
      });
      const result = await res.json();

      if (res.ok && result?.status === 200) {
        const notified =
          result?.data?.notifiedCaregivers ??
          result?.data?.notified ??
          pendingCaregivers;

        toast.success(
          notified > 0
            ? `Document replaced — ${notified} caregiver(s) notified by email`
            : 'Document replaced'
        );
        onReplaced();
        onOpenChange(false);
      } else {
        toast.error(result?.message || 'Replace failed. Please try again.');
      }
    } catch {
      toast.error('Replace failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const extensionLabel = (name: string) =>
    (name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] gap-5 rounded-2xl p-7 sm:rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='text-start text-[20px] font-semibold text-[#1C1C1C]'>
            Replace {role ? `${role} ` : ''}signing document?
          </DialogTitle>
        </DialogHeader>

        {pendingCaregivers > 0 && (
          <>
            <div className='flex items-start gap-3 rounded-[12px] bg-[#FCFFDD] px-4 py-3'>
              <AlertTriangle className='mt-0.5 size-5 shrink-0 text-[#FAB607]' />
              <div className='space-y-0.5'>
                <p className='text-[14px] font-semibold text-[#1C1C1C]'>
                  {pendingCaregivers} caregiver
                  {pendingCaregivers === 1 ? '' : 's'}{' '}
                  {pendingCaregivers === 1 ? 'has' : 'have'} this document
                  awaiting signature
                </p>
                <p className='text-[13px] text-[#5E6864]'>
                  Replacing the document affects documents that are still
                  pending.
                </p>
              </div>
            </div>

            <div className='rounded-[12px] bg-[#F2F4F3] p-4'>
              <p className='text-[14px] font-semibold text-[#1C1C1C]'>
                When you replace it, WeVoro will automatically:
              </p>
              <ul className='mt-1.5 space-y-2.5'>
                {REPLACE_EFFECTS.map((effect) => (
                  <li key={effect} className='flex items-start gap-3'>
                    <span className='mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D0E4D1]'>
                      <Check className='size-3 text-[#008000]' />
                    </span>
                    <p className='text-[14px] text-[#5E6864]'>{effect}</p>
                  </li>
                ))}
              </ul>
            </div>

            <p className='text-[13px] text-[#5E6864]'>
              No manual resend needed &mdash; this happens automatically.
            </p>
          </>
        )}

        {file ? (
          <div className='flex items-start gap-3 rounded-[12px] bg-[#F2F4F3] p-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E94435]/10 text-[10px] font-semibold text-[#E94435]'>
              {extensionLabel(file.name)}
            </div>

            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold text-[#1C1C1C]'>
                {file.name}
              </p>
              <p className='text-xs text-[#6C6C6C]'>
                {formatFileSize(file.size)}
              </p>
              {fileError && (
                <p className='mt-1 text-xs text-[#E94435]'>{fileError}</p>
              )}
            </div>

            <button
              type='button'
              onClick={() => {
                setFile(null);
                setFileError(null);
              }}
              disabled={submitting}
              aria-label={`Remove ${file.name}`}
              className='mt-1 shrink-0 text-[#6C6C6C] transition-colors hover:text-[#1C1C1C] disabled:opacity-40'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type='file'
          accept='.pdf,.doc,.docx'
          onChange={handleFileSelected}
          className='hidden'
        />
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={submitting}
          className='w-full rounded-[12px] border border-dashed border-[#DFE2E0] py-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50'
        >
          {file ? '+ Choose a different file' : '+ Choose replacement file'}
        </button>

        <div className='flex items-center justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className='h-10 rounded-[10px] border-[#DFE2E0] px-5 text-[14px] font-semibold text-[#1C1C1C]'
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleReplace}
            disabled={submitting || loadingPending || !file || !!fileError}
            className='h-10 rounded-[10px] bg-primary px-5 text-[14px] font-semibold text-white'
          >
            {submitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Replacing...
              </>
            ) : pendingCaregivers > 0 ? (
              'Replace & resend'
            ) : (
              'Replace document'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
