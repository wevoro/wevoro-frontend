import { Button } from '@/components/ui/button';
import { TooltipContent } from '@/components/ui/tooltip';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BadgeCheck, Dot, Info, Zap } from 'lucide-react';
import React from 'react';
import Link from 'next/link';
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
  isRising,
  partnerVerification,
  href,
}: {
  name?: string;
  status?: string;
  fromSpecialPage?: boolean;
  role?: string;
  isRecentlyActive?: boolean;
  isRising?: boolean;
  /**
   * SCRUM-158: where clicking the name goes. Settings and Notifications swap
   * out the layout that carries the Profile tabs, and the logo goes to the
   * public home page, so from those screens there was no way back to the
   * profile. The account sidebar passes the profile path; the profile header
   * itself passes nothing and the name stays plain text.
   */
  href?: string;
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
      {role === 'pro' && (isRising || isRecentlyActive) && (
        <div className='flex items-center gap-2.5 flex-wrap'>
          {isRising && (
            <StatusTooltip
              trigger={
                <div className='flex items-center gap-1 text-xs font-medium text-white bg-[#008000] rounded-full w-max px-3 h-[30px]'>
                  <Zap className='w-3.5 h-3.5 fill-white' /> RISING (NEW)
                </div>
              }
              title='Rising (New)'
              description='You are new to Wevoro and currently highlighted to agencies. Complete your profile to keep the momentum going!'
            />
          )}
          {isRecentlyActive && (
            <StatusTooltip
              trigger={
                <div className='flex items-center text-xs font-medium text-[#33B55B] border-[#33B55B] border bg-[#EAF7EE] rounded-full w-max pl-2 pr-4 h-[30px]'>
                  <Dot className='stroke-[6]' /> RECENTLY ACTIVE
                </div>
              }
              title='Recently Active!'
              description='You have earned the badge. Continue being online to keep this badge on, and to encourage companies and agencies to reach out to you!'
            />
          )}
        </div>
      )}
      <h1 className='text-xl sm:text-2xl font-semibold flex items-center gap-2'>
        {href ? (
          <Link
            href={href}
            title='Click to return to your profile'
            className='hover:underline underline-offset-4'
            data-testid='profile-name-link'
          >
            {name || 'N/A'}
          </Link>
        ) : (
          name || 'N/A'
        )}
        {status === 'pending' && role === 'pro' && (
          <span className='flex items-center gap-1'>
            <BadgeCheck className='w-7 h-7 fill-[#e0e2e1] text-white' />
            <span className='text-sm text-muted-foreground font-light'>
              Pending
            </span>
          </span>
        )}
        {status === 'in-review' && role === 'pro' && (
          <span className='flex items-center gap-1 text-[#FF9500]'>
            <BadgeCheck className='w-7 h-7 fill-[#e0e2e1] text-white' />
            <ReviewIcon />
            <span className='text-sm font-light'>In Review</span>

            <StatusTooltip
              trigger={<QuestionMarkIcon />}
              title='In Review'
              description='Your profile has been submitted and is currently being reviewed by the admin. You will be notified once a decision is made.'
            />
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
                description='Your business is not yet verified. Complete the verification to unlock all features and communicate with caregivers.'
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
            {/* SCRUM-133 (Faisal, Unlocked): the chip reads "Verified" in
                words, as Pending and In Review show theirs. It used to be the
                tick alone, with the word only in the hover tooltip. */}
            <span className='text-sm font-light text-[#008000]'>Verified</span>
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
