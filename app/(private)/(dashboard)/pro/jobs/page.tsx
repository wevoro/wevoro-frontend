'use client';
import { useOffers } from '@/app/apiHooks/useOffers';
import OfferLists from '@/components/global/dashboard/offer-lists';
import { useMemo } from 'react';

const Jobs = () => {
  const { data: offers = [], isLoading } = useOffers();

  const jobOffers = useMemo(
    () => offers?.filter((offer: any) => offer.status !== 'pending') || [],
    [offers]
  );
  return (
    <div>
      <OfferLists offers={jobOffers} source='jobs' isLoading={isLoading} />
    </div>
  );
};

export default Jobs;
