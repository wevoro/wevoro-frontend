'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserContext } from '@/lib/contexts';
import { useOffers } from '@/app/apiHooks/useOffers';
import { CircleHelp } from 'lucide-react';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

const Tabs: React.FC = () => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const { data: offers } = useOffers();

  const pendingOffers = offers?.filter(
    (offer: any) => offer.status === 'pending',
  );

  const jobOffers = offers?.filter((offer: any) => offer.status !== 'pending');

  const tabItemsPro = [
    { label: 'Profile', href: '/pro/profile' },
    { label: `Offers (${pendingOffers?.length || 0})`, href: '/pro/offers' },
    { label: `Jobs (${jobOffers?.length || 0})`, href: '/pro/jobs' },
  ];

  const tabItemsPartner = [
    { label: 'Shift Schedule', href: '/partner/shift-schedule' },
    {
      label: 'Offers',
      href: '/partner/onboardings',
      badge: offers?.length || 0,
    },
    { label: 'Profile', href: '/partner/profile' },
  ];

  const tabItems = user?.role === 'pro' ? tabItemsPro : tabItemsPartner;
  const isPartner = user?.role === 'partner';

  // Plan data - using offers count for onboards tracking
  const totalOnboards = 3;
  const usedOnboards = offers?.length || 0;
  const remainingOnboards = Math.max(0, totalOnboards - usedOnboards);

  return (
    <div className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-6 md:gap-8'>
          {tabItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <span
                className={`text-base md:text-xl flex items-center gap-2 ${
                  pathname === item.href
                    ? 'text-tertiary font-semibold'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
                {'badge' in item && (item as any).badge > 0 && (
                  <span className='inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-[#33B55B] text-white text-xs font-semibold'>
                    {(item as any).badge}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>

        {isPartner && (
          <div className='hidden sm:flex flex-col items-end gap-0.5'>
            <div className='flex items-center gap-1.5'>
              <span className='text-sm text-muted-foreground'>
                Current Plan
              </span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type='button' className='focus:outline-none'>
                      <CircleHelp className='size-4 text-muted-foreground' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side='bottom'
                    className='bg-[#161616] border-none text-white p-4 rounded-2xl max-w-[260px]'
                  >
                    <p className='text-sm font-light leading-snug'>
                      Your current subscription plan and the number of onboards
                      remaining in your plan.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className='text-sm font-medium text-tertiary'>
              Basic Plan{' '}
              <span className='text-[#33B55B] font-semibold'>
                ({remainingOnboards}/{totalOnboards}) Onboards Remaining
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;
