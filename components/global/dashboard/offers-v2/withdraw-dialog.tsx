'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: any;
  status: 'pending' | 'upcoming' | 'active';
}

const WithdrawDialog: React.FC<WithdrawDialogProps> = ({
  open,
  onOpenChange,
  offer,
  status,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const isPenaltyState = status === 'upcoming' || status === 'active';

  const consequence = isPenaltyState
    ? 'Withdrawing now will count as a Pre-Start Cancellation on your metrics.'
    : 'Withdrawing now will not affect your metrics.';

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/offer/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer._id,
          status: 'rejected',
          isRemovedByPro: true,
          withdraw: true,
          previousStatus: status,
        }),
      });
      if (res.ok) {
        toast.success('Application withdrawn');
        queryClient.invalidateQueries({ queryKey: ['offers'] });
        onOpenChange(false);
      } else {
        toast.error('Failed to withdraw. Try again.');
      }
    } catch {
      toast.error('Failed to withdraw. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px] p-6'>
        <DialogHeader>
          <DialogTitle className='text-center text-lg sm:text-xl font-semibold'>
            Withdraw application?
          </DialogTitle>
          <DialogDescription className='text-center text-sm text-muted-foreground'>
            {consequence}
          </DialogDescription>
        </DialogHeader>

        <div className='flex gap-3 mt-2'>
          <Button
            variant='outline'
            className='flex-1 h-12 rounded-xl font-semibold border-gray-200'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep application
          </Button>
          <Button
            className='flex-1 h-12 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white'
            onClick={handleWithdraw}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              'Withdraw application'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;
