'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from './format';

export const MAX_DOCUMENTS_PER_ROLE = 10;
export const MAX_ESIGN_UPLOAD_MB = 10;

const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

// SCRUM-117: shared with the replace modal so a file refused here is refused
// there for exactly the same stated reason. Returns null when the file is fine.
export const validateEsignFile = (file: File): string | null => {
  const extension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return 'Only PDF and Word documents are accepted (.pdf, .doc, .docx).';
  }
  if (file.size > MAX_ESIGN_UPLOAD_MB * 1024 * 1024) {
    return `This file is ${formatFileSize(file.size)}. Each document must be under ${MAX_ESIGN_UPLOAD_MB} MB.`;
  }
  return null;
};

interface PickedFile {
  id: string;
  file: File;
  error: string | null;
}

interface UploadDocumentsModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: 'CNA' | 'PCA';
  existingCount: number;
  onUploaded: () => void;
}

const AFTER_UPLOAD_POINTS = [
  'WeVoro sends these documents to the caregiver automatically when they connect.',
  'We send email reminders until every document is signed.',
  "You'll be notified once all documents are signed.",
];

export default function UploadDocumentsModal({
  open,
  onOpenChange,
  role,
  existingCount,
  onUploaded,
}: UploadDocumentsModalProps) {
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  // Bytes of real file content the browser has flushed — derived from the XHR
  // progress event rather than taken raw, see handleUpload.
  const [sentBytes, setSentBytes] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const validFiles = useMemo(
    () => picked.filter((item) => !item.error),
    [picked]
  );
  const remainingSlots = Math.max(0, MAX_DOCUMENTS_PER_ROLE - existingCount);

  // Re-runs over the whole list on every change: removing a bad row frees a
  // slot, so a file that only failed the 10-document cap becomes valid again.
  const revalidate = (items: PickedFile[]): PickedFile[] => {
    let used = existingCount;
    return items.map((item) => {
      const error = validateEsignFile(item.file);
      if (error) return { ...item, error };
      if (used >= MAX_DOCUMENTS_PER_ROLE) {
        return {
          ...item,
          error: `Your ${role} group holds ${MAX_DOCUMENTS_PER_ROLE} documents at most. Remove a file below, or delete an uploaded document first.`,
        };
      }
      used += 1;
      return { ...item, error: null };
    });
  };

  useEffect(() => {
    if (!open) {
      xhrRef.current?.abort();
      xhrRef.current = null;
      setPicked([]);
      setUploading(false);
      setSentBytes(0);
    }
  }, [open]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    // Clear the input so re-picking the same file still fires onChange.
    e.target.value = '';
    if (!chosen.length) return;

    setPicked((prev) =>
      revalidate([
        ...prev,
        ...chosen.map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          file,
          error: null,
        })),
      ])
    );
  };

  const handleRemove = (id: string) => {
    setPicked((prev) => revalidate(prev.filter((item) => item.id !== id)));
  };

  // Only the valid rows are sent. Oversized or wrong-format files stay listed
  // with their error so the agency sees what was skipped and why.
  const handleUpload = () => {
    if (!validFiles.length) return;

    const totalFileBytes = validFiles.reduce(
      (sum, item) => sum + item.file.size,
      0
    );

    const body = new FormData();
    body.append('role', role);
    validFiles.forEach((item) => body.append('files', item.file));

    setUploading(true);
    setSentBytes(0);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', '/api/esign/documents');

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !event.total) return;
      // event.total counts multipart boundaries and part headers too, so scale
      // the ratio back onto real file bytes before splitting it per row.
      setSentBytes((event.loaded / event.total) * totalFileBytes);
    };

    xhr.onload = () => {
      setUploading(false);
      xhrRef.current = null;

      let payload: any = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        toast.error(payload?.message || 'Upload failed. Please try again.');
        return;
      }

      const rejected: any[] = payload?.data?.rejected || [];
      if (rejected.length) {
        // Whatever was accepted is already stored, so refresh the list behind
        // the modal and keep the modal open showing only the refusals.
        onUploaded();
        const reasons = new Map<string, string>(
          rejected.map((entry: any) => [
            entry?.fileName || entry?.name || '',
            entry?.reason || entry?.message || 'The server rejected this file.',
          ])
        );
        setPicked((prev) =>
          prev
            .filter((item) => item.error || reasons.has(item.file.name))
            .map((item) =>
              reasons.has(item.file.name)
                ? { ...item, error: reasons.get(item.file.name) as string }
                : item
            )
        );
        toast.error('Some documents were not accepted');
        return;
      }

      onUploaded();
      onOpenChange(false);
      toast.success('Documents uploaded');
    };

    xhr.onerror = () => {
      setUploading(false);
      xhrRef.current = null;
      toast.error('Upload failed. Please check your connection and try again.');
    };

    xhr.send(body);
  };

  // The single POST reports one combined progress number. Multipart parts go on
  // the wire in order, so spending the sent bytes down the list gives each row
  // a real percentage instead of a faked animation.
  const progressFor = (item: PickedFile): number => {
    if (!uploading || item.error) return 0;
    if (!item.file.size) return 100;

    let offset = 0;
    for (const candidate of validFiles) {
      if (candidate.id === item.id) break;
      offset += candidate.file.size;
    }

    const ratio = (sentBytes - offset) / item.file.size;
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  };

  const extensionLabel = (name: string) =>
    (name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[720px] p-6 rounded-xl max-h-[calc(100vh-4rem)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl text-start font-medium text-tertiary'>
            Upload {role} documents
          </DialogTitle>
          <DialogDescription className='text-start text-sm text-[#5E6864]'>
            PDF or Word files, up to {MAX_ESIGN_UPLOAD_MB} MB each.{' '}
            {existingCount} of {MAX_DOCUMENTS_PER_ROLE} used in the {role} group
            {remainingSlots > 0
              ? ` — you can add ${remainingSlots} more.`
              : ' — remove one before uploading another.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Past 3 rows the list scrolls on its own so the modal never grows unbounded. */}
          {picked.length > 0 && (
            <div
              className={`space-y-2 ${
                picked.length > 3 ? 'max-h-[236px] overflow-y-auto pr-1' : ''
              }`}
            >
              {picked.map((item) => {
                const percent = progressFor(item);
                return (
                  <div
                    key={item.id}
                    className='flex items-start gap-3 rounded-[12px] bg-[#F4F5F6] p-3'
                  >
                    <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E94435]/10 text-[10px] font-semibold text-[#E94435]'>
                      {extensionLabel(item.file.name)}
                    </div>

                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold text-tertiary'>
                        {item.file.name}
                      </p>
                      <p className='text-xs text-[#6C6C6C]'>
                        {formatFileSize(item.file.size)}
                        {uploading && !item.error && ` · ${percent}%`}
                      </p>

                      {item.error && (
                        <p className='mt-1 text-xs text-[#E94435]'>
                          {item.error}
                        </p>
                      )}

                      {uploading && !item.error && (
                        <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DFE2E0]'>
                          <div
                            className='h-full rounded-full bg-primary transition-all'
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type='button'
                      onClick={() => handleRemove(item.id)}
                      disabled={uploading}
                      aria-label={`Remove ${item.file.name}`}
                      className='mt-1 shrink-0 text-[#6C6C6C] transition-colors hover:text-tertiary disabled:opacity-40'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <input
            ref={fileInputRef}
            type='file'
            multiple
            accept='.pdf,.doc,.docx'
            onChange={handleFilesSelected}
            className='hidden'
          />
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className='w-full rounded-xl border border-dashed border-[#DFE2E0] py-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50'
          >
            + Add another file
          </button>

          <div className='rounded-xl border border-primary/20 bg-primary/5 p-4'>
            <p className='text-sm font-semibold text-secondary'>
              After you upload
            </p>
            <ul className='mt-3 space-y-2'>
              {AFTER_UPLOAD_POINTS.map((line) => (
                <li key={line} className='flex items-start gap-2'>
                  <Check className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                  <span className='text-sm text-[#5E6864]'>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className='flex gap-3 pt-1'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className='flex-1 h-12 rounded-xl border-[#DFE2E0] text-tertiary font-medium'
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleUpload}
              disabled={uploading || validFiles.length === 0}
              className='flex-1 h-12 rounded-xl bg-primary text-white font-medium'
            >
              {uploading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Uploading...
                </>
              ) : (
                `Upload ${validFiles.length} document${
                  validFiles.length === 1 ? '' : 's'
                }`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
