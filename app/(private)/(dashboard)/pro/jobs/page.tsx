'use client';
import { useOffers } from '@/app/apiHooks/useOffers';
import OfferLists from '@/components/global/dashboard/offer-lists';
import MatchingShifts from '@/components/global/dashboard/matching-shifts/matching-shifts';
import { useMemo } from 'react';

const Jobs = () => {
  const { data: offers = [], isLoading } = useOffers();

  // "Your Shifts" — onboarded/in-progress offers (not pending matches)
  const jobOffers = useMemo(
    () => offers?.filter((offer: any) => offer.status !== 'pending') || [],
    [offers],
  );

  return (
    <div className='flex flex-col gap-6 md:gap-8'>
      <OfferLists offers={jobOffers} source='jobs' isLoading={isLoading} />
      <MatchingShifts />
    </div>
  );
};

export default Jobs;
