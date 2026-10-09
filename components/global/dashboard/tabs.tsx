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
  // SCRUM-141 (Faisal P1): "Offers" is now "Onboarding" on both sides; the
  // caregiver's tab counts the requests still waiting on a signature.
  const waitingToSign = (offers ?? []).filter(
    (o: any) => o?.status !== 'rejected' && !o?.submittedAt
  ).length;
  const tabItemsPro = credentialing
    ? [
        { label: 'Profile', href: '/caregiver/profile' },
        { label: 'Onboarding', href: '/caregiver/offers', count: waitingToSign },
      ]
    : [
        { label: 'Profile', href: '/caregiver/profile' },
        { label: `Offers (${pendingOffers?.length || 0})`, href: '/caregiver/offers' },
        { label: `Jobs (${jobOffers?.length || 0})`, href: '/caregiver/jobs' },
      ];

  // SCRUM-88: in credentialing mode the agency Offers tab replaces the
  // scheduling-era "Onboardings" submissions view (same /agency/onboardings
  // route, repurposed body + sub-tabs). The legacy "Pros" (browse caregivers)
  // tab belongs to the scheduling era and is removed from agency nav — the
  // credentialing agency journey is Profile -> Offers only (client request).
  // SCRUM-117: agencies manage the CNA/PCA documents caregivers sign on
  // connection from their own tab, so it sits next to Profile in both modes.
  const tabItemsPartner = credentialing
    ? [
        { label: 'Profile', href: '/agency/profile' },
        { label: 'Documents', href: '/agency/documents' },
        { label: 'Onboarding', href: '/agency/onboardings' },
      ]
    : [
        { label: 'Profile', href: '/agency/profile' },
        { label: 'Documents', href: '/agency/documents' },
        { label: 'Caregivers', href: '/agency/caregivers' },
        {
          label: `Onboardings (${offers?.length || 0})`,
          href: '/agency/onboardings',
        },
      ];
  const tabItems: { label: string; href: string; count?: number }[] =
    user?.role === 'pro' ? tabItemsPro : tabItemsPartner;
  return (
    <div className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
      <div className='flex items-center gap-8'>
        {tabItems.map((item, index) => (
          <Link key={index} href={item.href}>
            <span
              className={`inline-flex items-center gap-2 text-base md:text-xl ${
                pathname === item.href
                  ? 'text-tertiary font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              {item.label}
              {!!item.count && (
                <span className='inline-flex h-7 min-w-[28px] items-center justify-center rounded-[18px] bg-[#BBF8DC] px-2 text-base font-normal text-[#01400F] md:text-xl'>
                  {item.count}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
