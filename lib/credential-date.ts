/**
 * SCRUM-138 — credential dates are calendar dates, not moments in time.
 *
 * An issue or expiration date is a day on a certificate ("expires Sep 17"),
 * with no time of day attached. The backend stores it by parsing the
 * "YYYY-MM-DD" the admin enters, and a date-only string parses as UTC midnight,
 * so Sep 17 is stored as 2026-09-17T00:00:00Z.
 *
 * Rendering that with the viewer's local timezone turns it back into a moment:
 * in Georgia (UTC-4) midnight UTC is 8 pm the evening before, so every card and
 * the admin Application Details read "Sep 16". The admin edit modal formatted in
 * UTC and correctly read "Sep 17" — which is why the modal looked one day late
 * when it was the only screen telling the truth. An admin "correcting" the modal
 * to match the cards would then have saved Sep 16 and pushed the stored date
 * back a day.
 *
 * Formatting in UTC shows the day that was entered, for every viewer in every
 * timezone. Use this for credential calendar dates only — createdAt, reviewedAt
 * and other real timestamps should keep rendering in local time.
 */
export function formatCredentialDate(
  value?: string | null,
  month: 'long' | 'short' = 'long',
  fallback = ''
): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('en-US', {
    month,
    day: month === 'short' ? '2-digit' : 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
