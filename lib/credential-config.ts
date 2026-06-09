export const REQUIRED_CREDENTIALS = [
  { key: 'certifications', label: 'CNA Certification', category: 'non_medical', documentType: 'certifications' },
  { key: 'driver_license', label: "Driver's License", category: 'non_medical', documentType: 'driver_license' },
  { key: 'auto_insurance', label: 'Auto Insurance', category: 'non_medical', documentType: 'auto_insurance' },
  { key: 'cpr_test', label: 'CPR Test', category: 'medical', documentType: 'cpr_test' },
  { key: 'tb_tests', label: 'TB Test', category: 'medical', documentType: 'tb_tests' },
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
}
