// SCRUM-87: caregiver credentialing-mode Offers tab data
import { useQuery } from '@tanstack/react-query';
import { getCaregiverEngagements } from '../actions';

/**
 * Agencies connected to this caregiver through their share link ("Earlier
 * connections" on the Onboarding tab).
 *
 * SCRUM-171 follow-up (Alfonza, 1 Oct): same treatment as useOffers — no
 * minute-long cache, refetch on focus, poll every 30 s — so an agency that just
 * opened the caregiver's link appears without a reload.
 */
export function useCaregiverEngagements() {
  return useQuery({
    queryKey: ['caregiver-engagements'],
    queryFn: () => getCaregiverEngagements(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}
