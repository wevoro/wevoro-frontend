'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOffersContext, useUserContext } from '@/lib/contexts';

const Tabs: React.FC = () => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const { offers, pendingOffers, jobOffers } = useOffersContext();

  const tabItemsPro = [
    { label: 'Profile', href: '/pro/profile' },
    { label: `Offers (${pendingOffers?.length || 0})`, href: '/pro/offers' },
    { label: `Jobs (${jobOffers?.length || 0})`, href: '/pro/jobs' },
  ];

  const tabItemsPartner = [
    { label: 'Profile', href: '/partner/profile' },
    { label: 'Pros', href: '/partner/pros' },
    { label: `Hires (${offers?.length || 0})`, href: '/partner/hires' },
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
                  ? 'text-[#1C1C1C] font-semibold'
                  : 'text-[#6C6C6C]'
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
