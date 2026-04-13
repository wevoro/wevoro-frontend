import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PartnerRequestModal } from './partner-request-modal';
import { useAppContext } from '@/lib/context';
import { cn } from '@/lib/utils';
import { useUIContext, useUserContext } from '@/lib/contexts';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function AlertModal() {
  const { isOpenAlert, closeAlert, actionData, openOfferAction } =
    useUIContext();
  const { user } = useUserContext();

  const hasDocuments =
    user?.documents?.certificate ||
    user?.documents?.resume ||
    user?.documents?.governmentId;

  const title =
    actionData?.type === 'accept'
      ? 'Accepting the Offer?'
      : 'Rejecting the Offer?';
  const description =
    actionData?.type === 'accept'
      ? 'You are about to accept this job offer. The company will be notified by your response. Would your like to proceed?'
      : 'You are about to reject this job offer. The company will be notified by your response. Would your like to proceed?';

  const handleAccept = () => {
    if (actionData?.type === 'accept' && !hasDocuments) {
      toast.error(
        'You need to upload documents before accepting offers. Please complete your document upload first.',
        { position: 'top-center', duration: 5000 }
      );
      return;
    }
    closeAlert();
    openOfferAction();
  };

  return (
    <AlertDialog open={isOpenAlert} onOpenChange={closeAlert}>
      <AlertDialogContent className='sm:max-w-[600px]'>
        <AlertDialogHeader>
          <AlertDialogTitle className='font-semibold text-base md:text-lg text-center'>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-center text-[#6C6C6C] text-sm md:text-base font-normal !my-0 bg-white px-6 py-2 rounded-sm'>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {actionData?.type === 'accept' && !hasDocuments && (
          <div className='flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mx-4'>
            <AlertTriangle className='size-5 text-amber-500 shrink-0 mt-0.5' />
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium text-amber-800'>
                Documents Required
              </p>
              <p className='text-xs text-amber-700'>
                You must upload your documents before accepting offers.{' '}
                <Link
                  href='/pro/onboard/document-upload'
                  className='underline font-medium'
                  onClick={closeAlert}
                >
                  Upload now →
                </Link>
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter className='flex flex-row gap-4 w-full'>
          {/* <PartnerRequestModal /> */}

          <Button
            variant={actionData?.type === 'reject' ? 'outline' : 'default'}
            type='button'
            className={cn('w-full md:h-[60px] rounded-[12px]')}
            onClick={handleAccept}
          >
            Yes
          </Button>
          <Button
            type='button'
            variant={actionData?.type === 'accept' ? 'outline' : 'destructive'}
            className={cn('w-full md:h-[60px] rounded-[12px]')}
            onClick={closeAlert}
          >
            No
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
