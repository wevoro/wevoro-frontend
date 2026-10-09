/**
 * SCRUM-134 (revised 2026-09-16) — clean Back-button behaviour around the
 * full-page Stripe Checkout redirect.
 *
 * The loop, as reported: agency opens a caregiver profile, starts checkout and
 * lands on checkout.stripe.com, goes back to the profile, presses Back again —
 * and is sent to the Stripe page instead of the page they came from.
 *
 * Why: Stripe's own "←" link, and its return after a payment, both navigate
 * FORWARD to our return URL. That pushes a new history entry after the Stripe
 * page, so the tab holds  [origin page] [Stripe] [profile?payment=…]. The agency
 * is looking at the profile, Back takes them to Stripe, and a cross-site entry
 * cannot be removed from history.
 *
 * The fix: remember where checkout started and how long the history was. When
 * the return URL loads and the history has grown by exactly the two expected
 * entries (Stripe + the return), step back past both to the original entry and
 * show the outcome there. The tab is then positioned before Stripe, so Back
 * continues to wherever the agency really came from. If the history does not
 * have that shape — a link opened in a new tab, a refresh, a long detour — the
 * return is handled in place as before, because stepping back blindly could
 * leave the site.
 */

const ORIGIN_KEY = 'wevoro:checkout-origin';
const RESULT_KEY = 'wevoro:checkout-result';
const HANDLED_KEY = 'wevoro:checkout-handled';
// A checkout left open longer than this is not the one returning now.
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export type CheckoutOutcome = 'success' | 'cancelled';

interface CheckoutOrigin {
  path: string;
  historyLength: number;
  /** SCRUM-161: true when a spare entry was pushed before leaving (see below). */
  padded: boolean;
  caregiverId: string;
  at: number;
}

/**
 * SCRUM-161: `history.length` counts every entry, including the forward ones
 * left behind by a Back press. After one trip to Stripe and back, a second
 * checkout from the same page was measured against a length that already
 * held the old Stripe entry, the return was counted as "one entry added", and
 * the step back was skipped — Back then led to Stripe again, and the return
 * was handled on a page that was still loading.
 *
 * Navigating forward truncates those entries. So before leaving for Stripe
 * the page pushes one spare entry for itself (same address, Next's own state
 * carried over, no navigation): the forward entries are gone, the length is
 * exact, and the step back from the return page goes one entry further to
 * land on the real one. A Back press from Stripe lands on the spare entry;
 * the page then steps back once more by itself (see packet-download-action).
 */
export const PAD_STATE_KEY = 'wevoroCheckoutPad';

const pushPadEntry = (caregiverId: string): boolean => {
  try {
    const state = window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
    window.history.pushState({ ...state, [PAD_STATE_KEY]: caregiverId }, '');
    return true;
  } catch {
    return false;
  }
};

/** Is the current entry the spare one pushed before checkout? */
export const onPadEntry = (): boolean => {
  try {
    return !!(window.history.state && window.history.state[PAD_STATE_KEY]);
  } catch {
    return false;
  }
};

export interface CheckoutResult {
  path: string;
  caregiverId: string;
  transactionId: string;
  outcome: CheckoutOutcome;
  at: number;
}

const read = <T,>(key: string): T | null => {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the return is simply handled in place */
  }
};

const remove = (key: string) => {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* nothing to clean up */
  }
};

/** Call immediately before sending the browser to Stripe. */
export function rememberCheckoutOrigin(caregiverId: string) {
  const padded = pushPadEntry(caregiverId);
  write(ORIGIN_KEY, {
    path: window.location.pathname,
    historyLength: window.history.length,
    padded,
    caregiverId,
    at: Date.now(),
  } satisfies CheckoutOrigin);
}

/**
 * SCRUM-172: is this the Stripe return page for a checkout this tab started?
 * The dashboard shows a plain "Returning…" screen instead of the profile while
 * the step back happens, so the profile is not drawn twice (once here, once
 * on the page checkout started from) — that double draw was the flicker.
 */
export function isCheckoutReturn(): boolean {
  if (!window.location.search.includes('payment=')) return false;
  const origin = read<CheckoutOrigin>(ORIGIN_KEY);
  return !!origin && Date.now() - origin.at <= MAX_AGE_MS;
}

/**
 * The outcome of a return URL is shown once. Without this the parameters had
 * to be stripped from the address bar when the gate closed — through
 * history.replaceState, which Next treats as a navigation and which cancelled
 * the profile's own data loads mid-flight (SCRUM-161: blank avatar and cover,
 * a skeleton that never resolved). The address is left alone instead, and a
 * refresh recognises a transaction it has already dealt with.
 */
export function markCheckoutHandled(transactionId: string) {
  write(HANDLED_KEY, transactionId);
}
export function wasCheckoutHandled(transactionId: string): boolean {
  return read<string>(HANDLED_KEY) === transactionId;
}

/**
 * On the Stripe return URL. Returns true when it has stepped back to the page
 * checkout started from — the caller must then do nothing further, because the
 * page is about to change and the outcome will be picked up there.
 */
export function stepBackPastCheckout(
  transactionId: string,
  outcome: CheckoutOutcome
): boolean {
  const origin = read<CheckoutOrigin>(ORIGIN_KEY);
  remove(ORIGIN_KEY);
  if (!origin || Date.now() - origin.at > MAX_AGE_MS) return false;
  // At least two entries since checkout began — Stripe, then this return page —
  // and possibly a few more if Stripe's own page added history of its own.
  // More than a handful means this is not a straight trip there and back, so
  // it is not safe to step back blindly.
  // With the spare entry in place the count is exact: Stripe's page(s) plus
  // this return page. Without it (storage or pushState unavailable) it is the
  // old estimate, which needs at least the two expected entries.
  const added = window.history.length - origin.historyLength;
  if (added < (origin.padded ? 1 : 2) || added > 6) return false;

  write(RESULT_KEY, {
    path: origin.path,
    caregiverId: origin.caregiverId,
    transactionId,
    outcome,
    at: Date.now(),
  } satisfies CheckoutResult);
  // This return page is the newest entry, so stepping back by everything added
  // since checkout began lands on the page it started from — one further when
  // that page pushed a spare entry for itself, so the spare is skipped too.
  window.history.go(-(added + (origin.padded ? 1 : 0)));
  return true;
}

/**
 * Back from Stripe by the browser's own Back button, which never loads our
 * return URL: the page is restored from the browser's page cache with the gate
 * frozen on "Taking you to secure checkout".
 *
 * The origin record is written the moment we hand the browser over and removed
 * by the return URL, so finding one here means checkout was opened and left
 * without paying. Consumed, so it answers exactly once.
 */
export function takeCheckoutOrigin(
  pathname: string,
  caregiverId?: string
): CheckoutOrigin | null {
  const origin = read<CheckoutOrigin>(ORIGIN_KEY);
  if (!origin) return null;
  // Checkout can start from the onboarding list as well as a profile. An
  // origin belonging to another page is left where it is, so that page can
  // still answer for it; it ages out on its own.
  if (origin.path !== pathname) return null;
  if (caregiverId && origin.caregiverId !== caregiverId) return null;
  remove(ORIGIN_KEY);
  if (Date.now() - origin.at > MAX_AGE_MS) return null;
  return origin;
}

/** On the page checkout started from: the outcome waiting for it, if any. */
export function takeCheckoutResult(pathname: string): CheckoutResult | null {
  // Never on the Stripe return URL itself — it is the page stepping away.
  if (window.location.search.includes('payment=')) return null;
  const result = read<CheckoutResult>(RESULT_KEY);
  if (!result) return null;
  if (Date.now() - result.at > MAX_AGE_MS) {
    remove(RESULT_KEY);
    return null;
  }
  if (result.path !== pathname) return null;
  remove(RESULT_KEY);
  return result;
}
