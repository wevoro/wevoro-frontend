'use client';

import React, { useRef, useState } from 'react';
import { Inter } from 'next/font/google';
import { Check, CircleHelp, CloudUpload, Dot, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  isValidFileSize,
  isValidFileType,
  MAX_UPLOAD_MB,
} from '@/utils/download';
import { fileIcons, getFileType, shortFileName } from '@/utils/file';
import type { CertificatePart } from '@/lib/credential-config';

// SCRUM-152: Faisal's step-3 frames set the helper line, the file row and the
// Upload label in Inter; everything else on the page is Poppins.
const inter = Inter({ subsets: ['latin'] });

// SCRUM-97: name the actual size so caregivers know how far over they are,
// rather than just being told the upload was rejected. Same words as the
// upload modal.
const tooLargeMessage = (file: File) =>
  `This file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please upload a file under ${MAX_UPLOAD_MB}MB.`;

const formatSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

// The CDN stores a file as "<name>_<timestamp>_<random>.<ext>" (bunny-upload
// on the backend). Stripping the suffix gives the caregiver back the name they
// picked, which is what the file row shows.
const nameFromDocument = (doc: any): string => {
  const last = String(doc?.url ?? '').split('/').pop()?.split('?')[0] ?? '';
  if (!last) return doc?.title ?? '';
  return last.replace(/_\d{13}_[a-z0-9]+(\.[a-z0-9]+)$/i, '$1');
};

const FileIcon = ({ name }: { name: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={fileIcons[getFileType(name)] || '/file.svg'}
    alt=''
    className='size-10 shrink-0 object-contain'
  />
);

interface OnboardCredentialRowProps {
  label: string;
  /** SCRUM-165: which half of the PCA certificate this card is. None for CNA. */
  part?: CertificatePart;
  /** The caregiver's existing row for this card, if any. */
  document?: any;
  tooltip?: { title: string; body: string };
  /** Figma draws a (?) after the exam title too, with no tooltip copy. */
  showHelpIcon?: boolean;
}

/**
 * SCRUM-152: one credential card on onboarding step 3, per Faisal's frames
 * "5. Onboarding Page - Documant Upload - PCA / - CNA". The Upload button opens
 * the file picker and uploads right here with a progress bar, as the frames
 * show — no modal on this step.
 */
const OnboardCredentialRow: React.FC<OnboardCredentialRowProps> = ({
  label,
  part,
  document,
  tooltip,
  showHelpIcon,
}) => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [uploading, setUploading] = useState<{
    file: File;
    progress: number;
  } | null>(null);
  // The name the caregiver picked, kept after a successful upload so the file
  // row shows it rather than the CDN's rewritten one.
  const [lastFile, setLastFile] = useState<{ name: string; size: number } | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);

  const isUploaded = !!document;
  const busy = !!uploading || removing;

  const refreshDocuments = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
      queryClient.invalidateQueries({ queryKey: ['credentialStatus'], refetchType: 'all' }),
    ]);

  const upload = (file: File) => {
    const data = new FormData();
    data.append('file', file);
    data.append('category', 'non_medical');
    data.append('documentType', 'certifications');
    data.append('title', label);
    // SCRUM-177 removed the per-document Private choice, so this no longer
    // mirrors the row's own privacy — it is always 'true'. The field itself has
    // to stay: /api/user/document-upload appends isPublic unconditionally, so
    // leaving it out sends the backend the string "null" (stored as 'private').
    // Same reason consent is sent as a string rather than left out.
    data.append('isPublic', 'true');
    data.append('consent', String(!!document?.consent));
    if (part) data.append('part', part);
    // Replacing keeps one row per card: the sign-off is resolved by the
    // backend anyway, but the certificate would otherwise gain a duplicate.
    if (document?._id) data.append('documentId', document._id);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    setUploading({ file, progress: 0 });

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      // Held at 99 until the server answers: the bytes are sent, but the
      // file still has to reach the CDN before the row exists.
      const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
      setUploading((prev) => (prev ? { ...prev, progress: pct } : prev));
    };

    xhr.onload = async () => {
      let result: any = null;
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        result = null;
      }
      if (xhr.status === 200 && result?.status === 200) {
        setUploading((prev) => (prev ? { ...prev, progress: 100 } : prev));
        await refreshDocuments();
        setLastFile({ name: file.name, size: file.size });
        setUploading(null);
      } else {
        toast.error(result?.message || 'Upload failed. Please try again.');
        setUploading(null);
      }
      xhrRef.current = null;
    };

    xhr.onerror = () => {
      toast.error('Upload failed. Please check your connection and try again.');
      setUploading(null);
      xhrRef.current = null;
    };

    xhr.onabort = () => {
      setUploading(null);
      xhrRef.current = null;
    };

    xhr.open('POST', '/api/user/document-upload');
    xhr.send(data);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Cleared so picking the same file again still fires a change.
    e.target.value = '';
    if (!file) return;
    if (!isValidFileType(file)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, or PDF file.');
      return;
    }
    if (!isValidFileSize(file)) {
      toast.error(tooLargeMessage(file));
      return;
    }
    upload(file);
  };

  const handleRemove = async () => {
    if (!document?._id) return;
    if (!window.confirm(`Remove your ${label}?`)) return;
    setRemoving(true);
    try {
      const res = await fetch('/api/user/document-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document._id }),
      });
      const result = await res.json().catch(() => null);
      if (res.ok && result?.status === 200) {
        await refreshDocuments();
        setLastFile(null);
        toast.success('Credential removed successfully');
      } else {
        toast.error(result?.message || 'Failed to remove credential');
      }
    } catch {
      toast.error('Failed to remove credential');
    } finally {
      setRemoving(false);
    }
  };

  const uploadedName = lastFile?.name || nameFromDocument(document);
  const uploadedSize = formatSize(lastFile?.size ?? document?.fileSize);

  return (
    <div className='relative bg-white rounded-xl'>
      <div className='flex items-center gap-3 p-5'>
        <div
          className={cn(
            'size-10 rounded-full flex items-center justify-center shrink-0',
            isUploaded || uploading ? 'bg-[#33B55B]' : 'bg-[#F5F5F5]',
          )}
        >
          <Check
            className={cn(
              'size-[18px]',
              isUploaded || uploading ? 'text-white' : 'text-[#C9CCCB]',
            )}
            strokeWidth={3}
          />
        </div>

        <div className='flex flex-col gap-1 min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <p className='text-base sm:text-lg font-semibold text-tertiary'>
              {label}
            </p>
            {!tooltip && showHelpIcon && (
              <CircleHelp aria-hidden className='size-[21px] text-tertiary' />
            )}
            {tooltip && (
              // Positioned against the card on phones (no room beside the
              // icon), and hanging under the icon from sm up, as in Figma.
              <span className='group sm:relative inline-flex'>
                <button
                  type='button'
                  aria-label={tooltip.title}
                  className='text-tertiary rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                >
                  <CircleHelp className='size-[21px]' />
                </button>
                <span
                  role='tooltip'
                  className='hidden group-hover:flex group-focus-within:flex flex-col gap-2.5 absolute z-20 top-full mt-2 left-4 right-4 sm:left-0 sm:right-auto sm:w-[290px] bg-[#1C1C1C] rounded-3xl px-6 py-5 shadow-[2px_8px_9px_rgba(0,0,0,0.05)]'
                >
                  <span className='text-base font-medium text-white'>
                    {tooltip.title}
                  </span>
                  <span className='text-xs text-[#DFE2E0]'>{tooltip.body}</span>
                </span>
              </span>
            )}
          </div>
          <p
            className={cn(
              'text-xs leading-4 tracking-[-0.2px] text-[#6C6C6C]/80',
              inter.className,
            )}
          >
            jpeg, png, pdf formats, up to {MAX_UPLOAD_MB}MB.
          </p>
        </div>

        <input
          ref={inputRef}
          type='file'
          accept='.jpeg,.jpg,.png,.pdf'
          className='hidden'
          onChange={handleFileSelect}
        />
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            'shrink-0 flex items-center bg-white border border-primary rounded-xl px-2.5 py-2 text-primary text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed',
            inter.className,
          )}
        >
          <CloudUpload className='size-6' />
          <span className='px-1'>Upload</span>
        </button>
      </div>

      {uploading ? (
        <>
          <div className='h-px bg-[#DFE2E0]' />
          <div className='flex flex-col gap-2 p-5'>
            <div className={cn('flex items-center gap-3', inter.className)}>
              <FileIcon name={uploading.file.name} />
              <div className='min-w-0 flex-1'>
                <p
                  title={uploading.file.name}
                  className='text-sm font-medium text-tertiary truncate'
                >
                  {shortFileName(uploading.file.name)}
                </p>
                <p className='flex items-center text-xs text-[#5E6864]'>
                  {formatSize(uploading.file.size)}
                  <Dot className='size-4' />
                  <Loader2 className='size-4 mr-1 animate-spin' />
                  Uploading
                </p>
              </div>
              <button
                type='button'
                aria-label='Cancel upload'
                onClick={() => xhrRef.current?.abort()}
                className='shrink-0 text-tertiary'
              >
                <X className='size-6' />
              </button>
            </div>
            <div className='flex items-center gap-2 pl-[52px]'>
              <div className='h-2.5 flex-1 rounded-full bg-[#F7FAF8] overflow-hidden'>
                <div
                  className='h-full rounded-full bg-gradient-to-r from-[#33B55B] to-[#008000] transition-[width]'
                  style={{ width: `${uploading.progress}%` }}
                />
              </div>
              <span className='text-xs font-medium text-[#3A4742]'>
                {uploading.progress}%
              </span>
            </div>
          </div>
        </>
      ) : (
        isUploaded && (
          <>
            <div className='h-px bg-[#DFE2E0]' />
            <div className={cn('flex items-center gap-3 p-5', inter.className)}>
              <FileIcon name={uploadedName} />
              <div className='min-w-0 flex-1'>
                <p
                  title={uploadedName}
                  className='text-sm font-medium text-tertiary truncate'
                >
                  {shortFileName(uploadedName)}
                </p>
                <p className='flex items-center text-xs text-[#5E6864]'>
                  {uploadedSize && (
                    <>
                      {uploadedSize}
                      <Dot className='size-4' />
                    </>
                  )}
                  Uploaded
                </p>
              </div>
              <button
                type='button'
                aria-label={`Remove ${label}`}
                onClick={handleRemove}
                disabled={busy}
                className='shrink-0 text-tertiary disabled:opacity-50'
              >
                {removing ? (
                  <Loader2 className='size-6 animate-spin' />
                ) : (
                  <X className='size-6' />
                )}
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default OnboardCredentialRow;
