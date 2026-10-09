/**
 * SCRUM-87/88: platform-wide credentialing-only beta flag.
 *
 * Read from NEXT_PUBLIC_CREDENTIALING_MODE, which Next.js inlines at build time
 * so this works in both server and client components. Defaults ON unless the
 * value is explicitly 'false' — mirroring the backend's `config.credentialing_mode`
 * default so the flag reads consistently on both sides.
 *
 * When ON: scheduling-era surfaces (SCRUM-39/46/48/49/54/55) are hidden and the
 * Offers tab is repurposed to track caregiver↔agency credentialing engagements.
 */
export const isCredentialingMode = (): boolean =>
  process.env.NEXT_PUBLIC_CREDENTIALING_MODE !== 'false';

/**
 * Staged-rollout flag for credential SHARING, deliberately INDEPENDENT from the
 * credentialing/scheduling flag above (client directive: "sharing should not
 * sit behind a feature flag tied to scheduling").
 *
 * Gates only the share/download surfaces: Share Profile buttons, the share-link
 * box, the public /p/[shareId] preview, and the credential download buttons.
 * Defaults ON unless explicitly 'false' — flip to 'false' for a day-one launch
 * with profiles/uploads only, then back on (rebuild) once sharing is cleared
 * for real users. Read from NEXT_PUBLIC_SHARING_ENABLED (inlined at build).
 */
export const isSharingEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_SHARING_ENABLED !== 'false';

/**
 * SCRUM-156: the one place a caregiver's share link is spelled out.
 *
 * The profile header, the Onboarding page and the Settings box each built
 * this string themselves. Settings was rewritten on 21 Sep to read `shareId`
 * only, while the other two kept the database-id fallback — so a caregiver
 * who signed up with Google or a passwordless code (no shareId is minted on
 * those paths) got a grey box that never resolved in Settings and a working
 * button everywhere else. Same link, same fallback, everywhere.
 */
export const caregiverShareLink = (
  user?: { shareId?: string | null; _id?: string | null } | null,
): string => {
  const key = user?.shareId || user?._id;
  if (!key) return '';
  return typeof window !== 'undefined'
    ? `${window.location.origin}/p/${key}`
    : `/p/${key}`;
};
