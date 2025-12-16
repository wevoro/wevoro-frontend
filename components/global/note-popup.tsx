'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useNotificationsContext,
  useOffersContext,
  useUserContext,
} from '@/lib/contexts';

interface Note {
  role: 'partner' | 'pro';
  note: string;
  _id: string;
}

const NotesPopup = ({
  notes,
  id,
  proId,
  partnerId,
}: {
  notes: Note[];
  id: string;
  proId: string;
  partnerId: string;
}) => {
  const { refetchOffers } = useOffersContext();
  const { sendNotification } = useNotificationsContext();
  const { user } = useUserContext();
  // const { user, refetchOffers, sendNotification } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  console.log({ id });

  const [newNote, setNewNote] = useState({
    role: user?.role,
    note: '',
  });

  const handleSendNote = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/user/offer/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ id, ...newNote }),
    });
    const responseData: any = await response.json();
    if (responseData.status === 200) {
      refetchOffers();
      const notificationPayload = {
        message: '',
        user: '',
      };
      setNewNote({ role: user?.role, note: '' });
      toast.success('Note sent successfully!');
      setOpen(false);
      if (user?.role === 'partner') {
        notificationPayload.message = `<p><span style="font-weight: 600; color: #008000;">${user?.personalInfo?.companyName}</span> has added a note to your offer.</p>`;
        notificationPayload.user = proId;
      } else {
        notificationPayload.message = `<p><span style="font-weight: 600; color: #008000;">${user?.personalInfo?.firstName} ${user?.personalInfo?.lastName}</span> has added a note to your offer.</p>`;
        notificationPayload.user = partnerId;
      }
      await sendNotification(
        notificationPayload.message,
        notificationPayload.user
      );
    } else {
      toast.error('Failed to send note');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='link' className='text-primary underline p-0 h-auto'>
          View notes
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold'>
            Important Notes
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className='h-[300px] w-full'>
          <div className='flex flex-col gap-2'>
            {notes.map((note) => (
              <div
                key={note._id}
                className={cn(
                  'w-full p-4 border border-input rounded-lg text-sm bg-[#F9F9FA]',
                  note.role === user?.role ? 'bg-[#fffbfb]' : 'bg-accent'
                )}
              >
                <p
                  className={
                    note.role === user?.role ? 'text-right' : 'text-left'
                  }
                >
                  {note.note}
                </p>
                <p
                  className={`text-xs mt-1 text-gray-500 ${note.role === user?.role ? 'text-right' : 'text-left'} uppercase text-gray-500`}
                >
                  {note.role === user?.role ? 'You' : note.role}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className='mt-4'>
          <Textarea
            placeholder='Type your response here..'
            className='resize-none bg-[#f9f9f9] h-[100px] text-[#5E6864] rounded-[12px]'
            value={newNote.note}
            onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
          />
        </div>
        <div className='flex justify-end gap-2'>
          <Button
            className='h-12 px-12 rounded-[12px]'
            onClick={handleSendNote}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Submit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesPopup;
