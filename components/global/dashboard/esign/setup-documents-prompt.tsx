'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileSignature } from 'lucide-react';

/**
 * SCRUM-117/118: Shown when an agency is about to send an offer to a caregiver
 * whose role has no signing documents yet. "Continue anyway" (not "Not now") is
 * deliberate — the client rejected the softer label because it hid the fact that
 * skipping means nothing goes out for signature on this offer.
 */
export default function SetupDocumentsPrompt({
  open,
  onOpenChange,
  role,
  onUpload,
  onContinueAnyway,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: 'CNA' | 'PCA';
  onUpload: () => void;
  onContinueAnyway: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[720px] w-full p-0 bg-[#F9F9FA] dark:bg-neutral-900 max-h-[90vh] overflow-auto'>
        <DialogHeader className='p-4 md:px-8 md:pt-8 pb-0'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
              <FileSignature className='size-5 text-primary' />
            </div>
            <DialogTitle className='text-start text-lg md:text-xl font-semibold text-[#1C1C1C] dark:text-white'>
              Set up {role} documents
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className='p-4 pt-0 md:p-8 md:pt-0'>
          <div className='space-y-3 md:space-y-4'>
            <div className='bg-white dark:bg-neutral-800 rounded-lg md:rounded-xl p-4 md:p-6 space-y-3'>
              <p className='text-sm md:text-base text-[#6C6C6C] dark:text-neutral-300 leading-relaxed'>
                You haven&apos;t added any documents for {role}s yet. Add them now
                and WeVoro will send them for signature automatically whenever a{' '}
                {role} connects with your agency.
              </p>
              <p className='text-xs md:text-sm text-[#5E6864] dark:text-neutral-400 leading-relaxed'>
                You can also continue without them — no documents will be sent for
                signature on this offer, and you&apos;ll handle signing yourself.
              </p>
            </div>
            <div className='flex flex-row gap-2 md:gap-3 mt-4 md:mt-6'>
              <Button
                type='button'
                onClick={onUpload}
                className='h-[50px] md:h-[60px] rounded-lg md:rounded-xl text-sm md:text-base font-semibold flex-1'
              >
                Upload documents
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={onContinueAnyway}
                className='h-[50px] md:h-[60px] rounded-lg md:rounded-xl text-sm md:text-base font-semibold flex-1'
              >
                Continue anyway
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
