// SCRUM-87: caregiver credentialing-mode Offers tab data
import { useQuery } from '@tanstack/react-query';
import { getCaregiverEngagements } from '../actions';

export function useCaregiverEngagements() {
  return useQuery({
    queryKey: ['caregiver-engagements'],
    queryFn: () => getCaregiverEngagements(),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
}
