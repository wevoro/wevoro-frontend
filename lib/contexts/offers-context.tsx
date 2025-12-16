'use client';

import { getOffers } from '@/app/actions';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserContext } from './user-context';

interface Offer {
  _id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  [key: string]: any;
}

interface OffersContextValue {
  offers: Offer[];
  pendingOffers: Offer[];
  jobOffers: Offer[];
  isOffersLoading: boolean;
  refetchOffers: () => void;
}

const OffersContext = createContext<OffersContextValue | null>(null);

export function useOffersContext() {
  const context = useContext(OffersContext);
  if (!context) {
    throw new Error('useOffersContext must be used within an OffersProvider');
  }
  return context;
}

interface OffersProviderProps {
  children: ReactNode;
}

export function OffersProvider({ children }: OffersProviderProps) {
  const { user } = useUserContext();

  const {
    refetch: refetchOffers,
    data: offers = [],
    isLoading: isOffersLoading,
  } = useQuery({
    queryKey: ['offers', user?._id],
    queryFn: async () => await getOffers(),
    enabled: !!user?._id, // Only fetch when user is available
    refetchOnWindowFocus: false,
    // refetchOnMount: false, // Prevent duplicate fetches on Strict Mode
    staleTime: 60 * 1000, // Consider offers fresh for 1 minute
  });

  const pendingOffers = useMemo(
    () => offers?.filter((offer: Offer) => offer.status === 'pending') || [],
    [offers]
  );

  const jobOffers = useMemo(
    () => offers?.filter((offer: Offer) => offer.status !== 'pending') || [],
    [offers]
  );

  const value = useMemo<OffersContextValue>(
    () => ({
      offers: offers || [],
      pendingOffers,
      jobOffers,
      isOffersLoading,
      refetchOffers,
    }),
    [offers, pendingOffers, jobOffers, isOffersLoading, refetchOffers]
  );

  return (
    <OffersContext.Provider value={value}>{children}</OffersContext.Provider>
  );
}

export default OffersProvider;
