'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { adminStatusMap } from '@/utils/status';
import { useAdminContext } from '@/lib/contexts';
import { getUserDocuments } from '@/app/actions';
import {
  REQUIRED_CREDENTIALS as REQUIRED_CREDENTIALS_BASE,
  getCredentialLabel,
} from '@/lib/credential-config';

// SCRUM-60: admin Approve is gated on all 5 required credentials being Verified.
// Role-driven label is resolved from the caregiver's professionalInfo.role.
function buildRequiredCredentials(role?: string | null) {
  return REQUIRED_CREDENTIALS_BASE.map((c) => ({
    key: c.key,
    label: getCredentialLabel(c, role),
  }));
}

function CredentialGateDialog({
  missingReviews,
  onClose,
  role,
}: {
  missingReviews: string[];
  onClose: () => void;
  role?: string | null;
}) {
  const required = buildRequiredCredentials(role);
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl'>
        <AlertTriangle className='w-5 h-5 text-amber-500 shrink-0 mt-0.5' />
        <div>
          <p className='font-semibold text-amber-800 text-sm'>
            Cannot approve yet
          </p>
          <p className='text-amber-700 text-sm mt-1'>
            All required credentials must be reviewed before final verification.
            Please review the following documents first:
          </p>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        {required.map((cred) => {
          const missing = missingReviews.includes(cred.key);
          return (
            <div
              key={cred.key}
              className='flex items-center gap-3 px-4 py-3 border rounded-xl'
            >
              {missing ? (
                <XCircle className='w-5 h-5 text-red-400 shrink-0' />
              ) : (
                <CheckCircle2 className='w-5 h-5 text-primary shrink-0' />
              )}
              <span
                className={`text-sm font-medium ${missing ? 'text-red-600' : 'text-gray-500 line-through'}`}
              >
                {cred.label}
              </span>
              <span className='ml-auto text-xs text-gray-400'>
                {missing ? 'Not reviewed' : 'Reviewed ✓'}
              </span>
            </div>
          );
        })}
      </div>

      <Button onClick={onClose} className='w-full rounded-xl h-12'>
        OK, I&apos;ll review credentials first
      </Button>
    </div>
  );
}

export default function AdminAlertModal({
  children,
  open,
  setOpen,
  alertType,
  data,
}: {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  alertType?: 'block' | 'remove' | 'approve' | 'reject';
  data?: any;
  children?: React.ReactNode;
}) {
  const { refetchUsers, refetchQaUsers } = useAdminContext();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [note, setNote] = useState('');
  const [missingReviews, setMissingReviews] = useState<string[] | null>(null);
  const [checkingCredentials, setCheckingCredentials] = useState(false);
  const { toast } = useToast();

  const isProApproval = alertType === 'approve' && data?.role === 'pro';

  const handleOpenChange = async (o: boolean) => {
    if (o && isProApproval) {
      setCheckingCredentials(true);
      setIsOpen(true);
      try {
        const docs = await getUserDocuments(data._id);
        const required = buildRequiredCredentials(data?.professionalInfo?.role);
        const missing = required.filter((cred) => {
          const doc = (docs ?? []).find(
            (d: any) => d.documentType === cred.key
          );
          return !doc || doc.reviewStatus !== 'approved';
        }).map((c) => c.key);
        setMissingReviews(missing);
      } catch {
        setMissingReviews([]);
      } finally {
        setCheckingCredentials(false);
      }
    } else {
      setMissingReviews(null);
      if (setOpen) setOpen(o);
      else setIsOpen(o);
    }
  };

  const title =
    alertType === 'block'
      ? 'Blocking the user?'
      : alertType === 'remove'
        ? 'Removing the user?'
        : alertType === 'approve'
          ? 'Approving application?'
          : 'Rejecting application?';

  const description =
    alertType === 'block'
      ? 'You are about to block the user from logging to his account. The user will be notified through his registered email that his account has been blocked by the admin. <strong>Would you like to proceed?</strong>'
      : alertType === 'remove'
        ? 'You are about to remove the user from the platform. The user will be notified through his registered email that his account has been deleted by the admin. <strong>Would you like to proceed?</strong>'
        : alertType === 'approve'
          ? 'You are about to approve the Caregiver application. The Caregiver will be notified by your response. <strong>Would you like to proceed?</strong>'
          : alertType === 'reject'
            ? 'You are about to reject the Caregiver application. The Caregiver will be notified by your response. <strong>Would you like to proceed?</strong>'
            : '';

  const placeholder =
    alertType === 'block'
      ? 'Explain the reasons for the block. The user will be emailed by those notes..'
      : alertType === 'reject'
        ? 'Explain the reasons for rejecting the application. The user will be emailed by those notes..'
        : '';

  const showTextArea = alertType === 'block' || alertType === 'reject';
  const hasBlockingCredentials =
    isProApproval && missingReviews !== null && missingReviews.length > 0;

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: adminStatusMap[alertType as keyof typeof adminStatusMap],
          id: data._id,
          note,
          email: data?.email,
          alertType,
        }),
      });

      const responseData: any = await response.json();

      if (responseData.status === 200) {
        refetchUsers();
        refetchQaUsers();
        toast({
          variant: 'success',
          title: `User ${adminStatusMap[alertType as keyof typeof adminStatusMap]} successfully!`,
          description: 'The user will be notified by your response.',
        });
        buttonRef.current?.click();
        setIsLoading(false);
        setIsOpen(false);
        setOpen && setOpen(false);
        setNote('');
        setMissingReviews(null);
      } else {
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'Please try again.',
        });
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Please try again.',
      });
    }
  };

  return (
    <Dialog
      open={open || isOpen}
      onOpenChange={(o) => {
        if (!o) {
          setMissingReviews(null);
          setIsOpen(false);
          setOpen && setOpen(false);
        } else {
          handleOpenChange(o);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-full sm:max-w-[852px] p-4 sm:p-8'>
        {checkingCredentials ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='size-8 animate-spin text-primary' />
            <span className='ml-3 text-gray-500'>Checking credentials...</span>
          </div>
        ) : hasBlockingCredentials ? (
          <>
            <DialogHeader>
              <DialogTitle className='text-center mb-2 text-lg sm:text-xl'>
                Review Required
              </DialogTitle>
            </DialogHeader>
            <CredentialGateDialog
              missingReviews={missingReviews!}
              role={data?.professionalInfo?.role}
              onClose={() => {
                setIsOpen(false);
                setOpen && setOpen(false);
                setMissingReviews(null);
              }}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className='text-center mb-2 sm:mb-4 text-lg sm:text-xl'>
                {title}
              </DialogTitle>
              <DialogDescription
                className='text-sm sm:text-base text-center'
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </DialogHeader>

            {showTextArea && (
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={placeholder}
                className='min-h-[120px] sm:min-h-[160px] rounded-lg sm:rounded-xl'
              />
            )}

            <div className='flex flex-row gap-2 sm:gap-3 mt-2'>
              <Button
                variant='outline'
                onClick={handleSubmit}
                className={cn(
                  'flex-1 h-[50px] sm:h-[75px] rounded-lg sm:rounded-xl hover:text-black text-lg',
                  alertType === 'approve' && 'bg-primary text-white',
                )}
                disabled={isLoading}
              >
                Yes! {isLoading && <Loader2 className='size-4 animate-spin' />}
              </Button>
              <DialogClose asChild ref={buttonRef}>
                <Button
                  variant='outline'
                  className={cn(
                    'flex-1 h-[50px] sm:h-[75px] rounded-lg sm:rounded-xl text-lg',
                    alertType !== 'approve' &&
                      'bg-red-600 hover:bg-red-600/90 text-white',
                  )}
                  disabled={isLoading}
                >
                  No
                </Button>
              </DialogClose>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
