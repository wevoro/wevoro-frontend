import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useUIContext } from '@/lib/contexts';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

export function AutoFillAlert({ source }: { source: string }) {
  const { setOpenAutoFillModal, setAutoFillClicked } = useUIContext();
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>
        <Button
          type='button'
          variant={'special'}
          className='inline-flex items-center gap-2 font-medium text-[#008000]'
        >
          Fill Automatically{' '}
          <span className='italic font-normal'>(AI-Auto Filling)</span>{' '}
          <Sparkles className='h-4 w-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className='sm:max-w-[600px]'>
        <AlertDialogHeader>
          <AlertDialogTitle className='font-semibold text-base md:text-lg text-center'>
            Continue with Auto Filling?
          </AlertDialogTitle>
          <AlertDialogDescription className='text-center text-muted-foreground text-sm md:text-base font-normal !my-0 bg-white px-6 py-2 rounded-sm'>
            You are about to use AI auto filling feature. All the information
            filled out by you will be replaced. Would your like to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='flex flex-row gap-4 w-full'>
          <Button
            variant='default'
            type='button'
            className={cn('w-full md:h-[60px] rounded-[12px]')}
            onClick={() => {
              setOpenAutoFillModal(true);
              setAutoFillClicked(source);
              setOpen(false);
            }}
          >
            Yes
          </Button>
          <Button
            type='button'
            variant='outline'
            className={cn('w-full md:h-[60px] rounded-[12px]')}
            onClick={() => setOpen(false)}
          >
            No
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
