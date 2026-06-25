'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

/**
 * SCRUM-51/53: Send Message modal used by the credentialing-mode Offers cards.
 * Delivers the message to the recipient as an in-app notification (SCRUM-53),
 * mirroring the existing admin MessageModal pattern but with neutral copy so it
 * works caregiver -> agency and agency -> caregiver.
 */
export function SendMessageModal({
  children,
  recipientId,
  recipientName,
}: {
  children: React.ReactNode;
  recipientId: string;
  recipientName?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const message = (e.target as HTMLFormElement).message.value;
    const notificationPayload = {
      message: `<p>${message}</p>`,
      user: recipientId,
    };

    try {
      await fetch('/api/user/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationPayload),
      });

      toast({ variant: 'success', title: 'Message sent successfully' });
      setIsLoading(false);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to send message' });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-[720px] w-full p-0 bg-[#F9F9FA] dark:bg-neutral-900 max-h-[90vh] overflow-auto'>
        <DialogHeader className='p-4 md:px-8 md:pt-8 pb-0'>
          <DialogTitle className='text-start text-lg md:text-xl font-semibold'>
            {recipientName ? `Message ${recipientName}` : 'Send a message'}
          </DialogTitle>
        </DialogHeader>
        <form className='p-4 pt-0 md:p-8 md:pt-0' onSubmit={handleSubmit}>
          <div className='space-y-3 md:space-y-4'>
            <div className='bg-white dark:bg-neutral-800 rounded-lg md:rounded-xl p-3 md:p-6'>
              <label
                htmlFor='message'
                className='text-sm md:text-base font-medium block mb-2'
              >
                Your Message
              </label>
              <Textarea
                disabled={isLoading}
                required
                id='message'
                className='min-h-[150px] md:min-h-[250px] resize-none border-gray-200 dark:border-neutral-700'
                placeholder='Write your message and the details here...'
                name='message'
              />
            </div>
            <div className='flex flex-row gap-2 md:gap-3 mt-4 md:mt-6'>
              <Button
                type='submit'
                className='h-[50px] md:h-[60px] rounded-lg md:rounded-xl text-sm md:text-base font-semibold flex-1'
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Message'}
              </Button>
              <Button
                disabled={isLoading}
                onClick={() => setIsOpen(false)}
                type='button'
                variant='outline'
                className='h-[50px] md:h-[60px] rounded-lg md:rounded-xl text-sm md:text-base font-semibold flex-1'
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SendMessageModal;
