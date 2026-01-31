'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Toaster as Toaster2 } from '@/components/ui/toaster';
import { useState } from 'react';
import FloatingFeedback from '@/components/global/feedback/floating-feedback';
import {
  AdminProvider,
  AuthProvider,
  CookiesProvider,
  OnboardProvider,
  UIProvider,
  UserProvider,
} from './contexts';

// export const queryClient = new QueryClient();
export default function Provider({ children }: any) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <AdminProvider>
          <AuthProvider>
            <UIProvider>
              <OnboardProvider>
                <CookiesProvider>
                  {children}
                  <Toaster />
                  <Toaster2 />
                  <FloatingFeedback />
                </CookiesProvider>
              </OnboardProvider>
            </UIProvider>
          </AuthProvider>
        </AdminProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
