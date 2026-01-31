'use client';
import { useOffers } from '@/app/apiHooks/useOffers';
import OfferLists from '@/components/global/dashboard/offer-lists';

import { useMemo } from 'react';

export default function Offers() {
  const { data: offers = [], isLoading, refetch } = useOffers();
  const pendingOffers = useMemo(
    () => offers?.filter((offer: any) => offer.status === 'pending') || [],
    [offers]
  );

  return (
    <div>
      <OfferLists offers={pendingOffers} source='offers' />
    </div>
  );
}
