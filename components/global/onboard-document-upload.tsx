'use client';

import React, { forwardRef } from 'react';
import Title from '@/components/global/title';
import OnboardButton from '@/components/global/onboard-button';
import { Check, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useRouter } from 'next/navigation';
import Documents from './dashboard/documents';
import { Button } from '../ui/button';
import UploadDocumentModal from './dashboard/upload-document-modal';
import { useDocumentContext } from '@/lib/contexts/document-context';

const OnboardDocumentUpload = forwardRef(() => {
  const router = useRouter();
  const { documents } = useDocumentContext();

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

      <div className='flex flex-col gap-8'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col'>
            <div
              className={cn(
                'flex sm:flex-row flex-col gap-4 sm:items-center justify-between px-7 py-5 bg-white rounded-2xl'
              )}
            >
              <div className='flex items-center gap-3'>
                <div className='flex flex-col gap-2 flex-1'>
                  <p className='font-semibold text-lg'>Upload Document</p>
                  <p className='text-xs text-[#5E6864]'>
                    image or pdf formats, up to 3MB.
                  </p>
                </div>
              </div>
              <UploadDocumentModal>
                <Button
                  variant='special'
                  className='cursor-pointer font-medium text-sm border border-primary h-10 flex items-center justify-center gap-2 rounded-lg px-4 text-primary'
                >
                  <CloudUpload className='w-6 h-6' />
                  Upload
                </Button>
              </UploadDocumentModal>
            </div>
          </div>
        </div>

        {documents?.length! > 0 && (
          <>
            <Title text='Uploaded Documents' className='mb-0' />
            <Documents from='onboard' />
          </>
        )}

        <div className='flex gap-5'>
          <OnboardButton
            text={'Previous'}
            className='w-full bg-white text-tertiary border border-gray-300 hover:text-white'
            onClick={() => router.back()}
          />
          <OnboardButton
            text={'Submit'}
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
