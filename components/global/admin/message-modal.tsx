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

export function MessageModal({ children, data }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const message = (e.target as HTMLFormElement).message.value;
    const notificationPayload = {
      message: `<p><span style="font-weight: 600; color: #008000;">You have a new message from Admin</span> <br> ${message}</p>`,
      user: data._id,
    };

    try {
      await fetch('/api/user/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationPayload),
      });

      toast({
        variant: 'success',
        title: 'Message sent successfully',
      });

      setIsLoading(false);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
      });
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-[720px] w-full p-0 bg-[#F9F9FA] max-h-[90vh] overflow-auto'>
        <DialogHeader className='p-4 md:px-8 md:pt-8 pb-0'>
          <DialogTitle className='text-start text-lg md:text-xl font-semibold'>
            Message details
          </DialogTitle>
        </DialogHeader>
        <form className='p-4 pt-0 md:p-8 md:pt-0' onSubmit={handleSubmit}>
          <div className='space-y-3 md:space-y-4'>
            <div className='bg-white rounded-lg md:rounded-xl p-3 md:p-6'>
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
                className='min-h-[150px] md:min-h-[250px] resize-none border-gray-200'
                placeholder='Write your message and the details here...'
                name='message'
              />
            </div>
            <div className='flex flex-row gap-2 md:gap-3 mt-4 md:mt-6'>
              <Button
                type='submit'
                className='h-[50px] md:h-[75px] rounded-lg md:rounded-xl text-sm md:text-base font-semibold order-1 md:order-none flex-1'
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Submit'}
              </Button>
              <Button
                disabled={isLoading}
                onClick={() => setIsOpen(false)}
                type='button'
                variant='outline'
                className='h-[50px] md:h-[75px] rounded-lg md:rounded-xl text-sm md:text-base font-semibold flex-1'
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
