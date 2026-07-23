import posthog from 'posthog-js';

/**
 * PostHog instrumentation — the four events the client asked for.
 *
 * Scope is deliberately narrow: autocapture, session recording and automatic
 * pageviews are all OFF. This is health-adjacent data and URLs carry caregiver
 * ids (e.g. /partner/pros/<caregiverId>), so nothing is sent that we did not
 * explicitly choose to send. Pageviews can be added later, but only behind a
 * path-sanitising helper that strips ids.
 *
 * Reads NEXT_PUBLIC_POSTHOG_KEY, which Next inlines at BUILD time. If the key
 * is absent every function here is a no-op, so local dev and QA stay silent and
 * a forgotten Vercel env var degrades to "no data" rather than a runtime error.
 */

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

/** The four events. Use these constants — never a raw string at a call site. */
export const EVENTS = {
  PROFILE_COMPLETED: 'profile_completed',
  SHARE_LINK_GENERATED: 'share_link_generated',
  AGENCY_ACCOUNT_CREATED: 'agency_account_created',
  CREDENTIAL_PACK_VIEWED: 'credential_pack_viewed',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type PostHogClient = typeof posthog;

declare global {
  // eslint-disable-next-line no-var
  var __wevoroAnalytics: PostHogClient | undefined;
}

/**
 * The initialised client lives on `window`, NOT in a module-level variable.
 *
 * webpack duplicates this module into more than one chunk (the root provider
 * chunk and the dashboard chunk), which means a module-scoped `initialised`
 * flag is false in the second copy — every track() call from a component in
 * that chunk would silently return and no event would ever be sent. Verified
 * in a real browser: identify() worked while share_link_generated never left
 * the page. Keying off window makes every copy share one client.
 */
function client(): PostHogClient | null {
  if (typeof window === 'undefined') return null;
  return window.__wevoroAnalytics ?? null;
}

export const isAnalyticsEnabled = (): boolean =>
  typeof window !== 'undefined' && !!POSTHOG_KEY;

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || window.__wevoroAnalytics) return;

  posthog.init(POSTHOG_KEY as string, {
    api_host: POSTHOG_HOST,
    // Only create person records for users we explicitly identify. Anonymous
    // visitors on the marketing pages do not need a profile.
    person_profiles: 'identified_only',
    // Everything below is off on purpose — see the file header.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    respect_dnt: true,
  });

  window.__wevoroAnalytics = posthog;
}

/**
 * Send an event. Silently does nothing when analytics is off, so call sites
 * never need their own guard and a tracking failure can never break a user flow.
 */
export function track(
  event: EventName,
  properties?: Record<string, unknown>
): void {
  const ph = client();
  if (!ph) return;
  try {
    ph.capture(event, properties);
  } catch {
    // Analytics must never surface an error to the user.
  }
}

/**
 * Tie subsequent events to a user. Keyed on the Mongo _id, not the email —
 * emails change and are PII we would rather not use as a primary key.
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  const ph = client();
  if (!ph || !userId) return;
  try {
    ph.identify(userId, properties);
  } catch {
    /* no-op */
  }
}

/** Call on logout so the next user on this device is not merged into the last. */
export function resetAnalytics(): void {
  const ph = client();
  if (!ph) return;
  try {
    ph.reset();
  } catch {
    /* no-op */
  }
}

/**
 * Fire an event at most once per user per device.
 *
 * Needed for profile_completed: completion is derived on every read
 * (calculateProCompletion.ts) and never persisted, so there is no server-side
 * state transition to hook. Without a guard the event would re-fire on every
 * page load once a caregiver reaches 100%.
 *
 * Known limitation, worth stating to the client: this only fires while the
 * caregiver has the app open. The final step to 100% is an ADMIN approving the
 * last credential, which can happen days later when the caregiver is offline —
 * they are then counted on their next visit, not at the moment of completion.
 * A server-side `profileCompletedAt` field would remove that caveat.
 */
export function trackOnce(
  event: EventName,
  dedupeKey: string,
  properties?: Record<string, unknown>
): void {
  if (!client()) return;
  const storageKey = `wevoro:analytics:${event}:${dedupeKey}`;
  try {
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, '1');
  } catch {
    // Private mode / storage disabled — fall through and send. A duplicate is
    // a better failure than a missing event.
  }
  track(event, properties);
}
