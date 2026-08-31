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

export const REQUIRED_CREDENTIALS: RequiredCredential[] = [
  {
    key: 'certifications',
    label: 'CNA Certificate',
    category: 'non_medical',
    documentType: 'certifications',
    roleDriven: true,
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
  {
    key: 'cpr_test',
    label: 'CPR Test',
    category: 'medical',
    documentType: 'cpr_test',
  },
  {
    key: 'tb_tests',
    label: 'TB Test',
    category: 'medical',
    documentType: 'tb_tests',
  },
];

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
  /** Drives the globe / padlock icon on the caregiver-facing card. */
  privacy?: 'public' | 'private';
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
}
