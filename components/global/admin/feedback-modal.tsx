'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { X, Paperclip, Check, User, PhoneCall } from 'lucide-react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { useAppContext } from '@/lib/context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FeedbackModalProps {
  data: any;
  children: React.ReactNode;
}

export function FeedbackModal({ data, children }: FeedbackModalProps) {
  const { refetchFeedbacks } = useAppContext();

  const [open, setOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    if (open && data.status === 'New') {
      updateFeedbackStatus('Pending');
    }
  }, [open, data.status]);

  const updateFeedbackStatus = async (status: string) => {
    try {
      const payload =
        status === 'Pending'
          ? {
              status,
              isReadByAdmin: true,
            }
          : {
              status,
            };

      const response = await fetch(`/api/admin/feedback/${data._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        refetchFeedbacks();
      }
    } catch (error) {
      console.error('Error updating feedback status:', error);
    }
  };

  const handleMarkAsSolved = () => {
    updateFeedbackStatus('Solved');
  };

  const handleSubmitReply = async () => {
    if (!replyMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/feedback/${data._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: replyMessage, email: data.user.email }),
      });

      if (response.ok) {
        setReplyMessage('');
        setOpen(false);
        return toast({
          variant: 'success',
          title: 'Reply sent successfully',
          description: 'The user will receive your reply.',
        });
      }

      setReplyMessage('');
      setOpen(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).format('MMM Do, YYYY. hh:mm A');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-[561px] max-h-[90vh] overflow-y-auto p-8'>
        <DialogHeader className='flex justify-between flex-row mt-8 mb-4'>
          <div className='flex flex-col gap-1 w-max'>
            <DialogTitle className='text-sm text-[#6C6C6C] font-normal'>
              {formatDate(data.createdAt)}
            </DialogTitle>
            <div className='flex gap-2 w-max'>
              {data.selections?.map((selection: string, index: number) => (
                <div
                  key={index}
                  className={cn(
                    'text-xs p-2 rounded-[30px] w-max bg-[#F9F9FA] text-[#6C6C6C]'
                  )}
                >
                  {selection}
                </div>
              ))}
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              variant='outline'
              onClick={handleMarkAsSolved}
              className='text-primary border-primary'
              disabled={data?.status === 'Solved'}
            >
              <Check className='size-5 mr-2' />{' '}
              {data?.status === 'Solved' ? 'Solved' : 'Mark as Solved'}
            </Button>
          </div>
        </DialogHeader>

        <div className='space-y-5'>
          <div className='border border-[#DFE2E0] rounded-lg p-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-base text-[#1C1C1C] inline-flex items-center gap-2'>
                <User className='size-5 text-[#6C6C6C]' /> User Information
              </h3>

              {data.user?.phone && (
                <Button
                  size='icon'
                  variant='ghost'
                  className='rounded-xl bg-[#F9F9FA] flex items-center'
                  onClick={() => {
                    window.location.href = `tel:${data.user?.phone}`;
                  }}
                >
                  <PhoneCall className='size-5 text-[#008000]' />
                </Button>
              )}
            </div>

            <div className='flex items-center gap-8'>
              <div className='flex flex-col items-start min-w-[160px]'>
                <Image
                  unoptimized
                  src={data.user?.image}
                  alt={data.user?.name}
                  className='rounded-full object-cover mb-3'
                  width={58}
                  height={58}
                />
                <span className='text-base font-medium text-[#1C1C1C]'>
                  {data.user?.name}
                </span>
              </div>
              {/* Right: Details */}
              <div className='flex-1 grid grid-cols-2 gap-y-3 text-sm'>
                <div className='text-[#6C6C6C] font-medium flex items-center'>
                  Type
                </div>
                <div className='text-right text-[#1C1C1C] font-normal'>
                  {data.user?.role}
                </div>
                <div className='text-[#6C6C6C] font-medium flex items-center'>
                  Email
                </div>
                <div className='text-right text-[#1C1C1C] font-normal truncate'>
                  {data.user?.email}
                </div>
                {data.user?.phone && (
                  <>
                    <div className='text-[#6C6C6C] font-medium flex items-center'>
                      Phone
                    </div>
                    <div className='text-right text-[#1C1C1C] font-normal'>
                      {data.user?.phone}
                    </div>
                  </>
                )}
                {data.user?.address && (
                  <>
                    <div className='text-[#6C6C6C] font-medium flex items-center'>
                      Address
                    </div>
                    <div className='text-right text-[#1C1C1C] font-normal'>
                      {data.user?.address}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Message Details */}
          <div>
            <h3 className='text-base font-medium text-[#1C1C1C] mb-4'>
              Message Details
            </h3>
            <div className='bg-[#F9F9FA] rounded-lg py-4 px-6'>
              <p className='text-gray-800 leading-relaxed'>{data.message}</p>
            </div>
          </div>

          {/* Reply Message */}
          <div>
            <h3 className='text-sm text-[#1C1C1C] mb-4'>Reply Message</h3>
            <div className='space-y-4'>
              <Textarea
                placeholder='Enter your message...'
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className='min-h-[88px] placeholder:text-[#DFE2E0] resize-none border border-[#DFE2E0] rounded-lg'
              />

              <div className='flex justify-end'>
                <Button
                  onClick={handleSubmitReply}
                  disabled={!replyMessage.trim() || isSubmitting}
                  className='rounded-lg p-3'
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Message'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
