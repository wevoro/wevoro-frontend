export interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  user: string;
  createdAt: string;
  // SCRUM-65: Credential notification fields
  type?: 'general' | 'credential_yellow' | 'credential_red' | 'credential_expired' | 'credential_rejected' | 'private_access_request' | 'private_access_granted' | 'private_access_revoked' | 'agency_onboarded' | 'credentials_downloaded';
  credentialDocumentId?: string;
  credentialName?: string;
  ctaLink?: string;
  [key: string]: any;
}

// SCRUM-66: GCHEXS Status
export type GchexsStatus = 'yes' | 'no' | 'not_set';

// SCRUM-67: Private Access
export interface PrivateAccessRequest {
  _id: string;
  agency: { _id: string; email: string };
  caregiver: string;
  status: 'pending' | 'granted' | 'revoked';
  grantedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

// SCRUM-67: Download Audit
export interface DownloadAuditEntry {
  _id: string;
  agency: { _id: string; email: string };
  caregiver: string;
  documentId?: string;
  documentTitle?: string;
  downloadType: 'individual' | 'bulk';
  documentsIncluded?: Array<{ documentId: string; title: string }>;
  createdAt: string;
}
