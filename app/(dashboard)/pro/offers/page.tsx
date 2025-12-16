'use client';
import OfferLists from '@/components/global/dashboard/offer-lists';

import { useOffersContext } from '@/lib/contexts';

export default function Offers() {
  const { pendingOffers } = useOffersContext();
  return (
    <div>
      <OfferLists offers={pendingOffers} source='offers' />
    </div>
  );
}
