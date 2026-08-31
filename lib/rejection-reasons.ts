// SCRUM-109: the 9 rejection-reason categories used by the admin
// "Mark document as not confirmed" flow, plus the per-credential
// applicability matrix.
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO UPDATE THIS FILE
// The applicability matrix below is the single place that decides which reasons
// an admin may pick for a given credential. When the "AI Rejection-Reason
// Criteria" document is finalised, edit APPLICABILITY only — no other file needs
// to change.
//
//   'available' — admin can select it, AI may suggest it
//   'reserved'  — NOT selectable yet. Reserved for a verification source that
//                 does not exist yet; must not fire until that automation lands.
//   'never'     — permanently not applicable. Do not build toward enabling it.
// ─────────────────────────────────────────────────────────────────────────────

export type RejectionReasonCode =
  | 'unreadable'
  | 'expired'
  | 'information_missing'
  | 'name_mismatch'
  | 'wrong_document_type'
  | 'issuer_not_confirmed'
  | 'does_not_meet_requirement'
  | 'appears_altered'
  | 'other';

export type Applicability = 'available' | 'reserved' | 'never';

export interface RejectionReason {
  code: RejectionReasonCode;
  /** Label shown in the admin dropdown. */
  label: string;
  /**
   * SCRUM-109: AI may suggest this reason but must never auto-decide it, and no
   * caregiver-facing message is auto-generated — it always escalates to a human.
   * Permanent: excluded from any future automated-confirmation path regardless
   * of measured accuracy.
   */
  aiSuggestOnly?: boolean;
}

/** Dropdown order follows the Figma design, not the ticket's prose order. */
export const REJECTION_REASONS: RejectionReason[] = [
  { code: 'unreadable', label: 'Document is unreadable' },
  { code: 'expired', label: 'Document is expired' },
  { code: 'information_missing', label: 'Information is missing' },
  { code: 'name_mismatch', label: 'Name or information does not match' },
  { code: 'wrong_document_type', label: 'Wrong document type' },
  { code: 'issuer_not_confirmed', label: 'Issuing organization could not be confirmed' },
  { code: 'does_not_meet_requirement', label: 'Document does not meet the requirement' },
  { code: 'appears_altered', label: 'Document appears altered', aiSuggestOnly: true },
  { code: 'other', label: 'Other reason' },
];

export const REASON_LABELS: Record<RejectionReasonCode, string> = REJECTION_REASONS.reduce(
  (acc, r) => ({ ...acc, [r.code]: r.label }),
  {} as Record<RejectionReasonCode, string>,
);

/**
 * Credential keys mirror lib/credential-config.ts REQUIRED_CREDENTIALS, plus
 * 'gchexs' (background check, handled outside the 5 required credentials).
 */
export type CredentialKey =
  | 'certifications'
  | 'driver_license'
  | 'auto_insurance'
  | 'cpr_test'
  | 'tb_tests'
  | 'gchexs';

/**
 * Per-credential applicability.
 *
 * CONFIRMED from the SCRUM-109 ticket:
 *   - gchexs / issuer_not_confirmed          → 'never'    (permanent No; do not build toward it)
 *   - certifications / issuer_not_confirmed  → 'reserved' (CNA registry check not automated yet)
 *   - cpr_test / issuer_not_confirmed        → 'reserved' (CPR Tier 1 check not automated yet)
 *
 * Everything else defaults to 'available' pending the AI Rejection-Reason
 * Criteria document. Tighten these once it arrives.
 */
const DEFAULT_ROW: Record<RejectionReasonCode, Applicability> = {
  unreadable: 'available',
  expired: 'available',
  information_missing: 'available',
  name_mismatch: 'available',
  wrong_document_type: 'available',
  issuer_not_confirmed: 'available',
  does_not_meet_requirement: 'available',
  appears_altered: 'available',
  other: 'available',
};

export const APPLICABILITY: Record<CredentialKey, Record<RejectionReasonCode, Applicability>> = {
  certifications: { ...DEFAULT_ROW, issuer_not_confirmed: 'reserved' },
  driver_license: { ...DEFAULT_ROW },
  auto_insurance: { ...DEFAULT_ROW },
  cpr_test: { ...DEFAULT_ROW, issuer_not_confirmed: 'reserved' },
  tb_tests: { ...DEFAULT_ROW },
  gchexs: { ...DEFAULT_ROW, issuer_not_confirmed: 'never' },
};

/** Reasons an admin may actually pick for this credential. */
export function getSelectableReasons(credentialKey?: string): RejectionReason[] {
  const row = APPLICABILITY[credentialKey as CredentialKey];
  if (!row) return REJECTION_REASONS;
  return REJECTION_REASONS.filter((r) => row[r.code] === 'available');
}

export function isReasonAllowed(credentialKey: string | undefined, code: RejectionReasonCode): boolean {
  const row = APPLICABILITY[credentialKey as CredentialKey];
  if (!row) return true;
  return row[code] === 'available';
}

/**
 * SCRUM-109: fixed caregiver-facing messages.
 *
 * Only CPR/First Aid's "does not meet requirement" is fixed — a Georgia audit
 * requires the certificate to state "CPR and First Aid", not just "BLS". Every
 * other reason on every credential uses a specific, dynamic message written per
 * case.
 */
export const FIXED_MESSAGES: Partial<Record<CredentialKey, Partial<Record<RejectionReasonCode, string>>>> = {
  cpr_test: {
    does_not_meet_requirement:
      'Incorrect Information — CPR and First Aid coverage is required. Request a replacement document.',
  },
};

export function getFixedMessage(
  credentialKey: string | undefined,
  code: RejectionReasonCode,
): string | undefined {
  return FIXED_MESSAGES[credentialKey as CredentialKey]?.[code];
}

/** True when the message box should be locked (fixed message applies). */
export function hasFixedMessage(credentialKey: string | undefined, code: RejectionReasonCode): boolean {
  return getFixedMessage(credentialKey, code) !== undefined;
}

export function isAiSuggestOnly(code: RejectionReasonCode): boolean {
  return REJECTION_REASONS.find((r) => r.code === code)?.aiSuggestOnly === true;
}
