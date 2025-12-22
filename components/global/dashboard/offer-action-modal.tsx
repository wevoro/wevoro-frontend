'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/lib/context';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useNotificationsContext,
  useOffersContext,
  useUIContext,
  useUserContext,
} from '@/lib/contexts';

export default function OfferActionModal() {
  const { user } = useUserContext();
  const { sendNotification } = useNotificationsContext();
  const { refetchOffers } = useOffersContext();
  const { actionData, isOpenOfferAction, closeOfferAction } = useUIContext();
  const router = useRouter();

  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (status: string) => {
    setIsLoading(true);

    const response = await fetch(`/api/user/offer/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: actionData?.id,
        status,
        notes: [
          ...actionData?.notes,
          {
            note: notes,
            role: 'pro',
          },
        ],
      }),
    });

    const responseData = await response.json();
    if (responseData.status === 200) {
      refetchOffers();
      closeOfferAction();
      router.push(`/pro/jobs`);
      toast.success(`Offer ${status} successfully!`);

      await sendNotification(
        `<p>Your offer has been <strong>${status}</strong> by <span style="font-weight: 600; color: #008000;">${user?.personalInfo?.firstName} ${user?.personalInfo?.lastName}</span>.</p><p><strong>Pro's note:</strong> ${notes}</p>`,
        actionData?.partnerId
      );
    } else {
      toast.error(`Failed to ${status} offer`);
    }

    setIsLoading(false);
  };

  console.log({ isLoading });

  return (
    <Dialog open={isOpenOfferAction} onOpenChange={closeOfferAction}>
      <DialogContent className='sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle className='text-center text-xl'>
            Important Notes (optional)
          </DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <Textarea
            className='min-h-[150px] resize-none p-4 h-40 rounded-[12px]'
            placeholder='Enter your notes here...'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            onClick={() =>
              handleAction(
                actionData?.type === 'accept' ? 'accepted' : 'rejected'
              )
            }
            className='w-full bg-primary text-white font-medium py-6 rounded-[12px] h-[50px]'
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Ok!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
