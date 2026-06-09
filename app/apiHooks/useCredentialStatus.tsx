'use client';

import { useQuery } from '@tanstack/react-query';
import { getCredentialStatus } from '@/app/actions';

export function useCredentialStatus(userId?: string) {
  return useQuery({
    queryKey: ['credentialStatus', userId],
    queryFn: () => getCredentialStatus(userId!),
    enabled: !!userId,
  });
}
