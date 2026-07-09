'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserContext } from '@/lib/contexts';
import { useOffers } from '@/app/apiHooks/useOffers';
import { isCredentialingMode } from '@/lib/credentialing';

const Tabs: React.FC = () => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const { data: offers } = useOffers();
  const credentialing = isCredentialingMode();

  const pendingOffers = offers?.filter(
    (offer: any) => offer.status === 'pending',
  );

  const jobOffers = offers?.filter((offer: any) => offer.status !== 'pending');

  // SCRUM-87: in credentialing mode the Shift Schedule (Jobs) tab is hidden and
  // tab order is Profile -> Offers (client request). Otherwise scheduling-era tabs stand.
  const tabItemsPro = credentialing
    ? [
        { label: 'Profile', href: '/pro/profile' },
        { label: 'Offers', href: '/pro/offers' },
      ]
    : [
        { label: 'Profile', href: '/pro/profile' },
        { label: `Offers (${pendingOffers?.length || 0})`, href: '/pro/offers' },
        { label: `Jobs (${jobOffers?.length || 0})`, href: '/pro/jobs' },
      ];

  // SCRUM-88: in credentialing mode the agency Offers tab replaces the
  // scheduling-era "Onboardings" submissions view (same /partner/onboardings
  // route, repurposed body + sub-tabs). The legacy "Pros" (browse caregivers)
  // tab belongs to the scheduling era and is removed from agency nav — the
  // credentialing agency journey is Profile -> Offers only (client request).
  const tabItemsPartner = credentialing
    ? [
        { label: 'Profile', href: '/partner/profile' },
        { label: 'Offers', href: '/partner/onboardings' },
      ]
    : [
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
