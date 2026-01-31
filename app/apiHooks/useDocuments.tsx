import { useQuery } from '@tanstack/react-query';
import { getUserDocuments } from '../actions';

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => getUserDocuments(),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
}
