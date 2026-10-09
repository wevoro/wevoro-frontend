// SCRUM-60: 5 required credentials. First entry is [Role] Certificate — label
// rendered at view time from the caregiver's professionalInfo.role (CNA | PCA).
// SCRUM-61: supporting-document preset list is separate from credentials.

export type CaregiverRole = 'CNA' | 'PCA';

export interface RequiredCredential {
  key: string;
  /** Static fallback label (used when role is unknown). */
  label: string;
  category: 'non_medical' | 'medical';
  documentType: string;
  /** When true, label is dynamic and derived from the caregiver's role. */
  roleDriven?: boolean;
}

/**
 * SCRUM-137 — the order credential cards are shown in, on every surface.
 *
 * [Role] Certificate, CPR Test, TB Test, Driver's License, Auto Insurance, per
 * SCRUM-62 / SCRUM-63 as amended on 2026-09-16. The caregiver section already
 * kept this order in a list of its own, while the agency section rendered
 * REQUIRED_CREDENTIALS as-is — so the same caregiver's credentials appeared in
 * two different orders depending on who was looking. Both now sort by this.
 *
 * SCRUM-155 / 163 / 164: REQUIRED_CREDENTIALS itself is now in this order too.
 * It used to keep the old grouping (non-medical first) on the theory that the
 * upload and completion flows depended on it — they never did (every consumer
 * looks keys up or sorts), but the floating box, the Completing Profile modal,
 * the onboarding credential step and the admin gate dialog all mapped the raw
 * array, so the same five credentials appeared in a different order on each.
 * One list, one order.
 */
export const CREDENTIAL_DISPLAY_ORDER = [
  'certifications',
  'cpr_test',
  'tb_tests',
  'driver_license',
  'auto_insurance',
] as const;

/** Sort comparator for credential cards; unknown keys go last. */
export const byCredentialDisplayOrder = (a: { key: string }, b: { key: string }) => {
  const rank = (key: string) => {
    const i = (CREDENTIAL_DISPLAY_ORDER as readonly string[]).indexOf(key);
    return i === -1 ? CREDENTIAL_DISPLAY_ORDER.length : i;
  };
  return rank(a.key) - rank(b.key);
};

export const REQUIRED_CREDENTIALS: RequiredCredential[] = [
  {
    key: 'certifications',
    label: 'CNA Certificate',
    category: 'non_medical',
    documentType: 'certifications',
    roleDriven: true,
  },
  {
    // SCRUM-110: the admin review card calls this "CPR & First Aid"
    // (admin-credentials.tsx) and the admin view is the source of truth for
    // credential naming, so the caregiver and agency cards use the same words.
    // "CPR Test" understated it — the credential covers first aid too.
    key: 'cpr_test',
    label: 'CPR & First Aid',
    category: 'medical',
    documentType: 'cpr_test',
  },
  {
    key: 'tb_tests',
    label: 'TB Test',
    category: 'medical',
    documentType: 'tb_tests',
  },
  {
    key: 'driver_license',
    label: "Driver's License",
    category: 'non_medical',
    documentType: 'driver_license',
  },
  {
    key: 'auto_insurance',
    label: 'Auto Insurance',
    category: 'non_medical',
    documentType: 'auto_insurance',
  },
];

/**
 * SCRUM-165: a PCA certificate is two documents, both stored as
 * 'certifications' rows and told apart by `part`: the written exam and the
 * RN/LPN practical sign-off. A CNA certificate, and every certificate uploaded
 * before the split, has no `part`.
 */
export type CertificatePart = 'written_exam' | 'practical_signoff';

/**
 * SCRUM-165: the row that stands for the credential when documents are looked
 * up by type. Everything except the sign-off counts, so a legacy certificate
 * with no `part` stays the certificate. The share gate, profile completion and
 * the admin Approve gate all judge this row alone — the sign-off never counts
 * toward the 5 and never locks or unlocks anything. Without this filter the
 * sign-off was taken for the certificate whenever it happened to be the first
 * (or last) 'certifications' row, depending on the screen.
 */
export const isPrimaryCredentialRow = (doc?: { part?: string | null } | null): boolean =>
  doc?.part !== 'practical_signoff';

/** SCRUM-165: the RN/LPN practical sign-off row (at most one per caregiver). */
export const isSignoffRow = (
  doc?: { documentType?: string; part?: string | null } | null,
): boolean => doc?.documentType === 'certifications' && doc?.part === 'practical_signoff';

/** SCRUM-152 / SCRUM-165: the written half of the PCA certificate, as Faisal names it. */
export const PCA_EXAM = { part: 'written_exam' as const, label: 'Exam - Written GACCP' };

/** SCRUM-152 / SCRUM-165: the practical half, with the info tooltip from the Figma. */
export const PCA_SIGNOFF = {
  part: 'practical_signoff' as const,
  label: 'RN/LPN practical sign-off',
  tooltipTitle: 'RN/LPN sign-off',
  tooltip:
    'Verifies that you have successfully demonstrated core clinical competencies under direct observation',
};

/** SCRUM-152: the CNA row on the onboarding credential step, as Faisal names it. */
export const CNA_CERTIFICATE_LABEL = 'CNA certificate';

/** Resolve the credential's display label using the caregiver's role (when role-driven). */
export function getCredentialLabel(
  cred: Pick<RequiredCredential, 'label' | 'roleDriven'>,
  role?: CaregiverRole | string | null,
): string {
  if (cred.roleDriven) {
    if (role === 'PCA') return 'PCA Certificate';
    if (role === 'CNA') return 'CNA Certificate';
    return 'CNA Certificate'; // default before role is set
  }
  return cred.label;
}

// SCRUM-61: Add More flow draws from this list (NOT the credential list).
// Selecting "Other" reveals the Custom Title input per existing modal logic.
export const SUPPORTING_DOCUMENT_TITLES: { value: string; label: string }[] = [
  { value: 'resume', label: 'Resume' },
  { value: 'signed_job_description', label: 'Signed Job Description' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'previous_experience', label: 'Previous Experience' },
  { value: 'other', label: 'Other' },
];

export type CredentialState = 'not_uploaded' | 'pending' | 'verified' | 'rejected';

export interface CredentialDocument {
  _id: string;
  title: string;
  url: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  credentialIdNumber?: string;
  credentialIssueDate?: string;
  credentialExpirationDate?: string;
  issuingOrganization?: string;
  rejectionReason?: string;
  /** SCRUM-109: category behind the caregiver-facing rejection message. */
  rejectionReasonCode?: string;
  /** SCRUM-109: admin asked for a replacement upload. */
  replacementRequested?: boolean;
  /** SCRUM-109: confirmed with no fixed renewal date. */
  hasNoExpiration?: boolean;
  /** SCRUM-109/110: WeVoro's own generated credential ID (vs the provider's). */
  wevoroCredentialId?: string;
  /**
   * SCRUM-177: no longer drawn anywhere — the globe / padlock marker it used to
   * drive is gone from the cards, and every upload is stored 'public'. The
   * field stays because the server still returns it and the offer flow reads it
   * (a 'public' document is auto-granted rather than pending a request).
   */
  privacy?: 'public' | 'private';
  /**
   * SCRUM-119: the url is withheld until the packet is paid for. The metadata
   * is still free, so the card renders in full.
   */
  locked?: boolean;
  /**
   * SCRUM-130: a file exists behind this credential even though `url` was
   * withheld. Viewing is free, so the card links to the server-side view route
   * rather than showing a padlock. The CDN url itself is never sent.
   */
  hasFile?: boolean;
  /**
   * SCRUM-129: a sensitive credential (TB test, background check) belonging to
   * a caregiver whose agency is not Confirmed yet. The row is kept so the card
   * shows the real state instead of reading as "Not Uploaded", but the file and
   * its metadata are stripped.
   */
  restricted?: boolean;
  restrictedReason?: string;
  /** SCRUM-165: which half of a PCA certificate this row is; absent elsewhere. */
  part?: CertificatePart;
  createdAt: string;
  updatedAt: string;
  category: string;
  documentType: string;
}

export interface CredentialStatus {
  key: string;
  label: string;
  category: string;
  state: CredentialState;
  document: CredentialDocument | null;
  roleDriven?: boolean;
  /**
   * SCRUM-165: set on the 'certifications' item only. The sign-off rides here
   * rather than as a sixth item because the share gate takes the list length
   * as its total — a sixth item would lock every share link. `document` above
   * is always the primary row.
   */
  signoff?: { state: CredentialState; document: CredentialDocument | null };
}
