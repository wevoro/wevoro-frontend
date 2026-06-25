'use client';
import { useOffers } from '@/app/apiHooks/useOffers';
import OfferLists from '@/components/global/dashboard/offer-lists';
import MatchingShifts from '@/components/global/dashboard/matching-shifts/matching-shifts';
import { isCredentialingMode } from '@/lib/credentialing';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

const Jobs = () => {
  const { data: offers = [], isLoading } = useOffers();
  const router = useRouter();
  const credentialing = isCredentialingMode();

  // SCRUM-87: the Shift Schedule landing (SCRUM-39) and Matching Shifts
  // (SCRUM-46) are hidden in credentialing mode. The tab is removed from nav;
  // guard direct URL access by redirecting to Profile.
  useEffect(() => {
    if (credentialing) router.replace('/pro/profile');
  }, [credentialing, router]);

  // "Your Shifts" — onboarded/in-progress offers (not pending matches)
  const jobOffers = useMemo(
    () => offers?.filter((offer: any) => offer.status !== 'pending') || [],
    [offers],
  );

  if (credentialing) return null;

  return (
    <div className='flex flex-col gap-6 md:gap-8'>
      <OfferLists offers={jobOffers} source='jobs' isLoading={isLoading} />
      <MatchingShifts />
    </div>
  );
};

export default Jobs;
