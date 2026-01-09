'use client';

import { useAuthStatusContext } from '@/lib/contexts';
import { useEffect, useRef, useCallback } from 'react';

const REFRESH_BUFFER_MS = 1 * 30 * 1000; // Refresh 1 minute before expiry

const RefreshToken = () => {
  const { isAuthenticated, expiresAt, setIsRefreshed } = useAuthStatusContext();
  // console.log('🚀 ~ RefreshToken ~ isAuthenticated:', isAuthenticated);
  const isRefreshingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug log on every render
  console.log(
    '[RefreshToken] Render - isAuthenticated:',
    isAuthenticated,
    'expiresAt:',
    expiresAt
  );

  const refreshTokens = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    console.log('[RefreshToken] Refreshing tokens...');

    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.status === 200) {
        console.log('[RefreshToken] Tokens refreshed successfully');
        setIsRefreshed(true);
      } else {
        console.error('[RefreshToken] Token refresh failed:', data.message);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[RefreshToken] Error refreshing token:', error);
      window.location.href = '/';
    } finally {
      isRefreshingRef.current = false;
    }
  }, [setIsRefreshed]);

  useEffect(() => {
    // console.log(
    //   '[RefreshToken] useEffect triggered - isAuthenticated:',
    //   isAuthenticated,
    //   'expiresAt:',
    //   expiresAt
    // );

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Don't set up refresh if not authenticated or no expiry info
    if (!isAuthenticated || !expiresAt) {
      console.log(
        '[RefreshToken] Skipping - not authenticated or no expiresAt'
      );
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const timeUntilRefresh = timeUntilExpiry - REFRESH_BUFFER_MS;

    console.log(
      '[RefreshToken] Time until expiry:',
      Math.round(timeUntilExpiry / 1000),
      'seconds'
    );
    console.log(
      '[RefreshToken] Time until refresh:',
      Math.round(timeUntilRefresh / 1000),
      'seconds'
    );

    if (timeUntilRefresh <= 0) {
      console.log(
        '[RefreshToken] Token expired or expiring soon, refreshing immediately'
      );
      refreshTokens();
    } else {
      console.log(
        `[RefreshToken] Refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`
      );
      timeoutRef.current = setTimeout(refreshTokens, timeUntilRefresh);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, expiresAt, refreshTokens]);

  return null;
};

export default RefreshToken;
