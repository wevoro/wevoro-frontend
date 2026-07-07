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
