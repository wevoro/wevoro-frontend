/**
 * SCRUM-144 — user-facing URL names.
 *
 * The product says "caregiver" and "agency"; the URLs used to say "pro" and
 * "partner". The pages now live under /caregiver and /agency, and every old
 * /pro and /partner address is redirected there (next.config.mjs), so links in
 * emails that were already sent, bookmarks and old notifications keep working.
 *
 * The ROLE VALUES are unchanged on purpose: accounts, login tokens and the
 * database still store 'pro' and 'partner'. Renaming those needs a data
 * migration and signs everyone out, and nobody sees them. Anything that turns a
 * role into a URL, or a URL back into a role, goes through here.
 */

export type AccountRole = 'pro' | 'partner';

/** 'pro' → '/caregiver', 'partner' → '/agency'. */
export const roleBasePath = (role?: string | null): '/caregiver' | '/agency' =>
  role === 'partner' ? '/agency' : '/caregiver';

/** First URL segment → role: 'caregiver' → 'pro', 'agency' → 'partner'. */
export const roleFromSegment = (segment?: string | null): string | undefined => {
  if (segment === 'caregiver') return 'pro';
  if (segment === 'agency') return 'partner';
  return segment || undefined;
};

/**
 * An address written somewhere we do not control — CMS (Sanity) buttons and
 * footer links, notification links already stored in the database — mapped to
 * its current page. The old address would still work through the redirect;
 * this just skips the extra hop and keeps the old words out of the status bar.
 * Same mapping as the redirects in next.config.mjs.
 */
export const toCurrentPath = (href?: string | null): string => {
  if (!href || !href.startsWith('/')) return href || '';
  const end = '(?=[/?#]|$)';
  return href
    .replace(new RegExp(`^/partner/pros${end}`), '/agency/caregivers')
    .replace(/^\/pro\/partner\//, '/caregiver/agencies/')
    .replace(new RegExp(`^/admin/pros${end}`), '/admin/caregivers')
    .replace(new RegExp(`^/admin/partners${end}`), '/admin/agencies')
    .replace(new RegExp(`^/partner${end}`), '/agency')
    .replace(new RegExp(`^/pro${end}`), '/caregiver')
    .replace(new RegExp(`^/pros${end}`), '/caregivers')
    .replace(new RegExp(`^/partners${end}`), '/agencies');
};

/** What people call a role: 'pro' → 'Caregiver', 'partner' → 'Agency'. */
export const roleLabel = (role?: string | null): string => {
  if (role === 'pro') return 'Caregiver';
  if (role === 'partner') return 'Agency';
  if (role === 'super_admin') return 'Super admin';
  if (role === 'admin') return 'Admin';
  return role || '';
};

/** The agency's view of one caregiver. */
export const agencyCaregiverPath = (caregiverId: string) =>
  `/agency/caregivers/${caregiverId}`;

/** The caregiver's view of one agency. */
export const caregiverAgencyPath = (agencyId: string) =>
  `/caregiver/agencies/${agencyId}`;

/** A caregiver's public profile, /caregiver/:id (the old /pro/:id). */
export const isCaregiverPublicPath = (pathname: string) =>
  pathname.startsWith('/caregiver/');

/** The agency viewing a caregiver, /agency/caregivers/:id. */
export const isAgencyCaregiverPath = (pathname: string) =>
  pathname.startsWith('/agency/caregivers/');

/** The caregiver viewing an agency, /caregiver/agencies/:id. */
export const isCaregiverAgencyPath = (pathname: string) =>
  pathname.startsWith('/caregiver/agencies/');
