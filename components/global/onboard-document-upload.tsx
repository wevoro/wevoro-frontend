'use client';

import React, { forwardRef, useRef, useState } from 'react';
import Title from '@/components/global/title';
import OnboardButton from '@/components/global/onboard-button';
import { Check, CloudUpload, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CredentialSlot {
  key: string;
  label: string;
  category: string;
  documentType: string;
  hint: string;
  accept: string;
  maxMB: number;
}

const CREDENTIAL_SLOTS: CredentialSlot[] = [
  {
    key: 'certifications',
    label: 'CNA certificate',
    category: 'non_medical',
    documentType: 'certifications',
    hint: 'doc or pdf formats, up to 5mb.',
    accept: '.doc,.docx,.pdf',
    maxMB: 5,
  },
  {
    key: 'driver_license',
    label: "Driver's license",
    category: 'non_medical',
    documentType: 'driver_license',
    hint: 'jpeg, png, pdf formats, up to 2MB.',
    accept: '.jpeg,.jpg,.png,.pdf',
    maxMB: 2,
  },
  {
    key: 'tb_tests',
    label: 'TB test',
    category: 'medical',
    documentType: 'tb_tests',
    hint: 'doc or pdf formats, up to 5mb.',
    accept: '.doc,.docx,.pdf',
    maxMB: 5,
  },
];

interface UploadState {
  file: File | null;
  progress: number;
  uploading: boolean;
  error: string | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const OnboardDocumentUpload = forwardRef(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: documents } = useDocuments();

  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(
    Object.fromEntries(
      CREDENTIAL_SLOTS.map((s) => [
        s.key,
        { file: null, progress: 0, uploading: false, error: null },
      ])
    )
  );

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>(
    Object.fromEntries(CREDENTIAL_SLOTS.map((s) => [s.key, null]))
  );

  const uploadedByType: Record<string, any> = {};
  (documents ?? []).forEach((doc: any) => {
    uploadedByType[doc.documentType] = doc;
  });

  const setSlotState = (key: string, patch: Partial<UploadState>) =>
    setUploadStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));

  const handleFileSelect = (slot: CredentialSlot, file: File) => {
    if (file.size > slot.maxMB * 1024 * 1024) {
      toast.error(`File must be less than ${slot.maxMB}MB`);
      return;
    }
    setSlotState(slot.key, { file, progress: 0, error: null });
    uploadFile(slot, file);
  };

  const uploadFile = (slot: CredentialSlot, file: File) => {
    setSlotState(slot.key, { uploading: true, progress: 0 });

    const data = new FormData();
    data.append('category', slot.category);
    data.append('documentType', slot.documentType);
    data.append('title', slot.label);
    data.append('isPublic', 'false');
    data.append('consent', 'true');
    data.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setSlotState(slot.key, { progress: pct });
      }
    };

    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText);
      if (res.status === 200) {
        toast.success(`${slot.label} uploaded!`);
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        setSlotState(slot.key, { uploading: false, progress: 100 });
      } else {
        setSlotState(slot.key, {
          uploading: false,
          error: res.message || 'Upload failed',
          file: null,
          progress: 0,
        });
        toast.error(res.message || 'Upload failed');
      }
    };

    xhr.onerror = () => {
      setSlotState(slot.key, {
        uploading: false,
        error: 'Upload failed',
        file: null,
        progress: 0,
      });
      toast.error('Upload failed. Please try again.');
    };

    xhr.open('POST', '/api/user/document-upload');
    xhr.send(data);
  };

  const cancelUpload = (key: string) => {
    setSlotState(key, { file: null, progress: 0, uploading: false, error: null });
    if (fileRefs.current[key]) fileRefs.current[key]!.value = '';
  };

  return (
    <div>
      <div className='flex sm:flex-row flex-col gap-4 justify-between sm:items-center mb-8'>
        <Title text='Documents upload' className='mb-0' />
        <OnboardButton
          text='Skip for now'
          className='sm:w-max bg-transparent text-tertiary border border-gray-300 hover:text-white'
          href='/pro/profile'
        />
      </div>

      <div className='flex flex-col gap-4'>
        {CREDENTIAL_SLOTS.map((slot) => {
          const uploaded = uploadedByType[slot.documentType];
          const state = uploadStates[slot.key];
          const isUploaded = !!uploaded;

          return (
            <div
              key={slot.key}
              className='bg-white rounded-2xl overflow-hidden'
            >
              {/* Row header */}
              <div className='flex sm:flex-row flex-col gap-4 sm:items-center justify-between px-6 py-5'>
                <div className='flex items-center gap-4'>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isUploaded ? 'bg-primary' : 'bg-gray-100'}`}
                  >
                    <Check
                      className={`w-4 h-4 ${isUploaded ? 'text-white' : 'text-gray-400'}`}
                    />
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>{slot.label}</p>
                    <p className='text-xs text-gray-400'>{slot.hint}</p>
                  </div>
                </div>

                <input
                  ref={(el) => {
                    fileRefs.current[slot.key] = el;
                  }}
                  type='file'
                  accept={slot.accept}
                  className='hidden'
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(slot, f);
                    e.target.value = '';
                  }}
                />

                <Button
                  variant='special'
                  disabled={state.uploading}
                  onClick={() => fileRefs.current[slot.key]?.click()}
                  className='cursor-pointer font-medium text-sm border border-primary h-10 flex items-center justify-center gap-2 rounded-lg px-4 text-primary sm:w-auto w-full'
                >
                  {state.uploading ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <CloudUpload className='w-5 h-5' />
                  )}
                  Upload
                </Button>
              </div>

              {/* In-progress upload row */}
              {state.file && state.uploading && (
                <div className='mx-6 mb-4 border border-gray-200 rounded-xl p-4'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0'>
                      <span className='text-[10px] font-bold text-red-600 uppercase'>
                        {state.file.name.split('.').pop()}
                      </span>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {state.file.name}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {formatBytes(state.file.size)} &nbsp;·&nbsp;
                        <span className='inline-flex items-center gap-1'>
                          <Loader2 className='w-3 h-3 animate-spin text-gray-400' />
                          Uploading
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => cancelUpload(slot.key)}
                      className='text-gray-400 hover:text-gray-600'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                  <div className='w-full h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-1.5 bg-primary rounded-full transition-all duration-300'
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                  <p className='text-xs text-gray-400 text-right mt-1'>
                    {state.progress}%
                  </p>
                </div>
              )}
            </div>
          );
        })}

        <div className='flex gap-5 mt-4'>
          <OnboardButton
            text='Previous'
            className='w-full bg-white text-tertiary border border-gray-300 hover:text-white'
            onClick={() => router.back()}
          />
          <OnboardButton
            text='Complete'
            className='w-full'
            href='/pro/onboard/completed'
          />
        </div>
      </div>
    </div>
  );
});

OnboardDocumentUpload.displayName = 'OnboardDocumentUpload';

export default OnboardDocumentUpload;
