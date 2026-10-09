'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserContext } from '@/lib/contexts';
import { useCaregiverEngagements } from '@/app/apiHooks/useCaregiverEngagements';
import ShareProfileGate from '@/components/global/dashboard/share-profile-gate';
import { caregiverShareLink, isSharingEnabled } from '@/lib/credentialing';
import { EngagementCard, EngagementEntry } from './engagement-card';
// SCRUM-118: the approved design puts signing on the offer box, and this tab
// does not render one in credentialing mode. Reuse the SAME designed card
// rather than inventing a second surface for it.
import ReceivedCard from '@/components/global/dashboard/offers-v2/received-card';
import { useOffers } from '@/app/apiHooks/useOffers';
import OnboardingFilters, {
  OnboardingStatusFilter,
  OnboardingTimeFilter,
} from './onboarding-filters';

/** Faisal P1/P2: five cards, then "Load more". */
const PAGE_SIZE = 5;

type SubTab = 'received' | 'submitted';

/**
 * SCRUM-87 / SCRUM-141: the caregiver's Onboarding page (was "Offers").
 * Faisal's P1/P2 frames:
 *
 *  - Received: agencies that clicked Onboard and are waiting for this caregiver
 *    to Respond (sign their documents). "Continue signing" picks up a packet
 *    that was started and not finished.
 *  - Submitted: the onboardings the caregiver has signed — a receipt, no
 *    further action.
 *
 * SCRUM-140 (Faisal): the counts follow signing only. Payment never moves or
 * hides anyone. Agencies that only opened the share link, with no onboarding
 * request, are listed under Submitted as "Earlier connections" and are not
 * counted — nothing was signed for them.
 *
 * Notification CTAs deep-link here via ?tab=submitted / ?tab=received.
 */
const CaregiverOffersView: React.FC = () => {
  const { user } = useUserContext();
  const searchParams = useSearchParams();
  const { data, isLoading } = useCaregiverEngagements();
  const { data: offers = [] } = useOffers();
  // SCRUM-141: the server resolves when each offer was submitted (signed, or
  // responded with nothing to sign). Everything not yet submitted waits in
  // Received — including a packet that was started and not finished.
  const receivedOffers = useMemo(
    () =>
      (offers ?? []).filter(
        (o: any) => o?.status !== 'rejected' && !o?.submittedAt
      ),
    [offers]
  );
  const submittedOffers = useMemo(
    () =>
      (offers ?? [])
        .filter((o: any) => o?.status !== 'rejected' && !!o?.submittedAt)
        .sort(
          (a: any, b: any) => +new Date(b.submittedAt) - +new Date(a.submittedAt)
        ),
    [offers]
  );
  // Agencies with an offer are shown by that offer, not twice.
  const agenciesWithOffers = useMemo(
    () =>
      new Set(
        (offers ?? [])
          .filter((o: any) => o?.status !== 'rejected')
          .map((o: any) => String(o?.partner?._id ?? o?.partner))
      ),
    [offers]
  );

  // SCRUM-140: share-link agencies, whether or not they have downloaded — a
  // payment must not move or hide anyone.
  const shared: EngagementEntry[] = useMemo(
    () =>
      [...(data?.submitted ?? []), ...(data?.received ?? [])]
        .filter((e: any) => !agenciesWithOffers.has(String(e.agencyId)))
        .map((e: any) => ({
          partyId: e.agencyId,
          name: e.name,
          image: e.image,
          onboardedAt: e.onboardedAt,
          downloadedAt: e.downloadedAt,
        }))
        .sort(
          (a, b) => +new Date(b.onboardedAt || 0) - +new Date(a.onboardedAt || 0)
        ),
    [data, agenciesWithOffers],
  );
  const submittedCount = submittedOffers.length;

  const initialTab: SubTab =
    searchParams.get('tab') === 'submitted' ? 'submitted' : 'received';
  const [subTab, setSubTab] = useState<SubTab>(initialTab);
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'submitted' || t === 'received') setSubTab(t);
  }, [searchParams]);

  // P1/P2: search, status and time filters, and "Load more".
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<OnboardingStatusFilter>('all');
  const [time, setTime] = useState<OnboardingTimeFilter>('all');
  const [shown, setShown] = useState(PAGE_SIZE);
  useEffect(() => setShown(PAGE_SIZE), [subTab, query, status, time]);

  const matches = (o: any) => {
    const info = o?.partner?.personalInfo ?? {};
    const haystack = [
      info.firstName,
      info.lastName,
      info.companyName,
      info.address?.city,
      info.address?.state,
      o?.pro?.professionalInfo?.role,
      user?.professionalInfo?.role,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;

    const state = o?.submittedAt
      ? 'signed'
      : o?.signing && o.signing.status !== 'completed'
        ? 'in_progress'
        : 'not_started';
    if (status !== 'all' && state !== status) return false;

    if (time !== 'all') {
      const days = time === 'week' ? 7 : 31;
      const at = new Date(o?.submittedAt || o?.createdAt || 0).getTime();
      if (Date.now() - at > days * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  };
  const list = (subTab === 'received' ? receivedOffers : submittedOffers).filter(matches);
  const filtering = !!query.trim() || status !== 'all' || time !== 'all';

  const shareLink = caregiverShareLink(user);

  // Faisal P1: the active tab is bold with a mint count; the other is grey.
  const renderSubTab = (tab: SubTab, label: string, count: number) => (
    <button
      role='tab'
      aria-selected={subTab === tab}
      data-testid={`subtab-${tab}`}
      onClick={() => setSubTab(tab)}
      className={`flex items-center gap-2 pb-2 text-base md:text-lg transition-colors ${
        subTab === tab ? 'font-semibold text-[#1C1C1C]' : 'font-normal text-[#6C6C6C]'
      }`}
    >
      {label}
      <span
        className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-[18px] px-2 text-base md:text-lg font-normal ${
          subTab === tab ? 'bg-[#BBF8DC] text-[#01400F]' : 'bg-[#F9F9FA] text-[#6C6C6C]'
        }`}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div className='bg-white dark:bg-neutral-950 md:rounded-2xl p-4 md:p-8'>
      <h2 className='text-xl md:text-2xl font-semibold text-[#1C1C1C] dark:text-neutral-100 mb-6'>
        Onboarding
      </h2>

      {/* Sub-tabs */}
      <div role='tablist' className='flex items-center gap-8 mb-6'>
        {renderSubTab('received', 'Received', receivedOffers.length)}
        {renderSubTab('submitted', 'Submitted', submittedCount)}
      </div>

      <OnboardingFilters
        query={query}
        onQuery={setQuery}
        status={status}
        onStatus={setStatus}
        time={time}
        onTime={setTime}
      />

      {/* Body */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      ) : subTab === 'received' ? (
        receivedOffers.length === 0 ? (
          <div className='py-12 text-center'>
            <p className='text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto'>
              When an agency onboards you, it&apos;ll appear here for you to respond.
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {/* The Figma frame is "Offer box — Received (caregiver)": this tab
                shows offers awaiting a response and nothing else. The SCRUM-87/88
                "agency downloaded your credentials" engagement cards used to sit
                here too; they are still rendered under Submitted. */}
            {list.slice(0, shown).map((o: any) => (
              <ReceivedCard key={o._id} offer={o} />
            ))}
            {filtering && list.length === 0 && (
              <p className='py-6 text-center text-sm text-gray-500'>
                No requests match your search.
              </p>
            )}
            {list.length > shown && (
              <button
                type='button'
                onClick={() => setShown((n) => n + PAGE_SIZE)}
                className='pb-3 pt-4 text-center text-[18px] text-[#008000] hover:underline'
              >
                Load more
              </button>
            )}
          </div>
        )
      ) : submittedCount === 0 && shared.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto mb-5'>
            No agencies yet. Share your profile link to invite agencies to view
            your credentials.
          </p>
          {isSharingEnabled() && (
            // SCRUM-133: same gate as the Profile tab — locked until all 5
            // credentials are confirmed.
            <div className='flex justify-center'>
              <ShareProfileGate
                userId={user?._id}
                shareLink={shareLink}
                className='lg:items-center [&_p]:lg:text-center'
              />
            </div>
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {/* SCRUM-141: the same card, now showing "Submitted" and its time
              in place of the Respond action. */}
          {list.slice(0, shown).map((o: any) => (
            <ReceivedCard key={o._id} offer={o} />
          ))}
          {list.length > shown && (
            <button
              type='button'
              onClick={() => setShown((n) => n + PAGE_SIZE)}
              className='pb-3 pt-4 text-center text-[18px] text-[#008000] hover:underline'
            >
              Load more
            </button>
          )}
          {filtering && submittedOffers.length > 0 && list.length === 0 && (
            <p className='py-6 text-center text-sm text-gray-500'>
              Nothing matches your search.
            </p>
          )}
          {submittedOffers.length === 0 && (
            <p className='py-6 text-center text-sm text-gray-500'>
              Nothing signed yet. Onboarding requests you sign appear here.
            </p>
          )}
          {shared.length > 0 && (
            <>
              <h3 className='mt-4 text-base font-semibold text-[#1C1C1C]'>
                Earlier connections
                <span className='ml-2 text-sm font-normal text-[#6C6C6C]'>
                  Agencies that opened your profile link
                </span>
              </h3>
              {shared.map((e) => (
                <EngagementCard
                  key={e.partyId}
                  entry={e}
                  profileHref={`/caregiver/agencies/${e.partyId}`}
                  profileLabel='View Agency Profile'
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CaregiverOffersView;
