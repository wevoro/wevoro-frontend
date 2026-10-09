// hooks/useOffers.ts
import { useQuery } from '@tanstack/react-query';
import { getOffers } from '../actions';

/**
 * Every onboarding request the signed-in user is party to. Feeds the
 * caregiver's Onboarding tab (Received / Submitted) and the badge on the tab
 * itself.
 *
 * SCRUM-171 follow-up (Alfonza, 1 Oct): this was cached for a minute with no
 * refetch on focus, so a caregiver sitting on the Onboarding tab while an
 * agency sent them a request saw "Received 0" until they reloaded. It now
 * refetches when the window regains focus and polls every 30 s while any
 * screen that reads it is open — the request from the other side shows up on
 * its own.
 */
export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: () => getOffers(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}
