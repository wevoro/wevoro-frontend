'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from './format';
import { validateEsignFile } from './upload-documents-modal';

interface ReplaceDocumentModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  document: any | null;
  onReplaced: () => void;
}

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
      <DialogContent className='sm:max-w-[560px] p-6 rounded-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl text-start font-medium text-tertiary'>
            Replace document
          </DialogTitle>
          <DialogDescription className='text-start text-sm text-[#5E6864]'>
            {document?.title || 'This document'}
            {document?.version ? ` · v${document.version}` : ''} will be replaced
            by the file you pick below.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {pendingCaregivers > 0 && (
            <div className='rounded-xl border border-[#FAB607]/40 bg-[#FAB607]/10 p-4'>
              <div className='flex items-start gap-2'>
                <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-[#FAB607]' />
                <p className='text-sm font-semibold text-tertiary'>
                  {pendingCaregivers} caregiver(s) still have this document
                  waiting to be signed.
                </p>
              </div>
              <p className='mt-2 pl-6 text-sm text-[#5E6864]'>
                Replacing it will mark their copy outdated, send the new version
                automatically, and notify them by email. No manual resend is
                needed.
              </p>
            </div>
          )}

          {file ? (
            <div className='flex items-start gap-3 rounded-[12px] bg-[#F4F5F6] p-3'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E94435]/10 text-[10px] font-semibold text-[#E94435]'>
                {extensionLabel(file.name)}
              </div>

              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold text-tertiary'>
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
                className='mt-1 shrink-0 text-[#6C6C6C] transition-colors hover:text-tertiary disabled:opacity-40'
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
            className='w-full rounded-xl border border-dashed border-[#DFE2E0] py-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50'
          >
            {file ? '+ Choose a different file' : '+ Choose replacement file'}
          </button>

          <div className='flex gap-3 pt-1'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className='flex-1 h-12 rounded-xl border-[#DFE2E0] text-tertiary font-medium'
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleReplace}
              disabled={submitting || loadingPending || !file || !!fileError}
              className='flex-1 h-12 rounded-xl bg-primary text-white font-medium'
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
