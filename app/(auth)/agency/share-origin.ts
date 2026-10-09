/**
 * SCRUM-179 (SCRUM-64 onboarding redirect): remember WHICH caregiver an agency
 * arrived through, so that finishing the "Complete your agency account" form
 * sends them back to that caregiver instead of the generic /agency/profile.
 *
 * The journey is /p/[shareId] -> /agency/access (email + emailed code) ->
 * /agency/caregivers/[id] -> /agency/complete, so the id has to survive several
 * pages and a full-page reload after sign-in. The links between those pages
 * carry ?proId=, and this sessionStorage breadcrumb — written once at the share
 * entry point — is the fallback for the routes that do not (the pinned
 * "Complete your account" action, a reload, a direct visit).
 *
 * sessionStorage, not localStorage: this is one visit's context, not a
 * preference, and it must not leak into the next session in the same browser.
 */
const SOURCE_CAREGIVER_KEY = 'wevoro.agency.sourceCaregiverId';

/** Called on the share-link entry page once the caregiver id is known. */
export const rememberSourceCaregiver = (caregiverId?: string | null) => {
  if (!caregiverId) return;
  try {
    window.sessionStorage.setItem(SOURCE_CAREGIVER_KEY, caregiverId);
  } catch {
    // Private mode / blocked storage: the ?proId= links still work.
  }
};

/** The caregiver this agency came in through, if we still know. */
export const readSourceCaregiver = (): string | null => {
  try {
    return window.sessionStorage.getItem(SOURCE_CAREGIVER_KEY);
  } catch {
    return null;
  }
};

/** Drop the breadcrumb once it has been used to route the agency back. */
export const forgetSourceCaregiver = () => {
  try {
    window.sessionStorage.removeItem(SOURCE_CAREGIVER_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
};
