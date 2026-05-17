'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, CheckCircle2, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UploadDocumentModal from './upload-document-modal';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useUserContext } from '@/lib/contexts';

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
}

const REQUIRED_CREDENTIALS = [
  {
    key: 'driver_license',
    category: 'non_medical',
    label: "Driver's License",
    defaultTitle: "Driver's License",
    hint: 'jpeg, png, pdf formats, up to 2MB.',
  },
  {
    key: 'certifications',
    category: 'non_medical',
    label: 'CNA certificate',
    defaultTitle: 'CNA Certificate',
    hint: 'doc or pdf formats, up to 5mb.',
  },
  {
    key: 'tb_tests',
    category: 'medical',
    label: 'TB Test',
    defaultTitle: 'TB Test',
    hint: 'jpeg, png, pdf formats, up to 2MB.',
  },
];

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const CredentialsPanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUserContext();
  const { data: documents } = useDocuments();

  const completion = user?.completionPercentage ?? 0;

  const uploadedByType: Record<string, Document> = {};
  (documents ?? []).forEach((doc: Document) => {
    uploadedByType[doc.documentType] = doc;
  });

  const requiredKeys = REQUIRED_CREDENTIALS.map((c) => c.key);
  const extraDocs = (documents ?? []).filter(
    (doc: Document) => !requiredKeys.includes(doc.documentType),
  );

  return (
    <div
      className='fixed bottom-8 right-[120px] z-40 bg-white flex flex-col'
      style={{
        width: 375,
        borderRadius: 16,
        padding: 24,
        gap: 20,
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className='flex items-center justify-between w-full'
      >
        <div className='flex items-center gap-3'>
          <div className='relative w-9 h-9 shrink-0'>
            <Image
              src='/wevoro.png'
              alt='Wevoro'
              fill
              className='object-contain rounded-full'
            />
          </div>
          <span className='font-bold text-gray-900 text-xl'>Credentials</span>
        </div>
        {collapsed ? (
          <ChevronDown className='w-5 h-5 text-gray-400' />
        ) : (
          <ChevronUp className='w-5 h-5 text-gray-400' />
        )}
      </button>

      {!collapsed && (
        <>
          {/* Profile Completion — single row */}
          <div className='flex items-center gap-3'>
            <span className='text-sm text-gray-500 shrink-0'>Profile Completion</span>
            <div className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className='h-2 bg-primary rounded-full transition-all duration-500'
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className='text-sm font-bold text-gray-900 shrink-0'>
              {completion}%
            </span>
          </div>

          {/* Credential cards — scrollable */}
          <div
            className='flex flex-col overflow-y-auto pr-1'
            style={{ gap: 20, maxHeight: 480 }}
          >
            {REQUIRED_CREDENTIALS.map((cred) => {
              const doc = uploadedByType[cred.key];
              const isReviewed = doc?.reviewStatus === 'approved';

              return (
                <div
                  key={cred.key}
                  className='flex flex-col rounded-2xl overflow-hidden'
                  style={{ backgroundColor: '#F5F6F7', gap: 12, padding: '16px 16px 20px' }}
                >
                  {doc ? (
                    /* Uploaded state */
                    <>
                      <div
                        className='flex items-center justify-between rounded-xl px-4 py-3'
                        style={{
                          backgroundColor: isReviewed ? '#fff' : '#fff',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <div className='flex items-center gap-2'>
                          <CheckCircle2
                            className='w-5 h-5 shrink-0'
                            style={{ color: isReviewed ? '#1A7A3C' : '#9CA3AF' }}
                          />
                          <span
                            className='text-sm font-medium'
                            style={{ color: isReviewed ? '#1A7A3C' : '#6B7280' }}
                          >
                            {isReviewed ? 'Reviewed' : 'Pending review'}
                          </span>
                        </div>
                        {isReviewed && doc.reviewedAt && (
                          <span className='text-xs text-gray-400'>
                            {formatDate(doc.reviewedAt)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className='font-bold text-gray-900 text-sm'>{cred.label}</p>
                        <p className='text-xs text-gray-400 truncate'>{doc.title}</p>
                      </div>
                    </>
                  ) : (
                    /* Not uploaded state */
                    <>
                      <div>
                        <p className='font-bold text-gray-900 text-sm'>{cred.label}</p>
                        <p className='text-xs text-gray-400'>{cred.hint}</p>
                      </div>
                      <UploadDocumentModal
                        category={cred.category}
                        documentType={cred.key}
                        defaultTitle={cred.defaultTitle}
                      >
                        <Button
                          variant='outline'
                          className='w-fit gap-2 rounded-xl border-gray-300 bg-white text-gray-800 hover:border-primary hover:text-primary text-sm h-10 px-4'
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
                className='flex flex-col rounded-2xl overflow-hidden'
                style={{ backgroundColor: '#F5F6F7', gap: 12, padding: 16 }}
              >
                <div
                  className='flex items-center justify-between rounded-xl px-4 py-3'
                  style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
                >
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='w-5 h-5 text-primary shrink-0' />
                    <span className='text-sm font-medium text-primary'>Reviewed</span>
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
        </>
      )}
    </div>
  );
};

export default CredentialsPanel;
