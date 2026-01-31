import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../actions';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
}
