import { TooltipContent } from '@/components/ui/tooltip';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BadgeCheck, Info } from 'lucide-react';
import React from 'react';

const ProfileName = ({
  name,
  status,
  fromSpecialPage,
}: {
  name?: string;
  status?: string;
  fromSpecialPage?: boolean;
}) => {
  return (
    <h1 className='text-xl sm:text-2xl font-semibold flex items-center gap-2'>
      {name || 'N/A'}
      {(status === 'pending' || status === 'rejected') && (
        <span className='flex items-center gap-1'>
          <BadgeCheck className='w-7 h-7 fill-[#e0e2e1] text-white' />
          <i className='text-xs text-muted-foreground font-light'>Pending</i>
        </span>
      )}
      {status === 'approved' && (
        <svg
          width='28'
          height='28'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <defs>
            <linearGradient
              id='greenGradient'
              x1='0%'
              y1='100%'
              x2='0%'
              y2='0%'
            >
              <stop offset='0%' stopColor='#008000' />
              <stop offset='99.4%' stopColor='#33B55B' />
            </linearGradient>
          </defs>
          <BadgeCheck
            className='w-7 h-7 text-white'
            fill='url(#greenGradient)'
          />
        </svg>
      )}
      {status === 'rejected' && !fromSpecialPage && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className='w-5 h-5 fill-[#FF5652] text-white' />
            </TooltipTrigger>
            <TooltipContent>
              <p className='max-w-[200px] text-xs font-extralight'>
                Your application was rejected. Please update your profile.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </h1>
  );
};

export default ProfileName;
