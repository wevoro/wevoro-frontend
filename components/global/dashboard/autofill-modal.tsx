'use client';

import * as React from 'react';
import { CloudUpload, Loader2, Pencil, Sparkles } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOnboardContext, useUIContext } from '@/lib/contexts';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function AutoFillModal() {
  const { openAutoFillModal, setOpenAutoFillModal, autoFillClicked } =
    useUIContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const { extractedData, setExtractedData } = useOnboardContext();
  console.log('🚀 ~ AutoFillModal ~ extractedData:', extractedData);

  // Ref for the hidden file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const removeAutofillParam = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('autofill');
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(newUrl);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      removeAutofillParam();
    }
    if (!loading) {
      setOpenAutoFillModal(open);
    }
  };

  // Handle click on the Automatically button - triggers file input
  const handleAutoFill = () => {
    fileInputRef.current?.click();
  };

  const handleManual = () => {
    removeAutofillParam();
    setOpenAutoFillModal(false);
  };

  const handleAutoFillUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0];

      // Validate that a file was selected
      if (!file) {
        console.log('No file selected');
        return;
      }

      // Validate that the file is a PDF
      if (file.type !== 'application/pdf') {
        console.log('Please upload a PDF file');
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/autofill', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (responseData.status === 200) {
        console.log('Autofill successful:', responseData.data);

        if (autoFillClicked === 'professional-info') {
          delete responseData.data.personalInformation;
        }
        setExtractedData(responseData.data);
        handleManual();
      } else {
        console.log('Autofill failed:', responseData);
        setError(responseData.message);
      }
    } catch (error: any) {
      setLoading(false);
      console.log('Autofill error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleAutoFillUpload}
        accept='application/pdf,.pdf'
        className='hidden'
      />

      <Dialog open={openAutoFillModal} onOpenChange={handleOpenChange}>
        <DialogContent className='sm:max-w-[688px] p-12'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-16'>
              <div className='w-20 h-20 rounded-full bg-green-50 flex items-center justify-center animate-pulse'>
                <Sparkles className='h-10 w-10 text-[#008000]' />
              </div>

              <h3 className='mt-8 text-xl font-semibold text-[#1C1C1C]'>
                Analyzing Your Resume
              </h3>
              <p className='mt-2 text-sm text-[#6C6C6C] text-center max-w-[280px]'>
                Our AI is extracting your information. This may take a moment.
              </p>

              {/* Subtle progress indicator */}
              <div className='mt-8 flex gap-1.5'>
                <span
                  className='w-2 h-2 rounded-full bg-[#008000] animate-pulse'
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className='w-2 h-2 rounded-full bg-[#008000] animate-pulse'
                  style={{ animationDelay: '300ms' }}
                />
                <span
                  className='w-2 h-2 rounded-full bg-[#008000] animate-pulse'
                  style={{ animationDelay: '600ms' }}
                />
              </div>
            </div>
          ) : (
            <>
              {!autoFillClicked && (
                <DialogHeader>
                  <DialogTitle className='text-center text-2xl md:text-3xl font-medium text-[#1C1C1C]'>
                    How would you like to continue?
                  </DialogTitle>
                </DialogHeader>
              )}

              <div className='flex flex-col gap-4 pt-4'>
                {/* Automatically Option */}
                <button
                  onClick={handleAutoFill}
                  className='group relative flex flex-col items-center rounded-[24px] border border-dashed border-[#008000] bg-white p-6 text-center transition-all hover:border-green-600 hover:bg-green-50/50'
                >
                  <div className='relative mb-3'>
                    <CloudUpload
                      className='h-10 w-10 text-[#008000]'
                      strokeWidth={1.5}
                    />
                    <Sparkles className='absolute -right-2 -top-1 h-4 w-4 text-[#008000]' />
                  </div>
                  <h3 className='mb-2 text-base md:text-xl font-medium text-[#1C1C1C]'>
                    Automatically{' '}
                    <span className='italic font-normal'>
                      (AI-Auto Filling)
                    </span>
                  </h3>
                  <p className='text-sm text-[#6C6C6C] max-w-[460px]'>
                    Upload your up-to-date resume and the AI will manage to fill
                    the information automatically
                  </p>
                </button>

                {/* Manually Option */}
                {!autoFillClicked && (
                  <button
                    onClick={handleManual}
                    className='group flex flex-col items-center rounded-[24px] border border-gray-200 bg-white p-6 text-center transition-all hover:border-gray-300 hover:bg-gray-50'
                  >
                    <div className='mb-3'>
                      <Pencil
                        className='h-7 w-7 text-[#008000]'
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3 className='mb-2 text-base md:text-xl font-medium text-[#1C1C1C]'>
                      Manually
                    </h3>
                    <p className='text-sm text-[#6C6C6C]'>
                      Fill the needed information manually
                    </p>
                  </button>
                )}

                {error && (
                  <p className='text-base text-red-600 text-center mt-2'>
                    {error}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
