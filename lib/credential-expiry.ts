/**
 * SCRUM-136 — one expiry calculation, one clock, one set of colours, for every
 * surface that tells a caregiver, agency or admin how close a credential is to
 * expiring.
 *
 * Before this file there were three answers to the same question:
 *
 *  - The credential card worked the expiry out twice — once for the countdown,
 *    once inside the urgency pill — and each read "now" on its own and was
 *    cached on a different trigger. Faisal's AC1 ("the pill and the countdown
 *    cannot disagree") held only by luck: near a band boundary a page left open
 *    could show a red pill beside a yellow countdown.
 *  - Nothing ticked, so the hours and minutes shown inside the last three days
 *    were frozen at whatever they were when the page loaded.
 *  - The caregiver's Credentials side panel did its own maths: a 30-day cut-off,
 *    no yellow band, its own red (#EC685C, 3.13:1, fails contrast), and it
 *    rounded UP where the card rounds DOWN — one credential read "3 days" in
 *    the panel and "02 days" on the card at the same moment.
 *
 * Now every surface asks `getCredentialExpiry(date, now)` once per credential,
 * with `now` from `useExpiryClock`, and paints the answer with the same pairs.
 */

import { useEffect, useState } from 'react';
import { CalendarX2, CircleDashed, CircleX, type LucideIcon } from 'lucide-react';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/*
 * SCRUM-169 — when a credential expires.
 *
 * An expiration date is a calendar day on a certificate. The admin enters
 * "2026-09-23" and it is stored as 2026-09-23T00:00:00Z. The countdown treated
 * that instant as the moment of expiry — which is 8 PM on Sep 22 in Georgia
 * (7 PM in winter). The card read "19h 38m" where the caregiver, at 12:20 AM
 * on Sep 22, expected 23h 38m, and a credential flipped to Expired the evening
 * before its printed date.
 *
 * The expiry instant is now midnight at the start of the printed date in
 * Eastern time (WeVoro's market is Georgia). One fixed zone keeps the
 * caregiver, the agency and the admin — wherever they sit — reading the same
 * countdown. The backend has an identical copy in helpers/credentialExpiry.ts
 * for the share gate and the expiry emails; keep the two in step.
 */
const ZONE = 'America/New_York';

const wallClock =
  typeof Intl !== 'undefined'
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: ZONE,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

/** Offset of ZONE from UTC at `ts`, in ms (negative west of Greenwich). */
const zoneOffsetMs = (ts: number): number => {
  if (!wallClock) return 0;
  const parts = wallClock.formatToParts(new Date(ts));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second')
  );
  return wall - Math.floor(ts / 1000) * 1000;
};

/**
 * The instant a stored credential date expires: the END of the printed
 * calendar day, Eastern — midnight at the start of the FOLLOWING day. NaN when
 * there is no readable date.
 *
 * SCRUM-208. This used to be midnight at the START of the printed day, making
 * the printed date the first day the credential was NOT valid. A certificate
 * does not read that way: "Expiration date 21 October" means good through the
 * 21st. Every count came out one short — a TB Test printed as expiring
 * 21 October read "Expires in 18 days" on 2 October, where anyone reading the
 * card counts 19 — and a credential turned Expired a day before the date on its
 * own face. SCRUM-169 still holds: the boundary is a wall-clock midnight in one
 * fixed zone, not 8 PM the evening before.
 *
 * The backend has an identical copy in helpers/credentialExpiry.ts; keep the
 * two in step, or the email and the card disagree again (SCRUM-150).
 */
export function credentialExpiresAt(value?: string | Date | null): number {
  if (!value) return NaN;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return NaN;
  // The stored value is UTC midnight of the printed day, so its UTC parts are
  // the printed day. +1 day lands on the midnight that ENDS it.
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate() + 1;
  let at = Date.UTC(y, m, day);
  // Two passes settle the offset across a DST change.
  for (let i = 0; i < 2; i++) at = Date.UTC(y, m, day) - zoneOffsetMs(at);
  return at;
}

/* ---------------------------------------------------------------- colours */

/**
 * SCRUM-136 (Faisal, Figma 11002:3957): the accessible badge pairs. The tints
 * are the original ones; only the text was darkened until each pair passes WCAG
 * AA at 12px. Any badge that means the same thing on any screen uses these —
 * never a lighter text colour.
 */
export const BADGE_TONE = {
  /** Confirmed, and the 60+ day band — #01400F on #BBF8DC, 10.09:1. */
  green: 'bg-[#BBF8DC] text-[#01400F]',
  /** Pending review, and the 30–60 day band — #7A5600 on #FDFFDD, 6.50:1. */
  amber: 'bg-[#FDFFDD] text-[#7A5600]',
  /** Rejected / Not confirmed / Expired, and the under-30 band — #A32219 on #FDE8E8, 6.39:1. */
  red: 'bg-[#FDE8E8] text-[#A32219]',
} as const;

/**
 * SCRUM-136: "Rejected", "Not confirmed" and "Expired" share the red pair, so
 * they were pixel-identical and only the word told them apart — exactly what
 * Faisal's audit flagged. Lightening the text to make them differ would break
 * his contrast numbers, so each one carries its own mark instead, in the same
 * #A32219 as the text (6.39:1, well over the 3:1 a graphic needs):
 *
 *  - Expired: a crossed-out calendar — the date ran out.
 *  - Rejected: a crossed circle — WeVoro looked at it and said no.
 *  - Not confirmed (nothing uploaded): a dashed circle and a dashed outline —
 *    an empty slot, nothing here yet.
 *
 * Shared with the admin review screen so one meaning has one mark everywhere.
 */
export const ALERT_MARK: Record<
  'expired' | 'rejected' | 'missing',
  { Icon: LucideIcon; outline: boolean }
> = {
  expired: { Icon: CalendarX2, outline: false },
  rejected: { Icon: CircleX, outline: false },
  missing: { Icon: CircleDashed, outline: true },
};

/* ----------------------------------------------------------------- bands */

export type ExpiryBand = 'green' | 'yellow' | 'red' | 'gray';

/** Green 60+ days, yellow 30–60, red under 30 or expired, grey with no date (SCRUM-132). */
export const EXPIRY_BAND_STYLE: Record<ExpiryBand, string> = {
  green: BADGE_TONE.green,
  yellow: BADGE_TONE.amber,
  red: BADGE_TONE.red,
  gray: 'bg-[#F9F9FA] text-[#1C1C1C]',
};

export interface CredentialExpiry {
  band: ExpiryBand;
  /**
   * Whole days left, rounded DOWN, everywhere: "2 days" means at least two full
   * days remain. The side panel used to round up, so the same credential read a
   * day longer there than on the card.
   */
  days: number;
  hrs: number;
  min: number;
  expired: boolean;
  hasExpiration: boolean;
}

/**
 * The single expiry calculation. `now` is passed in rather than read here, so
 * that everything drawn from one credential — the urgency pill, the countdown,
 * the card's own status — is worked out from the same instant and cannot
 * disagree.
 */
export function getCredentialExpiry(
  expirationDate: string | null | undefined,
  now: number
): CredentialExpiry {
  const at = credentialExpiresAt(expirationDate);
  if (Number.isNaN(at)) {
    return { band: 'gray', days: 0, hrs: 0, min: 0, expired: false, hasExpiration: false };
  }

  const diffMs = at - now;
  if (diffMs <= 0) {
    return { band: 'red', days: 0, hrs: 0, min: 0, expired: true, hasExpiration: true };
  }

  const days = Math.floor(diffMs / DAY);
  const hrs = Math.floor((diffMs % DAY) / HOUR);
  const min = Math.floor((diffMs % HOUR) / MINUTE);
  const band: ExpiryBand = days >= 60 ? 'green' : days >= 30 ? 'yellow' : 'red';

  return { band, days, hrs, min, expired: false, hasExpiration: true };
}

/**
 * SCRUM-136: the urgency wording and colour, the same on every surface —
 * "Expires in N days" / "Expires today", yellow 30–60 days, red under 30.
 * Nothing outside the 60-day window (no green "On track" pill) and nothing
 * once expired, where the status itself reads "Expired".
 */
export function getExpiryUrgency(
  exp: CredentialExpiry
): { text: string; cls: string; band: 'yellow' | 'red' } | null {
  if (!exp.hasExpiration || exp.expired) return null;
  if (exp.band !== 'yellow' && exp.band !== 'red') return null;
  const d = exp.days;
  const text = d >= 1 ? `Expires in ${d} day${d === 1 ? '' : 's'}` : 'Expires today';
  return { text, cls: EXPIRY_BAND_STYLE[exp.band], band: exp.band };
}

/* ----------------------------------------------------------------- clock */

/**
 * SCRUM-136: the clock a surface's countdowns read. Returns "now", and moves it
 * on every minute — every second once any of the given dates is inside its last
 * hour — so the hours and minutes shown in the last three days actually count
 * down, and a credential flips to Expired at the moment it expires rather than
 * on the next reload.
 *
 * Minute ticks land on the wall-clock minute. Credential dates are calendar
 * dates stored as UTC midnight (SCRUM-138), so that is exactly when the
 * countdown's minute changes — and two surfaces on the same page, each with its
 * own clock, tick at the same instant and show the same numbers.
 *
 * With no date to count down to, or once every date has passed, nothing can
 * change any more and the clock stops.
 */
export function useExpiryClock(...expirationDates: (string | null | undefined)[]): number {
  const [now, setNow] = useState(() => Date.now());
  // A stable dependency: the caller passes a fresh argument list every render.
  const key = expirationDates.filter(Boolean).join('|');

  useEffect(() => {
    const expiries = key
      .split('|')
      .map((d) => new Date(d).getTime())
      .filter((t) => !Number.isNaN(t));
    if (expiries.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const arm = (t: number) => {
      const live = expiries.filter((e) => e > t);
      if (live.length === 0) return;
      const soonest = Math.min(...live);
      const delay =
        soonest - t <= HOUR ? 1000 - (t % 1000) : MINUTE - (t % MINUTE);
      // A few ms past the boundary, so the new second or minute is the one read.
      timer = setTimeout(tick, delay + 25);
    };

    function tick() {
      const t = Date.now();
      setNow(t);
      arm(t);
    }

    // A background tab's timers are throttled, sometimes to once a minute or
    // less. Catch up the moment the caregiver comes back to the page.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (timer) clearTimeout(timer);
      tick();
    };

    // The data may have arrived well after the first render; start from the
    // real current time, not the one the state was created with.
    tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [key]);

  return now;
}
