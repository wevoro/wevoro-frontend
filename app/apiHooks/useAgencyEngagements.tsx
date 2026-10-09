// SCRUM-88: agency credentialing-mode Offers tab data
import { useQuery } from '@tanstack/react-query';

/** Rows still moving: a request sent, or a caregiver mid-signature. */
const hasOpenRows = (data: any): boolean => {
  const rows: any[] = [...(data?.received ?? []), ...(data?.submitted ?? [])];
  return rows.some((e) => {
    const state = e?.onboard?.state;
    return state === 'awaiting' || state === 'signing';
  });
};

export function useAgencyEngagements() {
  return useQuery({
    queryKey: ['agency-engagements'],
    // A plain GET route, not a server action — see the route's comment.
    queryFn: async () => {
      const res = await fetch('/api/credentialing/agency-engagements', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      return json?.data ?? null;
    },
    // SCRUM-171: this list was fetched once and then served from cache for a
    // minute, with no refetch on focus and no polling — so "Awaiting signature"
    // sat at 0 while a caregiver signed in another window, and jumped straight
    // to Completed on the next full reload. It now refetches when the tab
    // comes back into focus and polls: every 20 s while a row is waiting on a
    // signature, every 30 s otherwise — a caregiver opening the agency's link
    // ("Not onboarded yet") should appear without a reload too (Alfonza, 1 Oct).
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (hasOpenRows(query.state.data) ? 20_000 : 30_000),
  });
}
