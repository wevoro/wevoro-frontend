import { Button } from '@/components/ui/button';
import { TooltipContent } from '@/components/ui/tooltip';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BadgeCheck, Dot, Info } from 'lucide-react';
import React from 'react';
import PartnerVerificationModal from './partner-verification-modal';

const QuestionMarkIcon = React.forwardRef<
  SVGSVGElement,
  React.ComponentPropsWithoutRef<'svg'>
>((props, ref) => (
  <svg
    ref={ref}
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className='lucide lucide-circle-question-mark-icon lucide-circle-question-mark text-muted-foreground size-4 ml-1'
    {...props}
  >
    <circle cx='12' cy='12' r='10' />
    <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
    <path d='M12 17h.01' />
  </svg>
));

QuestionMarkIcon.displayName = 'QuestionMarkIcon';

const ReviewIcon = React.forwardRef<
  SVGSVGElement,
  React.ComponentPropsWithoutRef<'svg'>
>((props, ref) => {
  return (
    <svg
      ref={ref}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='lucide lucide-clock-fading-icon lucide-clock-fading size-4'
      {...props}
    >
      <path d='M12 2a10 10 0 0 1 7.38 16.75' />
      <path d='M12 6v6l4 2' />
      <path d='M2.5 8.875a10 10 0 0 0-.5 3' />
      <path d='M2.83 16a10 10 0 0 0 2.43 3.4' />
      <path d='M4.636 5.235a10 10 0 0 1 .891-.857' />
      <path d='M8.644 21.42a10 10 0 0 0 7.631-.38' />
    </svg>
  );
});

ReviewIcon.displayName = 'ReviewIcon';

const StatusTooltip = ({
  trigger,
  title,
  description,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent
          side='bottom'
          className='bg-[#161616] border-none text-white p-5 rounded-2xl'
        >
          <div className='flex flex-col gap-2.5 max-w-[280px] text-start'>
            <p className='font-normal text-base'>{title}</p>
            <p className='font-light text-sm text-[#DFE2E0] leading-snug break-words whitespace-normal'>
              {description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ProfileName = ({
  name,
  status,
  fromSpecialPage,
  role,
  isRecentlyActive,
  partnerVerification,
}: {
  name?: string;
  status?: string;
  fromSpecialPage?: boolean;
  role?: string;
  isRecentlyActive?: boolean;
  partnerVerification?: {
    licenseNumber?: string;
    ein?: string;
    licenseFile?: string;
  };
}) => {
  // console.log('🚀 ~ ProfileName ~ isRecentlyActive:', isRecentlyActive);
  // console.log('🚀 ~ ProfileName ~ status:', status);
  return (
    <>
      {role === 'pro' && isRecentlyActive && (
        <StatusTooltip
          trigger={
            <div className='flex items-center text-xs font-medium text-[#33B55B] border-[#33B55B] border bg-[#33B55B]/5 rounded-full w-max pl-2 pr-4 h-[30px]'>
              <Dot className='stroke-[6]' /> RECENTLY ACTIVE
            </div>
          }
          title='Recently Active!'
          description='You have earned the badge. Continue being online to keep this badge on, and to encourage companies and agencies to reach out to you!'
        />
      )}
      <h1 className='text-xl sm:text-2xl font-semibold flex items-center gap-2'>
        {name || 'N/A'}
        {status === 'pending' && role === 'pro' && (
          <span className='flex items-center gap-1'>
            <BadgeCheck className='w-7 h-7 fill-[#e0e2e1] text-white' />
            <span className='text-sm text-muted-foreground font-light'>
              Pending
            </span>
          </span>
        )}
        {status === 'in-review' && role === 'partner' && (
          <span className='flex items-center gap-1 text-[#FF9500]'>
            <BadgeCheck className='w-7 h-7 fill-[#e0e2e1] text-white' />
            <ReviewIcon />
            <span className='text-sm font-light'>Pending Review</span>

            <StatusTooltip
              trigger={<QuestionMarkIcon />}
              title='Pending Review'
              description='Your verification has been submitted and is currently being reviewed by the admin. You will be notified once a decision is made.'
            />
          </span>
        )}
        {status === 'pending' && role === 'partner' && (
          <PartnerVerificationModal>
            <Button
              variant='special'
              size={'special'}
              className='flex items-center gap-1'
            >
              <BadgeCheck className='w-7 h-7 fill-[#e0e2e1] text-white' />
              <span className='text-sm text-primary font-light underline'>
                Not Verified — Verify Now
              </span>
              <StatusTooltip
                trigger={<QuestionMarkIcon />}
                title='Not Verified'
                description='Your business is not yet verified. Complete the verification to unlock all features and communicate with Pro&rsquo;s.'
              />
            </Button>
          </PartnerVerificationModal>
        )}
        {status === 'approved' && (
          <span className='flex items-center gap-1'>
            <button type='button' className='focus:outline-none focus:ring-2 focus:ring-green-400 rounded-full cursor-default' tabIndex={-1}>
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
            </button>
            <StatusTooltip
              trigger={<QuestionMarkIcon />}
              title='Verified!'
              description='Your account has been verified by the admin. You have full access to all features.'
            />
          </span>
        )}
        {status === 'rejected' && role === 'partner' && !fromSpecialPage && (
          <PartnerVerificationModal existingData={partnerVerification}>
            <Button
              variant='special'
              size={'special'}
              className='flex items-center gap-1'
            >
              <Info className='w-5 h-5 fill-[#FF5652] text-white' />
              <span className='text-sm text-red-500 font-light underline'>
                Resubmit Verification
              </span>
              <StatusTooltip
                trigger={<QuestionMarkIcon />}
                title='Rejected'
                description='Your verification was rejected. Please update and resubmit your business information.'
              />
            </Button>
          </PartnerVerificationModal>
        )}
        {status === 'rejected' && role !== 'partner' && !fromSpecialPage && (
          <StatusTooltip
            trigger={<Info className='w-5 h-5 fill-[#FF5652] text-white' />}
            title='Rejected'
            description='Your provided information is currently rejected by the admin. Please update your profile.'
          />
        )}
      </h1>
    </>
  );
};

export default ProfileName;
