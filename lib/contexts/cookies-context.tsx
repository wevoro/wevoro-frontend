'use client';

import { getAuthStatus } from '@/app/actions';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useQuery } from '@tanstack/react-query';

interface AuthStatusContextValue {
  isAuthenticated: boolean;
  expiresAt: number | null;
  isRefreshed: boolean;
  setIsRefreshed: React.Dispatch<React.SetStateAction<boolean>>;
  refetchAuthStatus: () => void;
}

const AuthStatusContext = createContext<AuthStatusContextValue | null>(null);

export function useAuthStatusContext() {
  const context = useContext(AuthStatusContext);
  if (!context) {
    throw new Error(
      'useAuthStatusContext must be used within an AuthStatusProvider'
    );
  }
  return context;
}

// Keep the old name as an alias for backward compatibility
export const useCookiesContext = useAuthStatusContext;

interface AuthStatusProviderProps {
  children: ReactNode;
}

export function AuthStatusProvider({ children }: AuthStatusProviderProps) {
  const [isRefreshed, setIsRefreshed] = useState(false);

  // Use React Query for automatic request deduplication
  const {
    data: authStatus = { isAuthenticated: false, expiresAt: null },
    refetch: refetchAuthStatus,
  } = useQuery({
    queryKey: ['authStatus'],
    queryFn: async () => await getAuthStatus(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider auth status fresh for 5 minutes
  });
  console.log('🚀 ~ AuthStatusProvider ~ authStatus:', authStatus);

  // Trigger refetch when isRefreshed becomes true
  useEffect(() => {
    if (isRefreshed) {
      refetchAuthStatus();
      setIsRefreshed(false);
    }
  }, [isRefreshed, refetchAuthStatus]);

  const value = useMemo<AuthStatusContextValue>(
    () => ({
      isAuthenticated: authStatus.isAuthenticated,
      expiresAt: authStatus.expiresAt,
      isRefreshed,
      setIsRefreshed,
      refetchAuthStatus,
    }),
    [authStatus, isRefreshed, refetchAuthStatus]
  );

  return (
    <AuthStatusContext.Provider value={value}>
      {children}
    </AuthStatusContext.Provider>
  );
}

// Keep the old name as an alias for backward compatibility
export const CookiesProvider = AuthStatusProvider;

export default AuthStatusProvider;
