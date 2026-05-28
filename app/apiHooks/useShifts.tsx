import { useQuery } from '@tanstack/react-query';
import { getShifts } from '../actions';

export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: () => getShifts(),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
}
