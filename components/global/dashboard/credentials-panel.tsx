'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UploadDocumentModal from './upload-document-modal';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useUIContext, useUserContext } from '@/lib/contexts';
import { MAX_UPLOAD_MB } from '@/utils/download';
import {
  REQUIRED_CREDENTIALS as REQUIRED_CREDENTIALS_BASE,
  getCredentialLabel,
  isPrimaryCredentialRow,
  isSignoffRow,
  PCA_SIGNOFF,
  type CertificatePart,
} from '@/lib/credential-config';
import {
  ALERT_MARK,
  BADGE_TONE,
  getCredentialExpiry,
  getExpiryUrgency,
  useExpiryClock,
} from '@/lib/credential-expiry';

interface Document {
  _id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  category: string;
  documentType: string;
  reviewStatus?: string;
  credentialExpirationDate?: string;
  hasNoExpiration?: boolean;
  /** SCRUM-165: which half of a PCA certificate this 'certifications' row is. */
  part?: CertificatePart;
}

// SCRUM-60: 5-credential list with role-driven label resolved at view time.
// SCRUM-97: sizes track the single enforced limit (isValidFileSize). These hints
// used to advertise 2MB/5MB while the real cap was 3MB — the understated numbers
// are what pushed caregivers into uploading screenshots of their credentials.
// SCRUM-165: the hint names what the upload actually accepts (jpeg, jpg, png,
// pdf — utils/download.tsx) for every credential. The medical ones used to say
// "doc or pdf", and a .doc was then refused by the upload.
const FILE_HINT = `jpeg, png, pdf formats, up to ${MAX_UPLOAD_MB}MB.`;

/** One row of the box: a required credential, or a PCA's sign-off (SCRUM-165). */
interface PanelRow {
  key: string;
  documentType: string;
  part?: CertificatePart;
  category: string;
  label: string;
  defaultTitle: string;
  hint: string;
  doc?: Document;
}

/**
 * SCRUM-136: this panel used to work the expiry out on its own — a 30-day
 * cut-off, no yellow band, its own red (#EC685C, 3.13:1, fails contrast), its
 * own wording ("Expires in less than N days"), and it rounded UP where the card
 * rounds DOWN, so one credential read "3 days" here and "02 days" on the card
 * at the same moment. It now asks the same helper as the card, with the same
 * bands, colours, wording and rounding, and — as on the card — only for a
 * Confirmed credential (Option A): past its date it reads "Expired".
 */
function expiryPill(doc: Document, now: number) {
  if (doc.reviewStatus !== 'approved' || doc.hasNoExpiration) return null;
  const exp = getCredentialExpiry(doc.credentialExpirationDate, now);
  if (exp.expired) {
    return { text: 'Expired', cls: BADGE_TONE.red, Icon: ALERT_MARK.expired.Icon };
  }
  const urgency = getExpiryUrgency(exp);
  return urgency ? { text: urgency.text, cls: urgency.cls, Icon: undefined } : null;
}

type ReviewState = 'approved' | 'rejected' | 'pending';

const reviewStateOf = (doc: Document): ReviewState =>
  doc.reviewStatus === 'approved'
    ? 'approved'
    : doc.reviewStatus === 'rejected'
      ? 'rejected'
      : 'pending';

/**
 * The review line at the top of an uploaded row. A rejected required
 * credential used to read "Pending" here while its card read "Rejected".
 * SCRUM-136 baseline: the labels were orange #FF9500 (2.09:1) and red #D14343;
 * they now use the card's text colours, which pass at this size. The disc keeps
 * its colour — the glyph, not the tint, carries the meaning.
 */
const REVIEW_LOOK: Record<ReviewState, { label: string; disc: string; text: string }> = {
  approved: { label: 'Reviewed', disc: '#1A7A3C', text: '#1A7A3C' },
  // SCRUM-136 names the admin-rejected state "Rejected" on the caregiver's
  // card; "Not confirmed" there means nothing was uploaded.
  rejected: { label: 'Rejected', disc: '#A32219', text: '#A32219' },
  pending: { label: 'Pending', disc: '#FF9500', text: '#7A5600' },
};

function ReviewLine({ doc }: { doc: Document }) {
  const state = reviewStateOf(doc);
  const look = REVIEW_LOOK[state];
  return (
    <div
      className='flex items-center justify-between rounded-xl px-3 sm:px-4 py-2.5 sm:py-3'
      style={{ backgroundColor: '#F9F9FA', border: '1px solid #6C6C6C' }}
    >
      <div className='flex items-center gap-2'>
        <span
          className='w-5 h-5 rounded-full flex items-center justify-center shrink-0'
          style={{ backgroundColor: look.disc }}
        >
          {state === 'approved' ? (
            <svg width='11' height='8' viewBox='0 0 11 8' fill='none'>
              <path d='M1 3.5L4 6.5L10 1' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/>
            </svg>
          ) : state === 'rejected' ? (
            <svg width='10' height='10' viewBox='0 0 10 10' fill='none'>
              <path d='M1 1L9 9M9 1L1 9' stroke='white' strokeWidth='1.8' strokeLinecap='round'/>
            </svg>
          ) : (
            <svg width='11' height='11' viewBox='0 0 12 12' fill='none'>
              <path d='M6 3.2V6L8 7.4' stroke='white' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'/>
            </svg>
          )}
        </span>
        <span className='text-xs sm:text-sm font-medium' style={{ color: look.text }}>
          {look.label}
        </span>
      </div>
      {state === 'approved' && doc.reviewedAt && (
        <span className='text-xs text-gray-400'>{formatDate(doc.reviewedAt)}</span>
      )}
      {state !== 'approved' && doc.createdAt && (
        <span className='text-xs text-[#3A4742]'>Submitted on {formatDate(doc.createdAt)}</span>
      )}
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const CredentialsPanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const { user } = useUserContext();
  const { data: documents } = useDocuments();
  // SCRUM-154: "Go to credentials" in the Completing Profile modal expands this
  // box when there is no credential section on the page yet.
  const { expandCredentialsPanel, setExpandCredentialsPanel } = useUIContext();
  useEffect(() => {
    if (!expandCredentialsPanel) return;
    setCollapsed(false);
    setExpandCredentialsPanel(false);
  }, [expandCredentialsPanel, setExpandCredentialsPanel]);

  const completion = user?.completionPercentage ?? 0;
  // SCRUM-60: role drives the certificate row label.
  const role = user?.professionalInfo?.role;

  // Resolve the 5 required credentials with role-driven label + file hint.
  const requiredCredentials = REQUIRED_CREDENTIALS_BASE.map((c) => ({
    key: c.key,
    category: c.category,
    label: getCredentialLabel(c, role),
    defaultTitle: getCredentialLabel(c, role),
    hint: FILE_HINT,
  }));

  // SCRUM-165: a PCA's RN/LPN sign-off is a second 'certifications' row. Only
  // the primary row (the written exam, or a legacy certificate) is the
  // certificate here, so the sign-off never takes over its row's status.
  const uploadedByType: Record<string, Document> = {};
  (documents ?? []).forEach((doc: Document) => {
    if (isPrimaryCredentialRow(doc)) uploadedByType[doc.documentType] = doc;
  });
  const signoffDoc: Document | undefined = (documents ?? []).find((doc: Document) =>
    isSignoffRow(doc),
  );

  // The rows the box lists: the five credentials and, for a PCA, the sign-off
  // right after the certificate, with its own Upload. It is not a sixth
  // required credential — completion and the share gate never read it.
  const rows = requiredCredentials.flatMap((c): PanelRow[] => {
    const row: PanelRow = { ...c, documentType: c.key, doc: uploadedByType[c.key] };
    if (c.key !== 'certifications' || role !== 'PCA') return [row];
    return [
      row,
      {
        key: 'certifications_signoff',
        documentType: 'certifications',
        part: PCA_SIGNOFF.part,
        category: c.category,
        label: PCA_SIGNOFF.label,
        defaultTitle: PCA_SIGNOFF.label,
        hint: FILE_HINT,
        doc: signoffDoc,
      },
    ];
  });

  // SCRUM-165: the sign-off is drawn inside the certificate's group below, not
  // as a row of its own, so the two halves read as one credential.
  const signoffRow = rows.find((row) => row.key === 'certifications_signoff');

  const requiredKeys = requiredCredentials.map((c) => c.key);
  const extraDocs = (documents ?? []).filter(
    (doc: Document) => !requiredKeys.includes(doc.documentType),
  );

  // SCRUM-136: the same ticking clock the credential cards run, so the panel
  // and the card beside it read the same number of days at the same moment.
  // Nothing is on screen while the panel is collapsed, so it only runs open;
  // opening it restarts the clock from the current time.
  const now = useExpiryClock(
    ...(collapsed ? [] : rows.map((row) => row.doc?.credentialExpirationDate)),
  );

  // SCRUM-165: one row of the box, lifted out of the map unchanged so the PCA
  // certificate and its sign-off can be drawn inside a single group without
  // either row — or its Upload — being touched.
  const renderRow = (cred: PanelRow) => {
    const doc = cred.doc;
    const pill = doc ? expiryPill(doc, now) : null;

    return (
      <div
        key={cred.key}
        data-testid='panel-credential'
        data-key={cred.key}
        data-part={cred.part}
        className='flex flex-col rounded-2xl'
        style={{
          backgroundColor: doc ? '#FFFFFF' : '#F5F6F7',
          border: doc ? '1px solid #DFE2E0' : undefined,
          gap: 12,
          padding: '14px 14px 20px',
        }}
      >
        {doc ? (
          /* Uploaded state */
          <>
            <ReviewLine doc={doc} />
            <div>
              <p className='font-bold text-gray-900 text-sm mb-1'>{cred.label}</p>
              {pill ? (
                <span
                  data-testid='panel-expiry'
                  className={`mb-0.5 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-[18px] ${pill.cls}`}
                >
                  {pill.Icon && (
                    <pill.Icon aria-hidden className='size-3 shrink-0' strokeWidth={2.25} />
                  )}
                  {pill.text}
                </span>
              ) : (
                <p className='text-xs text-gray-400 truncate mb-0.5'>{doc.title}</p>
              )}
            </div>
          </>
        ) : (
          /* Not uploaded state */
          <>
            <div>
              <p className='font-bold text-gray-900 text-sm mb-1'>{cred.label}</p>
              <p className='text-xs text-gray-400 mb-0.5'>{cred.hint}</p>
            </div>
            <UploadDocumentModal
              category={cred.category}
              documentType={cred.documentType}
              part={cred.part}
              defaultTitle={cred.defaultTitle}
            >
              <Button
                variant='outline'
                className='w-fit gap-2 rounded-xl border-[#1C1C1C] bg-white text-gray-800 hover:border-primary hover:text-primary text-sm h-10 px-4'
              >
                <CloudUpload className='w-4 h-4' />
                Upload
              </Button>
            </UploadDocumentModal>
          </>
        )}
      </div>
    );
  };

  return (
    // BUG-02: Responsive panel — adapts to viewport, collapse button always accessible
    <div
      className='fixed bottom-4 right-4 sm:bottom-8 sm:right-8 md:right-[120px] z-40 bg-white flex flex-col w-[calc(100%-2rem)] sm:w-[340px] md:w-[375px] max-h-[60vh] overflow-hidden'
      style={{
        borderRadius: 16,
        padding: 20,
        gap: 16,
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header — always visible, sticky at top */}
      <div className='flex items-center justify-between w-full shrink-0'>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className='flex items-center gap-3'
        >
          <div className='relative w-9 h-9 shrink-0'>
            <Image
              src='/wevoro.png'
              alt='Wevoro'
              fill
              className='object-contain rounded-full'
            />
          </div>
          <span className='font-bold text-gray-900 text-lg sm:text-xl'>Credentials</span>
        </button>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors'
          aria-label={collapsed ? 'Expand credentials' : 'Collapse credentials'}
        >
          <ChevronUp className='w-5 h-5 text-gray-400' />
        </button>
      </div>

      {!collapsed && (
        <div className='flex flex-col gap-4 overflow-y-auto min-h-0'>
          {/* Profile Completion — single row */}
          <div className='flex items-center gap-3 shrink-0'>
            <span className='text-sm text-gray-500 shrink-0'>Profile Completion</span>
            <div className='flex-1 h-2 bg-[#FAFAFA] rounded-full overflow-hidden'>
              <div
                className='h-2 rounded-full transition-all duration-500'
                style={{
                  width: `${completion}%`,
                  background: 'linear-gradient(90deg, #33B55B 0%, #008000 100%)',
                }}
              />
            </div>
            <span className='text-sm font-bold text-gray-900 shrink-0'>
              {completion}%
            </span>
          </div>

          {/* Credential cards — scrollable */}
          <div
            className='flex flex-col overflow-y-auto scrollbar-thin'
            style={{ gap: 12, scrollbarWidth: 'thin', scrollbarColor: '#000 transparent', marginRight: -8, paddingRight: 8 }}
          >
            {rows.map((cred) => {
              // SCRUM-165: the certificate and the RN/LPN sign-off are one
              // credential, so the box draws them inside a single bordered
              // group under a "PCA Certifications" label instead of as two
              // flat rows. This is presentation only — `rows` above is
              // untouched, so both Uploads still carry their own part and the
              // five required credentials are still five (the sign-off has
              // never been one of them). A CNA has no sign-off row, so this
              // branch never runs and the certificate stays a plain row.
              if (cred.key === 'certifications_signoff') return null;
              if (cred.key === 'certifications' && role === 'PCA') {
                return (
                  <div
                    key='pca_certifications'
                    data-testid='panel-credential-group'
                    className='flex flex-col rounded-2xl'
                    style={{ border: '1px solid #DFE2E0', gap: 12, padding: 10 }}
                  >
                    <p className='px-1 text-sm font-semibold text-[#1C1C1C]'>
                      PCA Certifications
                    </p>
                    {renderRow(cred)}
                    {signoffRow && renderRow(signoffRow)}
                  </div>
                );
              }
              return renderRow(cred);
            })}

            {/* Extra uploaded docs not in required list — SCRUM-151: these
                used to be drawn with a green "Reviewed" badge no matter what
                the admin had (or had not) done, so a GCHEXS Confirmation that
                nobody had looked at told the caregiver it was reviewed. */}
            {extraDocs.map((doc: Document) => (
              <div
                key={doc._id}
                className='flex flex-col rounded-2xl'
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DFE2E0',
                  gap: 12,
                  padding: '14px 14px 20px',
                }}
              >
                <ReviewLine doc={doc} />
                <div>
                  <p className='font-bold text-gray-900 text-sm'>{doc.title}</p>
                  <p className='text-xs text-gray-400 truncate'>{doc.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialsPanel;
