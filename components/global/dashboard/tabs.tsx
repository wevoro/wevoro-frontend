'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserContext } from '@/lib/contexts';
import { useOffers } from '@/app/apiHooks/useOffers';

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
    { label: 'Profile', href: '/partner/profile' },
    { label: 'Pros', href: '/partner/pros' },
    {
      label: `Onboardings (${offers?.length || 0})`,
      href: '/partner/onboardings',
    },
  ];
  const tabItems = user?.role === 'pro' ? tabItemsPro : tabItemsPartner;
  return (
    <div className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
      <div className='flex items-center gap-8'>
        {tabItems.map((item, index) => (
          <Link key={index} href={item.href}>
            <span
              className={`text-base md:text-xl ${
                pathname === item.href
                  ? 'text-tertiary font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
