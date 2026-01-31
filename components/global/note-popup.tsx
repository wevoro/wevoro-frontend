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
import { useUserContext } from '@/lib/contexts';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

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
  console.log('🚀 ~ NotesPopup ~ notes:', notes);
  const { user } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState({
    role: user?.role,
    note: '',
  });

  const handleSendNote = async () => {
    if (!newNote.note.trim()) return;

    setIsLoading(true);
    const response = await fetch(`/api/user/offer/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ id, ...newNote }),
    });
    const responseData: any = await response.json();
    if (responseData.status === 200) {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setNewNote({ role: user?.role, note: '' });
      toast.success('Note sent successfully!');
      setOpen(false);
      // Notification is now sent from the backend
    } else {
      toast.error('Failed to send note');
    }
    setIsLoading(false);
  };

  const isOwnNote = (noteRole: string) => noteRole === user?.role;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className='inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200'>
          <MessageSquare className='w-4 h-4' />
          <span>View notes</span>
        </button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl'>
        {/* Header */}
        <DialogHeader className='px-6 py-4 bg-slate-50 border-b border-slate-100'>
          <DialogTitle className='text-lg font-semibold text-foreground flex items-center gap-2'>
            <MessageSquare className='w-5 h-5 text-primary' />
            Notes
          </DialogTitle>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Conversation history for this offer
          </p>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className='h-[320px] '>
          <div className='flex flex-col gap-4 p-5'>
            {notes.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-[260px] text-slate-400'>
                <MessageSquare className='w-12 h-12 mb-3 opacity-40' />
                <p className='text-sm font-medium'>No notes yet</p>
                <p className='text-xs'>Start the conversation below</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note._id}
                  className={cn(
                    'flex flex-col max-w-[85%]',
                    isOwnNote(note.role)
                      ? 'self-end items-end'
                      : 'self-start items-start',
                  )}
                >
                  {/* Role Label */}
                  <span
                    className={cn(
                      'text-[11px] font-medium mb-1.5 px-1',
                      isOwnNote(note.role) ? 'text-primary' : 'text-slate-500',
                    )}
                  >
                    {isOwnNote(note.role)
                      ? 'You'
                      : note.role.charAt(0).toUpperCase() + note.role.slice(1)}
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200',
                      isOwnNote(note.role)
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md',
                    )}
                  >
                    {note.note}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className='p-4 bg-white border-t border-slate-100'>
          <div className='flex gap-3 items-center'>
            <Textarea
              placeholder='Write your note...'
              className='flex-1 min-h-[52px] max-h-[120px] resize-none bg-slate-50 border-slate-200 rounded-xl text-sm placeholder:text-slate-400 transition-all duration-200'
              value={newNote.note}
              onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendNote();
                }
              }}
            />
            <Button
              onClick={handleSendNote}
              disabled={isLoading || !newNote.note.trim()}
              className='h-[52px] w-[52px] rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg'
            >
              {isLoading ? (
                <Loader2 className='w-5 h-5 animate-spin' />
              ) : (
                <Send className='w-5 h-5' />
              )}
            </Button>
          </div>
          <p className='text-[11px] text-slate-400 mt-2 text-center'>
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesPopup;
