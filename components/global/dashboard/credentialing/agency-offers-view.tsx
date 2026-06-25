'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAgencyEngagements } from '@/app/apiHooks/useAgencyEngagements';
import DownloadPackageButton from '@/components/global/dashboard/download-package-button';
import { EngagementCard, EngagementEntry } from './engagement-card';

type SubTab = 'submitted' | 'received';

/**
 * SCRUM-88: agency's credentialing-mode Offers tab — the symmetric mirror of the
 * caregiver view.
 *
 *  - Submitted: caregivers whose share link the agency onboarded via, but whose
 *    credentials the agency has not downloaded yet. Carries a "Download
 *    Credential Package" CTA that drives the transition to Received (SCRUM-67).
 *  - Received: caregivers whose credentials the agency has downloaded.
 */
const AgencyOffersView: React.FC = () => {
  const searchParams = useSearchParams();
  const { data, isLoading, refetch } = useAgencyEngagements();

  const toEntry = (e: any): EngagementEntry => ({
    partyId: e.caregiverId,
    name: e.name,
    image: e.image,
    role: e.role,
    onboardedAt: e.onboardedAt,
    downloadedAt: e.downloadedAt,
  });

  const submitted: EngagementEntry[] = useMemo(
    () => (data?.submitted ?? []).map(toEntry),
    [data],
  );
  const received: EngagementEntry[] = useMemo(
    () => (data?.received ?? []).map(toEntry),
    [data],
  );

  const initialTab: SubTab =
    searchParams.get('tab') === 'received' ? 'received' : 'submitted';
  const [subTab, setSubTab] = useState<SubTab>(initialTab);
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'submitted' || t === 'received') setSubTab(t);
  }, [searchParams]);

  const renderSubTab = (tab: SubTab, label: string, count: number) => (
    <button
      onClick={() => setSubTab(tab)}
      className={`pb-3 flex items-center gap-2 text-base font-semibold transition-colors ${
        subTab === tab
          ? 'text-gray-900 dark:text-neutral-100 border-b-2 border-primary -mb-px'
          : 'text-gray-500 dark:text-neutral-400'
      }`}
    >
      {label}
      <span
        className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-semibold ${
          subTab === tab
            ? 'bg-primary text-white'
            : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300'
        }`}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div className='bg-white dark:bg-neutral-950 md:rounded-2xl p-4 md:p-8'>
      <h2 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-6'>
        Offers
      </h2>

      {/* Sub-tabs */}
      <div className='flex items-center gap-8 border-b border-gray-100 dark:border-neutral-800 mb-6'>
        {renderSubTab('submitted', 'Submitted', submitted.length)}
        {renderSubTab('received', 'Received', received.length)}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      ) : subTab === 'submitted' ? (
        submitted.length === 0 ? (
          <div className='py-12 text-center'>
            <p className='text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto'>
              No caregivers yet. Caregivers will appear here when they share their
              profile with you.
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {submitted.map((e) => (
              <EngagementCard
                key={e.partyId}
                entry={e}
                profileHref={`/partner/pros/${e.partyId}`}
                profileLabel='View Caregiver Profile'
                extraAction={
                  <DownloadPackageButton
                    caregiverId={e.partyId}
                    caregiverName={e.name}
                    onDownloaded={() => refetch()}
                    className='h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-sm font-semibold'
                  />
                }
              />
            ))}
          </div>
        )
      ) : received.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto'>
            Caregivers whose credentials you&apos;ve downloaded will appear here.
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {received.map((e) => (
            <EngagementCard
              key={e.partyId}
              entry={e}
              profileHref={`/partner/pros/${e.partyId}`}
              profileLabel='View Caregiver Profile'
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AgencyOffersView;
