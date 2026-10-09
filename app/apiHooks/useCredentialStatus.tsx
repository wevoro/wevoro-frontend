'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * The caregiver's five credentials, driving the credential cards, the floating
 * box and the share gate.
 *
 * It reads the route handler rather than the `getCredentialStatus` server
 * action on purpose. Server actions are queued one at a time per client and the
 * one in flight is dropped on navigation, so an upload could invalidate this
 * query and still leave the share box reading "0 of 5 verified" for around
 * twenty seconds. `staleTime: 0` plus a refetch on focus means a credential
 * confirmed in another tab shows up as soon as the caregiver comes back.
 */
export function useCredentialStatus(userId?: string) {
  return useQuery({
    queryKey: ['credentialStatus', userId],
    queryFn: async () => {
      const res = await fetch(
        `/api/credentialing/credential-status?userId=${encodeURIComponent(userId!)}`,
        { cache: 'no-store' }
      );
      const json = await res.json().catch(() => null);
      return json?.data ?? null;
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
