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
