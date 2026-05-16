'use client';

import React, { forwardRef } from 'react';
import Title from '@/components/global/title';
import OnboardButton from '@/components/global/onboard-button';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UploadDocumentModal from './dashboard/upload-document-modal';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { Button } from '../ui/button';
import { CloudUpload } from 'lucide-react';

const CREDENTIAL_SLOTS = [
  {
    key: 'certifications',
    label: 'CNA certificate',
    category: 'non_medical',
    documentType: 'certifications',
    defaultTitle: 'CNA Certificate',
    hint: 'doc or pdf formats, up to 5mb.',
  },
  {
    key: 'driver_license',
    label: "Driver's license",
    category: 'non_medical',
    documentType: 'driver_license',
    defaultTitle: "Driver's License",
    hint: 'jpeg, png, pdf formats, up to 2MB.',
  },
  {
    key: 'tb_tests',
    label: 'TB test',
    category: 'medical',
    documentType: 'tb_tests',
    defaultTitle: 'TB Test',
    hint: 'doc or pdf formats, up to 5mb.',
  },
];

const OnboardDocumentUpload = forwardRef(() => {
  const router = useRouter();
  const { data: documents } = useDocuments();

  const uploadedByType: Record<string, any> = {};
  (documents ?? []).forEach((doc: any) => {
    uploadedByType[doc.documentType] = doc;
  });

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
          const isUploaded = !!uploaded;

          return (
            <div
              key={slot.key}
              className='flex sm:flex-row flex-col gap-4 sm:items-center justify-between px-7 py-5 bg-white rounded-2xl'
            >
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
                  <p className='text-xs text-[#5E6864]'>{slot.hint}</p>
                </div>
              </div>

              <UploadDocumentModal
                category={slot.category}
                documentType={slot.documentType}
                defaultTitle={slot.defaultTitle}
                document={isUploaded ? uploaded : undefined}
              >
                <Button
                  variant='special'
                  className='cursor-pointer font-medium text-sm border border-primary h-10 flex items-center justify-center gap-2 rounded-lg px-4 text-primary sm:w-auto w-full'
                >
                  <CloudUpload className='w-5 h-5' />
                  Upload
                </Button>
              </UploadDocumentModal>
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
