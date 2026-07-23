'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Toaster as Toaster2 } from '@/components/ui/toaster';
import { useState } from 'react';
import {
  AdminProvider,
  AuthProvider,
  CookiesProvider,
  OnboardProvider,
  UIProvider,
  UserProvider,
} from './contexts';
import AnalyticsProvider from './analytics-provider';

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
        {/* Inside UserProvider: AnalyticsProvider reads useUserContext(). */}
        <AnalyticsProvider />
        <AdminProvider>
          <AuthProvider>
            <UIProvider>
              <OnboardProvider>
                <CookiesProvider>
                  {children}
                  <Toaster
                    position='top-center'
                    toastOptions={{
                      style: {
                        zIndex: 9999,
                        marginTop: '70px',
                      },
                      className: 'sonner-toast',
                    }}
                    richColors
                    closeButton
                  />
                  <Toaster2 />
                </CookiesProvider>
              </OnboardProvider>
            </UIProvider>
          </AuthProvider>
        </AdminProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
