'use client';

import { useEffect, useRef } from 'react';
import { useUserContext } from './contexts';
import { EVENTS, identifyUser, initAnalytics, trackOnce } from './analytics';

/**
 * Boots PostHog and keeps the identified user in sync.
 *
 * MUST be rendered inside UserProvider — it reads useUserContext(). Placing it
 * as a sibling would throw, and placing it above would mean events are never
 * attributed to a user.
 *
 * Also owns the profile_completed event, because this is the only place that
 * observes completionPercentage on every render. See trackOnce() in
 * ./analytics for why a client-side dedupe guard is required here.
 *
 * Renders nothing — it is mounted for its effects only.
 */
export default function AnalyticsProvider() {
  const { user } = useUserContext();
  const identifiedId = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    // identify() is idempotent but issues a network call, so only re-run it
    // when the user actually changes rather than on every profile refetch.
    if (identifiedId.current !== user._id) {
      identifyUser(user._id, { role: user.role, status: user.status });
      identifiedId.current = user._id;
    }

    if ((user.completionPercentage ?? 0) >= 100) {
      trackOnce(EVENTS.PROFILE_COMPLETED, user._id, { role: user.role });
    }
  }, [user?._id, user?.role, user?.status, user?.completionPercentage]);

  return null;
}
