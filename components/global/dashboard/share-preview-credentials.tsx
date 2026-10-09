'use client';

import React from 'react';
import { Check, HelpCircle, ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Item {
  key: string;
  label: string;
  verified: boolean;
}

/**
 * SCRUM-133 (Faisal, public preview): a shared profile is 5 of 5, so the
 * fraction and its progress bar are gone — "All 5 credentials verified" in
 * green, with the Confirmed Credentials tooltip listing all five.
 *
 * The public link now opens ONLY while all 5 are verified (the server gate in
 * user.service#getUserByShareId, per Gene's "no partial-verification view is
 * ever exposed externally"): if a credential later expires or is rejected the
 * link shows "not ready to share" instead of this card. The partial wording
 * below is therefore a safety net, not a state an agency should ever see.
 */
const SharePreviewCredentials: React.FC<{
  verified: number;
  total: number;
  items?: Item[];
}> = ({ verified, total, items = [] }) => {
  const all = total > 0 && verified >= total;
  const shown = items.filter((i) => i.verified);

  return (
    <div
      data-testid='share-preview-credentials'
      className='flex items-center justify-center gap-2 rounded-2xl bg-[#F9F9FA] px-4 py-4'
    >
      <ShieldCheck className={`size-5 ${all ? 'text-[#008000]' : 'text-[#6C6C6C]'}`} />
      <span className={`text-sm font-semibold ${all ? 'text-[#008000]' : 'text-[#3A4742]'}`}>
        {all
          ? `All ${total} credentials verified`
          : `${Math.min(verified, total)} of ${total} credentials verified`}
      </span>
      {shown.length > 0 && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type='button' aria-label='Confirmed credentials' className='text-[#6C6C6C]'>
                <HelpCircle className='size-4' />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side='right'
              className='rounded-2xl border-none bg-[#1C1C1C] p-4 text-white'
            >
              <p className='mb-2 text-sm font-medium'>Confirmed Credentials</p>
              <ul className='flex flex-col gap-1.5'>
                {shown.map((i) => (
                  <li key={i.key} className='flex items-center gap-2 text-xs'>
                    <Check className='size-3.5 text-[#33B55B]' strokeWidth={2.5} />
                    {i.label}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default SharePreviewCredentials;
