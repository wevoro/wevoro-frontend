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
import { toast } from 'sonner';

export default function AutoFillModal() {
  const { openAutoFillModal, setOpenAutoFillModal, autoFillClicked } =
    useUIContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | false>(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const { extractedData, setExtractedData } = useOnboardContext();

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
      if (!open) {
        setError(false);
        setIsDragging(false);
      }
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

  const validateFile = (file: File): string | null => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      return 'Please upload a valid PDF file.';
    }
    // Validate file is not empty
    if (file.size === 0) {
      return 'The uploaded file is empty. Please select a valid PDF.';
    }
    // Validate file size (max 5MB for CV)
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(false);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/autofill', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (responseData.status === 200) {
        toast.success('CV parsed successfully!');

        if (autoFillClicked === 'professional-info') {
          delete responseData.data.personalInformation;
        }
        setExtractedData(responseData.data);
        handleManual();
      } else {
        const errorMsg =
          responseData.message || 'Failed to parse CV. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg =
        error.message || 'An error occurred while processing your CV.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAutoFillUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;

      if (e.dataTransfer.files.length > 1) {
        toast.warning('Please upload only one file at a time.');
      }

      await processFile(droppedFile);
    },
    [autoFillClicked],
  );

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

              <h3 className='mt-8 text-xl font-semibold text-tertiary'>
                Analyzing Your Resume
              </h3>
              <p className='mt-2 text-sm text-muted-foreground text-center max-w-[280px]'>
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
                  <DialogTitle className='text-center text-2xl md:text-3xl font-medium text-tertiary'>
                    How would you like to continue?
                  </DialogTitle>
                </DialogHeader>
              )}

              <div className='flex flex-col gap-4 pt-4'>
                {/* Automatically Option — with drag & drop support */}
                <button
                  onClick={handleAutoFill}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`group relative flex flex-col items-center rounded-[24px] border border-dashed bg-white p-6 text-center transition-all hover:border-green-600 hover:bg-green-50/50 ${
                    isDragging
                      ? 'border-green-600 bg-green-50/50 scale-[1.02]'
                      : 'border-[#008000]'
                  }`}
                >
                  <div className='relative mb-3'>
                    <CloudUpload
                      className='h-10 w-10 text-[#008000]'
                      strokeWidth={1.5}
                    />
                    <Sparkles className='absolute -right-2 -top-1 h-4 w-4 text-[#008000]' />
                  </div>
                  <h3 className='mb-2 text-base md:text-xl font-medium text-tertiary'>
                    Automatically{' '}
                    <span className='italic font-normal'>
                      (AI-Auto Filling)
                    </span>
                  </h3>
                  <p className='text-sm text-muted-foreground max-w-[460px]'>
                    {isDragging
                      ? 'Drop your PDF resume here'
                      : 'Upload or drag & drop your up-to-date resume (PDF only, max 5MB) and the AI will fill the information automatically'}
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
                    <h3 className='mb-2 text-base md:text-xl font-medium text-tertiary'>
                      Manually
                    </h3>
                    <p className='text-sm text-muted-foreground'>
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
