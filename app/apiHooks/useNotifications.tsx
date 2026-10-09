import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../actions';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    // SCRUM-167: there is no socket or push. This list was cached for a minute
    // with no refetch on focus, and its readers (the bell, the dropdown) stay
    // mounted across pages, so a new notification showed up only after a full
    // reload — "about a minute late" at best, never if the user stayed put.
    // It now polls every 30 seconds and refetches when the tab regains focus;
    // the dropdown refetches again the moment it opens.
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}
