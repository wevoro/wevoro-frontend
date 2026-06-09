'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ApplyConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

const ApplyConfirmDialog: React.FC<ApplyConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px] p-6'>
        <DialogHeader>
          <DialogTitle className='text-center text-lg sm:text-xl font-semibold'>
            Apply to Shift?
          </DialogTitle>
          <DialogDescription className='text-center text-sm sm:text-base text-muted-foreground'>
            You are about to apply to this job offer. The company will be
            notified by your request.{' '}
            <strong className='text-gray-900'>
              Would you like to proceed?
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className='flex gap-3 mt-2'>
          <Button
            className='flex-1 h-12 rounded-xl font-semibold bg-primary text-white'
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              'Yes!'
            )}
          </Button>
          <Button
            variant='outline'
            className='flex-1 h-12 rounded-xl font-semibold border-gray-200'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            No
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyConfirmDialog;
