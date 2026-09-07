'use client';

import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/** Cents to a plain dollar string: 4999 -> "49.99". */
const toDollars = (cents: number) => (cents / 100).toFixed(2);

interface EditPriceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPriceCents: number;
  onSaved: () => void;
}

/**
 * SCRUM-113 — "Edit packet price".
 *
 * The note about future packets is not decoration: the price is stored as a
 * value on each transaction, so changing it here genuinely cannot alter what an
 * agency was already charged. The copy says so because it is true.
 */
const EditPriceModal: React.FC<EditPriceModalProps> = ({
  open,
  onOpenChange,
  currentPriceCents,
  onSaved,
}) => {
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPrice(toDollars(currentPriceCents));
      setReason('');
    }
  }, [open, currentPriceCents]);

  const save = async () => {
    const value = Number(price);
    if (!Number.isFinite(value) || value < 0) {
      toast.error('Enter a valid price');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPrice: value, reason }),
      });
      const json = await res.json();
      if (!res.ok || json?.status !== 200) {
        toast.error(json?.message || 'Could not update the price');
        return;
      }
      toast.success('Price updated');
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error('Could not update the price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* DialogContent renders its own close button, so this adds none. */}
      <DialogContent className='max-w-[440px] gap-0 p-0'>
        <div className='px-6 pt-6'>
          <h2 className='text-[18px] font-semibold text-[#1C1C1C]'>Edit packet price</h2>
        </div>

        <p className='px-6 pt-2 text-[13px] text-[#6C6C6C]'>
          Current price: ${toDollars(currentPriceCents)} per packet
        </p>

        <div className='px-6 pt-5'>
          <label htmlFor='new-price' className='text-[13px] font-medium text-[#1C1C1C]'>
            New price
          </label>
          <div className='mt-1.5 flex items-center rounded-lg border-2 border-[#008000] bg-white px-3.5 py-2.5'>
            <span className='text-[15px] text-[#6C6C6C]'>$</span>
            <input
              id='new-price'
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode='decimal'
              className='w-full bg-transparent px-2 text-[15px] text-[#1C1C1C] outline-none'
            />
            <span className='shrink-0 text-[13px] text-[#6C6C6C]'>per packet</span>
          </div>
        </div>

        <div className='px-6 pt-4'>
          <label htmlFor='reason' className='text-[13px] font-medium text-[#1C1C1C]'>
            Reason for change <span className='text-[#6C6C6C]'>(optional)</span>
          </label>
          <textarea
            id='reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder='e.g. Standard rate increase for Q4'
            className='mt-1.5 w-full resize-none rounded-lg border border-[#DFE2E0] bg-white px-3.5 py-2.5 text-[14px] text-[#1C1C1C] outline-none placeholder:text-[#9CA3A0] focus:border-[#008000]'
          />
        </div>

        <div className='mx-6 mt-4 flex gap-2.5 rounded-lg bg-[#F4F6F5] px-3.5 py-3'>
          <Info className='mt-0.5 size-4 shrink-0 text-[#6C6C6C]' />
          <p className='text-[12.5px] leading-[18px] text-[#6C6C6C]'>
            This updates the price for all future packets and is logged in the change
            history. Existing transactions keep the price they were charged.
          </p>
        </div>

        <div className='flex items-center justify-end gap-3 px-6 py-5'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='h-10 rounded-lg border-[#DFE2E0] px-5 text-[14px] font-medium text-[#1C1C1C]'
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className='h-10 rounded-lg bg-[#008000] px-5 text-[14px] font-semibold text-white hover:bg-[#016b01]'
          >
            {saving ? 'Saving…' : 'Save new price'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPriceModal;
