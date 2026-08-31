'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UploadDocumentModal from './upload-document-modal';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useUserContext } from '@/lib/contexts';
import { MAX_UPLOAD_MB } from '@/utils/download';
import {
  REQUIRED_CREDENTIALS as REQUIRED_CREDENTIALS_BASE,
  getCredentialLabel,
} from '@/lib/credential-config';

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
}

// SCRUM-60: 5-credential list with role-driven label resolved at view time.
// SCRUM-97: sizes track the single enforced limit (isValidFileSize). These hints
// used to advertise 2MB/5MB while the real cap was 3MB — the understated numbers
// are what pushed caregivers into uploading screenshots of their credentials.
const HINT_BY_CATEGORY: Record<string, string> = {
  non_medical: `jpeg, png, pdf formats, up to ${MAX_UPLOAD_MB}MB.`,
  medical: `doc or pdf formats, up to ${MAX_UPLOAD_MB}MB.`,
};

// Red supporting line appears inside the same 30-day band credential-status-card
// treats as expiring.
const EXPIRY_WARNING_DAYS = 30;

function daysUntilExpiry(dateStr?: string) {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) return null;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days <= EXPIRY_WARNING_DAYS ? days : null;
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

  const completion = user?.completionPercentage ?? 0;
  // SCRUM-60: role drives the certificate row label.
  const role = user?.professionalInfo?.role;

  // Resolve the 5 required credentials with role-driven label + per-category hint.
  const requiredCredentials = REQUIRED_CREDENTIALS_BASE.map((c) => ({
    key: c.key,
    category: c.category,
    label: getCredentialLabel(c, role),
    defaultTitle: getCredentialLabel(c, role),
    hint: HINT_BY_CATEGORY[c.category] ?? 'doc or pdf formats, up to 5MB.',
  }));

  const uploadedByType: Record<string, Document> = {};
  (documents ?? []).forEach((doc: Document) => {
    uploadedByType[doc.documentType] = doc;
  });

  const requiredKeys = requiredCredentials.map((c) => c.key);
  const extraDocs = (documents ?? []).filter(
    (doc: Document) => !requiredKeys.includes(doc.documentType),
  );

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
            {requiredCredentials.map((cred) => {
              const doc = uploadedByType[cred.key];
              const isReviewed = doc?.reviewStatus === 'approved';
              const expiringDays = daysUntilExpiry(doc?.credentialExpirationDate);

              return (
                <div
                  key={cred.key}
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
                      <div
                        className='flex items-center justify-between rounded-xl px-3 sm:px-4 py-2.5 sm:py-3'
                        style={{
                          backgroundColor: '#F9F9FA',
                          border: '1px solid #6C6C6C',
                        }}
                      >
                        <div className='flex items-center gap-2'>
                          {isReviewed ? (
                            <span className='w-5 h-5 rounded-full bg-[#1A7A3C] flex items-center justify-center shrink-0'>
                              <svg width='11' height='8' viewBox='0 0 11 8' fill='none'>
                                <path d='M1 3.5L4 6.5L10 1' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/>
                              </svg>
                            </span>
                          ) : (
                            <span className='w-5 h-5 rounded-full bg-[#FF9500] flex items-center justify-center shrink-0'>
                              <svg width='11' height='11' viewBox='0 0 12 12' fill='none'>
                                <path d='M6 3.2V6L8 7.4' stroke='white' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'/>
                              </svg>
                            </span>
                          )}
                          <span
                            className='text-xs sm:text-sm font-medium'
                            style={{ color: isReviewed ? '#1A7A3C' : '#FF9500' }}
                          >
                            {isReviewed ? 'Reviewed' : 'Pending'}
                          </span>
                        </div>
                        {isReviewed && doc.reviewedAt && (
                          <span className='text-xs text-gray-400'>
                            {formatDate(doc.reviewedAt)}
                          </span>
                        )}
                        {!isReviewed && doc.createdAt && (
                          <span className='text-xs text-[#3A4742]'>
                            Submitted on {formatDate(doc.createdAt)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className='font-bold text-gray-900 text-sm mb-1'>{cred.label}</p>
                        {expiringDays !== null ? (
                          <p className='text-xs mb-0.5' style={{ color: '#EC685C' }}>
                            Expires in less than{' '}
                            <span className='font-bold'>{expiringDays} days</span>
                          </p>
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
                        documentType={cred.key}
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
            })}

            {/* Extra uploaded docs not in required list */}
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
                <div
                  className='flex items-center justify-between rounded-xl px-3 sm:px-4 py-2.5 sm:py-3'
                  style={{ backgroundColor: '#F9F9FA', border: '1px solid #6C6C6C' }}
                >
                  <div className='flex items-center gap-2'>
                    <span className='w-5 h-5 rounded-full bg-[#1A7A3C] flex items-center justify-center shrink-0'>
                      <svg width='11' height='8' viewBox='0 0 11 8' fill='none'>
                        <path d='M1 3.5L4 6.5L10 1' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/>
                      </svg>
                    </span>
                    <span className='text-sm font-medium text-[#1A7A3C]'>Reviewed</span>
                  </div>
                  {doc.reviewedAt && (
                    <span className='text-xs text-gray-400'>
                      {formatDate(doc.reviewedAt)}
                    </span>
                  )}
                </div>
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
