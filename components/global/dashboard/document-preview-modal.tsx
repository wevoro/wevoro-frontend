'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * SCRUM-120 / SCRUM-121 — the document preview.
 *
 * One viewer, two permission states, exactly as the design specifies: the agency
 * opens its own uploads and can replace them from here; the admin opens the same
 * file read-only, with provenance and an explicit note that this is oversight
 * and not a decision point.
 */

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  /** Admin only: who uploaded it and when, shown beside the file meta. */
  uploadedBy?: string;
  uploadedAt?: string;
  /** Admin: no replace, a "View only" tag, and the monitoring note. */
  readOnly?: boolean;
  /** Agency: offered in the footer, per the design. */
  onReplace?: () => void;
}

const KB = 1024;

const prettySize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < KB * KB) return `${Math.round(bytes / KB)} KB`;
  return `${(bytes / (KB * KB)).toFixed(1)} MB`;
};

/**
 * The extension, or '' when the filename has none. Guarded on both counts:
 * split('.') on a name with no dot returns the whole name, which put
 * "QA117NOEXTENSION" inside a 44px badge.
 */
const extensionOf = (name: string) => {
  if (!name || !name.includes('.')) return '';
  const ext = name.split('.').pop() || '';
  return ext.length <= 4 ? ext.toUpperCase() : '';
};

/** DOC and DOCX both show as DOC, matching the row badges. */
const badgeLabel = (name: string) => {
  const ext = extensionOf(name);
  return ext === 'DOCX' ? 'DOC' : ext || 'FILE';
};

const isPdf = (name: string, url: string) =>
  extensionOf(name) === 'PDF' || /\.pdf(\?|$)/i.test(url || '');

const prettyDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  open,
  onOpenChange,
  fileName,
  fileUrl,
  fileSize,
  uploadedBy,
  uploadedAt,
  readOnly = false,
  onReplace,
}) => {
  const [pages, setPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pdf = isPdf(fileName, fileUrl);

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setPages(null);
    if (!pdf) return;
    let cancelled = false;
    fetch('/api/document/page-count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fileUrl }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.pages) setPages(j.pages);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, fileUrl, pdf]);

  const go = useCallback(
    (delta: number) => {
      setPage((p) => {
        const next = p + delta;
        if (next < 1) return p;
        if (pages && next > pages) return p;
        return next;
      });
    },
    [pages]
  );

  const meta = [
    badgeLabel(fileName) === 'DOC' ? 'DOCX' : badgeLabel(fileName),
    prettySize(fileSize),
    uploadedBy ? `Uploaded by ${uploadedBy}` : '',
    prettyDate(uploadedAt),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // `block`, not the dialog's default grid: a grid item is min-width:auto,
        // so a long unbroken filename widened the track past the viewport and
        // clipped both edges of the modal. And the width is capped against the
        // viewport as well as the design width, so a narrow window shrinks the
        // dialog instead of pushing its buttons off screen.
        className='block w-full max-w-[min(1040px,calc(100vw-2rem))] gap-0 overflow-hidden rounded-2xl border-0 p-0'
        hideClose
      >
        <DialogTitle className='sr-only'>{fileName}</DialogTitle>

        {/* Header — badge, name, tag, meta, actions */}
        <div className='flex min-w-0 items-start gap-4 bg-white px-5 py-5 sm:px-6'>
          <span
            className='flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#E94435] text-[11px] font-bold text-white'
            aria-hidden='true'
          >
            {badgeLabel(fileName)}
          </span>

          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2.5'>
              <h2 className='truncate text-[19px] font-semibold text-[#1C1C1C]'>
                {fileName}
              </h2>
              {readOnly && (
                <span className='shrink-0 rounded-full border border-[#DFE2E0] px-2.5 py-0.5 text-[12px] font-medium text-[#6C6C6C]'>
                  View only
                </span>
              )}
            </div>
            <p className='mt-1 truncate text-[13.5px] text-[#6C6C6C]'>{meta}</p>
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            <a
              href={fileUrl}
              download={fileName}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={`Download ${fileName}`}
              title='Download'
              className='flex size-10 items-center justify-center rounded-lg border border-[#DFE2E0] text-[#1C1C1C] transition-colors hover:bg-[#F9F9FA]'
            >
              <Download className='size-5' />
            </a>
            <button
              type='button'
              onClick={() => onOpenChange(false)}
              aria-label='Close'
              title='Close'
              className='flex size-10 items-center justify-center rounded-lg border border-[#DFE2E0] text-[#1C1C1C] transition-colors hover:bg-[#F9F9FA]'
            >
              <X className='size-5' />
            </button>
          </div>
        </div>

        {/* Page bar — only when the file is a PDF whose length we know */}
        {pdf && pages ? (
          <div className='flex items-center justify-between border-y border-[#DFE2E0] bg-[#F9F9FA] px-5 py-3 sm:px-6'>
            <p className='text-[14px] text-[#1C1C1C]'>
              Page {page} of {pages}
            </p>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => go(-1)}
                disabled={page <= 1}
                aria-label='Previous page'
                className='flex size-9 items-center justify-center rounded-lg border border-[#DFE2E0] bg-white text-[#1C1C1C] transition-colors hover:bg-[#F2F4F3] disabled:pointer-events-none disabled:opacity-40'
              >
                <ChevronLeft className='size-4' />
              </button>
              <button
                type='button'
                onClick={() => go(1)}
                disabled={page >= pages}
                aria-label='Next page'
                className='flex size-9 items-center justify-center rounded-lg border border-[#DFE2E0] bg-white text-[#1C1C1C] transition-colors hover:bg-[#F2F4F3] disabled:pointer-events-none disabled:opacity-40'
              >
                <ChevronRight className='size-4' />
              </button>
            </div>
          </div>
        ) : (
          <div className='border-t border-[#DFE2E0]' />
        )}

        {/* Body */}
        <div className='flex max-h-[62vh] min-h-[380px] items-center justify-center overflow-auto bg-[#F2F4F3] p-4 sm:p-6'>
          {pdf ? (
            <iframe
              // #page drives the browser's own viewer from our page control, and
              // the toolbar is hidden so the modal keeps one set of controls.
              key={page}
              src={`${fileUrl}#page=${page}&toolbar=0&navpanes=0&view=FitH`}
              title={fileName}
              className='h-[58vh] w-full rounded-lg bg-white shadow-sm'
            />
          ) : (
            // DOCX cannot render in a browser. Rather than an empty grey box,
            // say so and offer the file — converting server-side is a whole
            // dependency this does not need yet.
            <div className='flex flex-col items-center gap-3 text-center'>
              <span className='flex size-14 items-center justify-center rounded-xl bg-[#E94435] text-[13px] font-bold text-white'>
                {badgeLabel(fileName)}
              </span>
              <p className='text-[15px] font-semibold text-[#1C1C1C]'>
                This file type can&apos;t be shown here
              </p>
              <p className='max-w-[380px] text-[13.5px] text-[#6C6C6C]'>
                Word documents open in Word rather than the browser. Download it to
                read the contents.
              </p>
              <a
                href={fileUrl}
                download={fileName}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-1 inline-flex h-11 items-center gap-2 rounded-xl bg-[#008000] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#016b01]'
              >
                <Download className='size-4' />
                Download
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-[#DFE2E0] bg-white px-5 py-4 sm:px-6'>
          <p className='min-w-0 flex-1 text-[13.5px] text-[#6C6C6C]'>
            {readOnly
              ? "Monitoring view — admin can't approve, reject or change this agency's documents."
              : 'Preview only — replacing a document sends the new version to caregivers who have not signed yet.'}
          </p>
          <div className='flex shrink-0 items-center gap-3'>
            {!readOnly && onReplace && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onReplace();
                }}
                variant='outline'
                className='h-11 rounded-xl border-[#DFE2E0] px-5 text-[15px] font-semibold text-[#1C1C1C]'
              >
                Replace document
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant='outline'
              className='h-11 rounded-xl border-[#DFE2E0] px-6 text-[15px] font-semibold text-[#1C1C1C]'
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
