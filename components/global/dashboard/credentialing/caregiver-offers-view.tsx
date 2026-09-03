'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserContext } from '@/lib/contexts';
import { useCaregiverEngagements } from '@/app/apiHooks/useCaregiverEngagements';
import ShareProfileModal from '@/components/global/dashboard/share-profile-modal';
import { isSharingEnabled } from '@/lib/credentialing';
import { EngagementCard, EngagementEntry } from './engagement-card';
// SCRUM-118: the approved design puts signing on the offer box, and this tab
// does not render one in credentialing mode. Reuse the SAME designed card
// rather than inventing a second surface for it.
import ReceivedCard from '@/components/global/dashboard/offers-v2/received-card';
import { useOffers } from '@/app/apiHooks/useOffers';

type SubTab = 'received' | 'submitted';

/**
 * SCRUM-87: caregiver's credentialing-mode Offers tab.
 *
 *  - Submitted: agencies that onboarded via the caregiver's share link but have
 *    not downloaded any credential yet.
 *  - Received: agencies that have downloaded at least one credential.
 *
 * Notification CTAs deep-link here via ?tab=submitted / ?tab=received.
 */
const CaregiverOffersView: React.FC = () => {
  const { user } = useUserContext();
  const searchParams = useSearchParams();
  const { data, isLoading } = useCaregiverEngagements();
  const { data: offers = [] } = useOffers();
  // SCRUM-118: offer ids with a packet that is started but not finished. Step 1
  // marks the offer responded, so without this the card disappears the moment
  // signing begins and there is no way back in to finish it.
  const [unfinishedOfferIds, setUnfinishedOfferIds] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/esign/my-packets');
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !Array.isArray(json?.data)) return;
        setUnfinishedOfferIds(
          json.data
            .filter((p: any) => p.status !== 'completed' && p.pendingCount > 0)
            .map((p: any) => String(p.offer))
        );
      } catch {
        // Silent: the offer list must still render if this lookup fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingOffers = useMemo(
    () =>
      (offers ?? []).filter(
        (o: any) =>
          (o?.status === 'pending' && !o?.proResponded) ||
          unfinishedOfferIds.includes(String(o?._id))
      ),
    [offers, unfinishedOfferIds]
  );

  const received: EngagementEntry[] = useMemo(
    () =>
      (data?.received ?? []).map((e: any) => ({
        partyId: e.agencyId,
        name: e.name,
        image: e.image,
        onboardedAt: e.onboardedAt,
        downloadedAt: e.downloadedAt,
      })),
    [data],
  );
  const submitted: EngagementEntry[] = useMemo(
    () =>
      (data?.submitted ?? []).map((e: any) => ({
        partyId: e.agencyId,
        name: e.name,
        image: e.image,
        onboardedAt: e.onboardedAt,
        downloadedAt: e.downloadedAt,
      })),
    [data],
  );

  const initialTab: SubTab =
    searchParams.get('tab') === 'received' ? 'received' : 'submitted';
  const [subTab, setSubTab] = useState<SubTab>(initialTab);
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'submitted' || t === 'received') setSubTab(t);
  }, [searchParams]);

  const shareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/p/${user?.shareId || user?._id}`
      : `/p/${user?.shareId || user?._id}`;

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

      {/* Offers still awaiting a response, rendered with the approved offer box
          so "Documents to be signed" and the two-step accept live where Faisal
          designed them. */}
      {pendingOffers.map((o: any) => (
        <div key={o._id} className='mb-5'>
          <ReceivedCard offer={o} />
        </div>
      ))}

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
      ) : subTab === 'received' ? (
        received.length === 0 ? (
          <div className='py-12 text-center'>
            <p className='text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto'>
              When an agency downloads your credentials, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {received.map((e) => (
              <EngagementCard
                key={e.partyId}
                entry={e}
                profileHref={`/pro/partner/${e.partyId}`}
                profileLabel='View Agency Profile'
              />
            ))}
          </div>
        )
      ) : submitted.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto mb-5'>
            No agencies yet. Share your profile link to invite agencies to view
            your credentials.
          </p>
          {isSharingEnabled() && (
            <ShareProfileModal shareLink={shareLink}>
              <Button className='h-11 rounded-xl gap-2 font-semibold'>
                <Share2 className='size-4' />
                Share Profile
              </Button>
            </ShareProfileModal>
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {submitted.map((e) => (
            <EngagementCard
              key={e.partyId}
              entry={e}
              profileHref={`/pro/partner/${e.partyId}`}
              profileLabel='View Agency Profile'
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CaregiverOffersView;
