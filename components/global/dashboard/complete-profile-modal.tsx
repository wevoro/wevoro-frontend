'use client';

import React from 'react';
import moment from 'moment';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, Check, Clock, CloudUpload, Plus } from 'lucide-react';
import UploadDocumentModal from './upload-document-modal';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useUIContext, useUserContext } from '@/lib/contexts';
import { MAX_UPLOAD_MB } from '@/utils/download';
import { credentialExpiresAt } from '@/lib/credential-expiry';
import {
  REQUIRED_CREDENTIALS as REQUIRED_CREDENTIALS_BASE,
  getCredentialLabel,
  isPrimaryCredentialRow,
  isSignoffRow,
  PCA_SIGNOFF,
  type CertificatePart,
} from '@/lib/credential-config';

interface CompleteProfileModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * SCRUM-133 (Faisal, Figma 10988:4332) — the SCRUM-40 modal, now listing all
 * five credentials with their state, so the caregiver sees exactly what is
 * left before their profile link works:
 *
 *   Verified     green check, "Verified on {date}"
 *   In review    amber clock, "Uploaded {date} — waiting on our review"
 *   Rejected     red, the reason inline (caregiver-only, SCRUM-63) + Re-upload
 *   Not uploaded grey plus, the file hint + Upload
 *
 * An approved credential that has since expired is not verified any more; it
 * is shown like a rejected one, with a Re-upload.
 */
type RowState = 'verified' | 'review' | 'rejected' | 'expired' | 'missing';

// SCRUM-176: last wins. Every other resolver keys documents by type in a
// forEach — app/actions.ts#getCredentialStatus, the credentials panel, the
// admin card, the backend's document.service, share-unlock.service.ts and
// calculateProCompletion — and so keeps the LAST matching row. This modal took
// the first, so a caregiver who re-uploaded a credential was shown the state
// of the row they replaced while the share gate and the cards read the new
// one. The predicate keeps isPrimaryCredentialRow, so SCRUM-165 still keeps
// the PCA sign-off out of the certificate row.
const lastPrimaryRow = (docs: any[], documentType: string) => {
  for (let i = docs.length - 1; i >= 0; i -= 1) {
    const d = docs[i];
    if (d?.documentType === documentType && isPrimaryCredentialRow(d)) return d;
  }
  return undefined;
};

function rowState(doc: any): RowState {
  if (!doc) return 'missing';
  const status = doc.reviewStatus ?? 'pending';
  if (status === 'rejected') return 'rejected';
  if (status !== 'approved') return 'review';
  // SCRUM-169: the same expiry instant as the cards.
  const at = credentialExpiresAt(doc.credentialExpirationDate);
  if (!doc.hasNoExpiration && !Number.isNaN(at) && at <= Date.now()) return 'expired';
  return 'verified';
}

function CredentialRow({
  label,
  hint,
  category,
  documentType,
  part,
  doc,
}: {
  label: string;
  hint: string;
  category: string;
  documentType: string;
  /** SCRUM-165: set on a PCA's RN/LPN sign-off row, sent with its upload. */
  part?: CertificatePart;
  doc: any;
}) {
  const state = rowState(doc);

  const icon = {
    verified: (
      <span className='flex size-10 items-center justify-center rounded-full bg-[#E0FDED]'>
        <Check className='size-[18px] text-[#008000]' strokeWidth={2.5} />
      </span>
    ),
    review: (
      <span className='flex size-10 items-center justify-center rounded-full bg-[#FFF8E6]'>
        <Clock className='size-[18px] text-[#FAB607]' />
      </span>
    ),
    rejected: (
      <span className='flex size-10 items-center justify-center rounded-full bg-[#FDE8E8] text-[18px] font-bold text-[#E94435]'>
        !
      </span>
    ),
    expired: (
      <span className='flex size-10 items-center justify-center rounded-full bg-[#FDE8E8] text-[18px] font-bold text-[#E94435]'>
        !
      </span>
    ),
    missing: (
      <span className='flex size-10 items-center justify-center rounded-full bg-[#F2F4F3]'>
        <Plus className='size-[18px] text-[#6C7A89]' />
      </span>
    ),
  }[state];

  const verifiedOn = doc?.reviewedAt || doc?.updatedAt;
  const supporting = {
    verified: verifiedOn ? `Verified on ${moment(verifiedOn).format('MMM D, YYYY')}` : 'Verified',
    review: `Uploaded ${moment(doc?.createdAt || doc?.updatedAt).format('MMM D')} — waiting on our review`,
    rejected: `Rejected${doc?.rejectionReason ? ` — ${doc.rejectionReason}` : ' — please upload it again'}`,
    expired: 'Expired — please upload a current one',
    missing: hint,
  }[state];

  const needsUpload = state === 'rejected' || state === 'expired' || state === 'missing';

  return (
    // SCRUM-165: the exam and the sign-off share a documentType, so the part
    // keeps the sign-off row's test id distinct.
    <div
      data-testid={`completing-row-${part ? `${documentType}-${part}` : documentType}`}
      data-state={state}
      className='flex w-full flex-col items-start justify-between gap-3 rounded-2xl border border-[#DFE2E0] p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5'
    >
      <div className='flex min-w-0 items-center gap-3'>
        <div className='shrink-0'>{icon}</div>
        <div className='min-w-0'>
          <p className='text-[15px] font-semibold text-[#1C1C1C] sm:text-[17px]'>{label}</p>
          <p
            className={`text-xs sm:text-[13px] ${
              state === 'rejected' || state === 'expired' ? 'text-[#E94435]' : 'text-[#6C6C6C]'
            }`}
          >
            {supporting}
          </p>
        </div>
      </div>

      {state === 'verified' && (
        <span className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#E0FDED] px-3 py-2 text-[14px] font-medium text-[#008000]'>
          <Check className='size-4' strokeWidth={2.5} />
          Verified
        </span>
      )}
      {state === 'review' && (
        <span className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FFF8E6] px-3 py-2 text-[14px] font-medium text-[#B07F00]'>
          <Clock className='size-4' />
          In review
        </span>
      )}
      {needsUpload && (
        <UploadDocumentModal
          category={category}
          documentType={documentType}
          part={part}
          defaultTitle={label}
          document={state !== 'missing' ? doc : undefined}
        >
          <Button
            variant='outline'
            className={`h-10 shrink-0 gap-2 rounded-[10px] px-4 text-[14px] font-medium ${
              state === 'missing'
                ? 'border-[#008000] text-[#008000] hover:bg-[#008000]/5'
                : 'border-[#E94435] text-[#E94435] hover:bg-[#E94435]/5'
            }`}
          >
            <CloudUpload className='size-4' />
            {state === 'missing' ? 'Upload' : 'Re-upload'}
          </Button>
        </UploadDocumentModal>
      )}
    </div>
  );
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ open, onClose }) => {
  const { user } = useUserContext();
  const { data: documents } = useDocuments();
  const router = useRouter();
  const pathname = usePathname();
  const role = user?.professionalInfo?.role;
  const { setExpandCredentialsPanel } = useUIContext();

  // SCRUM-154: with nothing uploaded there is no Credentials Status section to
  // scroll to, so this button expands the floating Credentials box instead
  // (SCRUM-40) — the checklist with an Upload button per credential.
  const goToCredentials = () => {
    onClose();
    const hasSection = !!document.getElementById('credentials');
    if (pathname === '/caregiver/profile') {
      if (hasSection) {
        requestAnimationFrame(() =>
          document.getElementById('credentials')?.scrollIntoView({ behavior: 'smooth' })
        );
      } else {
        setExpandCredentialsPanel(true);
      }
    } else {
      setExpandCredentialsPanel(true);
      router.push('/caregiver/profile#credentials');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      {/* BUG-01: Responsive modal — scrollable, X always accessible */}
      <DialogContent
        className='max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:max-w-[640px] sm:p-6 md:p-8'
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className='flex flex-col items-center gap-4 sm:gap-5'>
          <div className='text-center'>
            <DialogTitle className='text-xl font-semibold text-[#1C1C1C] sm:text-2xl'>
              Completing Profile
            </DialogTitle>
            <DialogDescription className='mt-2 text-sm text-[#1C1C1C] sm:text-base'>
              All 5 credentials must be verified before your profile link works
            </DialogDescription>
          </div>

          <div className='flex items-center gap-2.5 rounded-full border border-[#FAB607] bg-[#FFFBEA] px-4 py-2 sm:px-5'>
            <AlertTriangle className='size-5 shrink-0 text-[#FAB607]' />
            <span className='text-xs font-medium text-[#B07F00] sm:text-sm'>
              Your profile link is locked until every credential below is verified
            </span>
          </div>

          <div className='flex w-full flex-col gap-3'>
            {REQUIRED_CREDENTIALS_BASE.map((c) => {
              const label = getCredentialLabel(c, role);
              // SCRUM-97: sizes track the single enforced limit (isValidFileSize).
              // SCRUM-165: and the formats are what the upload accepts (jpeg,
              // jpg, png, pdf) for every credential; the medical rows used to
              // say "doc or pdf", and a .doc was then refused.
              const hint = `jpeg, png, pdf formats, up to ${MAX_UPLOAD_MB}MB.`;
              // SCRUM-165: a PCA's RN/LPN sign-off is a second 'certifications'
              // row. A lookup by type alone could take it for the certificate,
              // and Re-upload would then replace the sign-off; only the
              // primary row (written exam, or a legacy certificate) is it.
              // SCRUM-176: and of those primary rows, the last one.
              const doc = lastPrimaryRow(documents ?? [], c.documentType);
              const row = (
                <CredentialRow
                  label={label}
                  hint={hint}
                  category={c.category}
                  documentType={c.documentType}
                  doc={doc}
                />
              );
              if (c.key !== 'certifications' || role !== 'PCA') {
                return <React.Fragment key={c.key}>{row}</React.Fragment>;
              }
              // SCRUM-165: the certificate and the sign-off are the two halves
              // of one credential, so they sit inside a single bordered group
              // under a "PCA Certifications" label rather than as two
              // top-level rows. Each half keeps its own state and its own
              // Upload / Re-upload. The group is presentation only: the
              // sign-off is still not one of the five the copy above counts,
              // and it never locks or unlocks the profile link — the share
              // gate still judges the certificate row alone.
              return (
                <div
                  key={c.key}
                  data-testid='completing-group-certifications'
                  className='flex w-full flex-col gap-3 rounded-2xl border border-[#DFE2E0] p-3 sm:p-4'
                >
                  <p className='text-sm font-semibold text-[#1C1C1C]'>PCA Certifications</p>
                  {row}
                  <CredentialRow
                    label={PCA_SIGNOFF.label}
                    hint={hint}
                    category={c.category}
                    documentType={c.documentType}
                    part={PCA_SIGNOFF.part}
                    doc={(documents ?? []).find((d: any) => isSignoffRow(d))}
                  />
                </div>
              );
            })}
          </div>

          <div className='flex w-full flex-col gap-3 sm:flex-row'>
            <Button
              onClick={goToCredentials}
              className='h-12 flex-1 rounded-xl bg-[#008000] text-base font-medium text-white hover:bg-[#016b01] sm:h-14'
            >
              Go to credentials
            </Button>
            <Button
              variant='outline'
              onClick={onClose}
              className='h-12 flex-1 rounded-xl border-[#1C1C1C] text-base font-medium sm:h-14'
            >
              Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteProfileModal;
