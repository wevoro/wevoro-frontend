'use client';
import OfferLists from '@/components/global/dashboard/offer-lists';
import { useOffersContext } from '@/lib/contexts';

const Jobs = () => {
  const { jobOffers } = useOffersContext();

  return (
    <div>
      <OfferLists offers={jobOffers} source='jobs' />
    </div>
  );
};

export default Jobs;
