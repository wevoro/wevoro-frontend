'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

const CopyApplyLink = ({ link }: { link: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error: any) {
      toast.error(error?.message || 'Could not copy the link.');
    }
  };

  return (
    <div className='flex flex-col gap-3 w-full'>
      <p className='text-sm sm:text-base font-semibold text-tertiary'>
        Copy Link for Applying the Job
      </p>
      <div className='flex items-center gap-2 bg-[#FAFAFA] rounded-xl h-[52px] pl-4 pr-2'>
        <span className='flex-1 truncate text-sm sm:text-base text-[#1C1C1C]'>
          {link}
        </span>
        <button
          type='button'
          onClick={handleCopy}
          aria-label='Copy application link'
          className='flex items-center gap-2 shrink-0 h-9 px-3 rounded-lg bg-[#DFE2E0] text-sm font-medium text-[#3A4742] transition-colors hover:bg-[#D2D6D4]'
        >
          {copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export default CopyApplyLink;
