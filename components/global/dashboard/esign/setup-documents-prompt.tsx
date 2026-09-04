'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { File } from 'lucide-react';

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
  caregiverName,
  onUpload,
  onContinueAnyway,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: 'CNA' | 'PCA';
  caregiverName?: string;
  onUpload: () => void;
  onContinueAnyway: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[540px] gap-5 rounded-2xl p-7 sm:rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='text-start text-[20px] font-semibold text-[#1C1C1C] dark:text-white'>
            Set up your {role} documents
          </DialogTitle>
        </DialogHeader>

        <div className='flex size-14 items-center justify-center rounded-full bg-[#E0FCED]'>
          <File className='size-6 text-[#008000]' />
        </div>

        <p className='text-[14px] leading-[22px] text-[#6C6C6C] dark:text-neutral-300'>
          {caregiverName || 'This caregiver'} is a {role}, but you haven&apos;t
          added any {role} documents yet. Add one or more so they&apos;re sent
          automatically for signature the moment they connect with your agency.
        </p>

        <div className='flex items-center justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={onContinueAnyway}
            className='h-10 rounded-[10px] border-[#DFE2E0] px-5 text-[14px] font-semibold text-[#1C1C1C]'
          >
            Continue anyway
          </Button>
          <Button
            type='button'
            onClick={onUpload}
            className='h-10 rounded-[10px] bg-primary px-5 text-[14px] font-semibold text-white'
          >
            Upload {role} documents
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
