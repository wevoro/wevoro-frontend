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
import { AlertCircle, Check, Upload, X } from 'lucide-react';
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
    return `This file is ${formatFileSize(
      file.size
    )} — the maximum size is ${MAX_ESIGN_UPLOAD_MB} MB. Please upload a smaller PDF or DOCX.`;
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

// The design words this panel one way for a single document and another for a
// batch, so both sets are spelled out rather than pluralised on the fly.
const AFTER_UPLOAD_POINTS_ONE = [
  'WeVoro sends this document to the caregiver automatically when they connect.',
  "We will notify the caregiver until it's signed.",
  "You'll be notified once the document signed and will send it back to you.",
];

const AFTER_UPLOAD_POINTS_MANY = [
  'WeVoro sends these documents to the caregiver automatically when they connect.',
  'We send email reminders until every document is signed.',
  "You'll be notified once all documents are signed.",
];

const extensionLabel = (name: string) =>
  (name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);

// The design draws the file type as a small folded page, not a square tile.
const FileGlyph = ({ name }: { name: string }) => (
  <div className='relative h-[26px] w-5 shrink-0'>
    <svg viewBox='0 0 20 26' className='h-full w-full' aria-hidden='true'>
      <path
        d='M0 3a3 3 0 0 1 3-3h9l8 8v15a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3Z'
        fill='#FCE8E8'
      />
      <path d='M12 0l8 8h-6a2 2 0 0 1-2-2V0Z' fill='#F7C2C2' />
    </svg>
    <span className='absolute inset-x-0 bottom-[6px] text-center text-[6px] font-bold leading-none tracking-wide text-[#E94435]'>
      {extensionLabel(name)}
    </span>
  </div>
);

export default function UploadDocumentsModal({
  open,
  onOpenChange,
  role,
  existingCount,
  onUploaded,
}: UploadDocumentsModalProps) {
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Bytes of real file content the browser has flushed — derived from the XHR
  // progress event rather than taken raw, see handleUpload.
  const [sentBytes, setSentBytes] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const validFiles = useMemo(
    () => picked.filter((item) => !item.error),
    [picked]
  );
  const rejectedFiles = useMemo(
    () => picked.filter((item) => item.error),
    [picked]
  );
  // Everything in the batch was refused: the modal falls back to the dropzone
  // and offers "Try again" instead of an upload it cannot perform.
  const retryOnly = validFiles.length === 0 && rejectedFiles.length > 0;
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
      setDragOver(false);
      setSentBytes(0);
    }
  }, [open]);

  // Refusals only describe the selection that produced them, so a fresh pick
  // clears them while the files that were accepted stay in the list.
  const addFiles = (chosen: File[]) => {
    if (!chosen.length) return;

    setPicked((prev) =>
      revalidate([
        ...prev.filter((item) => !item.error),
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

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    // Clear the input so re-picking the same file still fires onChange.
    e.target.value = '';
    addFiles(chosen);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleRemove = (id: string) => {
    setPicked((prev) => revalidate(prev.filter((item) => item.id !== id)));
  };

  // Only the valid rows are sent. Oversized or wrong-format files stay listed
  // in the failure panel so the agency sees what was skipped and why.
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

  const afterUploadPoints =
    validFiles.length > 1 ? AFTER_UPLOAD_POINTS_MANY : AFTER_UPLOAD_POINTS_ONE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px] p-6 rounded-2xl max-h-[calc(100vh-4rem)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl text-start font-semibold text-tertiary'>
            {validFiles.length > 1
              ? `Upload ${role} documents`
              : `Upload ${role} signing document`}
          </DialogTitle>
          {/* The design shows no subtitle, but the quota still has to reach a
              screen reader through the dialog's description. */}
          <DialogDescription className='sr-only'>
            PDF or Word files, up to {MAX_ESIGN_UPLOAD_MB} MB each.{' '}
            {existingCount} of {MAX_DOCUMENTS_PER_ROLE} used in the {role} group
            {remainingSlots > 0
              ? ` — you can add ${remainingSlots} more.`
              : ' — remove one before uploading another.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {rejectedFiles.length > 0 && (
            <div className='flex items-start gap-2.5 rounded-[12px] bg-[#FCE8E8] p-4'>
              <AlertCircle className='mt-0.5 h-[18px] w-[18px] shrink-0 text-[#E94435]' />
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-semibold text-[#E94435]'>
                  Upload failed
                </p>
                {rejectedFiles.map((item) => (
                  <p key={item.id} className='text-sm text-[#5E6864]'>
                    {rejectedFiles.length > 1
                      ? `${item.file.name} · ${item.error}`
                      : item.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Past 3 rows the list scrolls on its own so the modal never grows unbounded. */}
          {validFiles.length > 0 && (
            <div
              className={`space-y-2 ${
                validFiles.length > 3 ? 'max-h-[236px] overflow-y-auto pr-1' : ''
              }`}
            >
              {validFiles.map((item) => {
                const percent = progressFor(item);
                return (
                  <div
                    key={item.id}
                    className='rounded-[12px] bg-[#F2F4F3] p-3'
                  >
                    <div className='flex items-center gap-3'>
                      <FileGlyph name={item.file.name} />

                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-semibold text-tertiary'>
                          {item.file.name}
                        </p>
                        <p className='text-xs text-[#5E6864]'>
                          {uploading
                            ? `Uploading... ${percent}%`
                            : formatFileSize(item.file.size)}
                        </p>
                      </div>

                      {!uploading && (
                        <button
                          type='button'
                          onClick={() => handleRemove(item.id)}
                          aria-label={`Remove ${item.file.name}`}
                          className='shrink-0 text-[#5E6864] transition-colors hover:text-tertiary'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      )}
                    </div>

                    {uploading && (
                      <div className='mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#DFE2E0]'>
                        <div
                          className='h-full rounded-full bg-primary transition-all'
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
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

          {!uploading &&
            (retryOnly ? (
              <button
                type='button'
                onClick={openFilePicker}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex w-full flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed py-7 transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-[#DFE2E0] bg-[#F2F4F3]'
                }`}
              >
                <Upload className='h-5 w-5 text-[#5E6864]' />
                <span className='text-sm text-[#5E6864]'>
                  Drag a file here or choose another · PDF or DOCX, up to{' '}
                  {MAX_ESIGN_UPLOAD_MB} MB
                </span>
              </button>
            ) : (
              <button
                type='button'
                onClick={openFilePicker}
                className='w-full rounded-xl border border-dashed border-[#DFE2E0] py-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5'
              >
                + Add another file
              </button>
            ))}

          {!retryOnly && (
            <div className='rounded-[12px] bg-[#E0FCED] p-4'>
              <p className='text-sm font-semibold text-tertiary'>
                After you upload
              </p>
              <ul className='mt-3 space-y-2'>
                {afterUploadPoints.map((line) => (
                  <li key={line} className='flex items-start gap-2'>
                    <span className='mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20'>
                      <Check
                        className='h-2.5 w-2.5 text-primary'
                        strokeWidth={3}
                      />
                    </span>
                    <span className='text-sm text-[#5E6864]'>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className='flex justify-end gap-3 pt-1'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='h-10 rounded-[10px] border-[#DFE2E0] px-5 text-tertiary font-medium'
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={retryOnly ? openFilePicker : handleUpload}
              disabled={uploading || (!retryOnly && validFiles.length === 0)}
              className='h-10 rounded-[10px] bg-primary px-5 text-white font-medium disabled:opacity-50'
            >
              {uploading
                ? 'Uploading...'
                : retryOnly
                ? 'Try again'
                : `Upload ${validFiles.length} document${
                    validFiles.length === 1 ? '' : 's'
                  }`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
