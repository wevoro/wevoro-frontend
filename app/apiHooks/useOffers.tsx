// hooks/useOffers.ts
import { useQuery } from '@tanstack/react-query';
import { getOffers } from '../actions';

export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: () => getOffers(),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
}
