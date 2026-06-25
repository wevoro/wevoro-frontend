// SCRUM-88: agency credentialing-mode Offers tab data
import { useQuery } from '@tanstack/react-query';
import { getAgencyEngagements } from '../actions';

export function useAgencyEngagements() {
  return useQuery({
    queryKey: ['agency-engagements'],
    queryFn: () => getAgencyEngagements(),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
}
