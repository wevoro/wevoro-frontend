'use client';

import React, { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle2, Upload } from 'lucide-react';
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
  category: string;
  documentType: string;
}

const REQUIRED_CREDENTIALS = [
  {
    key: 'driver_license',
    category: 'non_medical',
    label: "Driver's License",
    hint: 'jpeg, png, pdf formats, up to 2MB.',
  },
  {
    key: 'tb_tests',
    category: 'medical',
    label: 'TB Test',
    hint: 'jpeg, png, pdf formats, up to 2MB.',
  },
];

function formatDate(dateStr: string) {
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

  // Build the display list:
  // - Driver's License slot (uploaded or empty)
  // - Any extra uploaded docs (not in the required list)
  // - TB Test slot (uploaded or empty)
  const requiredKeys = REQUIRED_CREDENTIALS.map((c) => c.key);
  const extraDocs = (documents ?? []).filter(
    (doc: Document) => !requiredKeys.includes(doc.documentType),
  );

  return (
    <div className='fixed bottom-8 right-6 z-40 w-[320px] rounded-2xl border border-yellow-400 bg-white shadow-xl overflow-hidden'>
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className='w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors'
      >
        <div className='flex items-center gap-3'>
          <span className='w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shrink-0'>
            W
          </span>
          <span className='font-bold text-gray-900 text-lg'>Credentials</span>
        </div>
        {collapsed ? (
          <ChevronDown className='w-5 h-5 text-gray-400' />
        ) : (
          <ChevronUp className='w-5 h-5 text-gray-400' />
        )}
      </button>

      {!collapsed && (
        <div className='flex flex-col gap-0'>
          {/* Profile Completion */}
          <div className='px-5 py-4 border-b border-gray-100'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm text-gray-500'>Profile Completion</span>
              <span className='text-sm font-semibold text-gray-800'>
                {completion}%
              </span>
            </div>
            <div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
              <div
                className='h-2 bg-primary rounded-full transition-all duration-500'
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {/* Required credential: Driver's License */}
          <CredentialRow
            credential={REQUIRED_CREDENTIALS[0]}
            uploaded={uploadedByType['driver_license']}
          />

          {/* Extra uploaded docs */}
          {extraDocs.map((doc: Document) => (
            <UploadedDocRow key={doc._id} doc={doc} />
          ))}

          {/* Required credential: TB Test */}
          <CredentialRow
            credential={REQUIRED_CREDENTIALS[1]}
            uploaded={uploadedByType['tb_tests']}
          />
        </div>
      )}
    </div>
  );
};

function CredentialRow({
  credential,
  uploaded,
}: {
  credential: (typeof REQUIRED_CREDENTIALS)[number];
  uploaded?: Document;
}) {
  return (
    <div className='px-5 py-4 border-b border-gray-100 last:border-b-0'>
      {uploaded ? (
        <UploadedDocRow doc={uploaded} label={credential.label} />
      ) : (
        <div className='flex flex-col gap-3'>
          <div>
            <p className='font-semibold text-gray-900 text-sm'>
              {credential.label}
            </p>
            <p className='text-xs text-gray-400'>{credential.hint}</p>
          </div>
          <UploadDocumentModal category={credential.category}>
            <Button
              variant='outline'
              size='sm'
              className='w-fit border-gray-200 text-gray-700 rounded-xl gap-2 hover:border-primary hover:text-primary'
            >
              <Upload className='w-4 h-4' />
              Upload
            </Button>
          </UploadDocumentModal>
        </div>
      )}
    </div>
  );
}

function UploadedDocRow({
  doc,
  label,
}: {
  doc: Document;
  label?: string;
}) {
  return (
    <div className='px-5 py-4 border-b border-gray-100 last:border-b-0'>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2'>
          <CheckCircle2 className='w-4 h-4 text-primary shrink-0' />
          <span className='text-xs font-medium text-primary'>Reviewed</span>
        </div>
        <span className='text-xs text-gray-400'>{formatDate(doc.updatedAt)}</span>
      </div>
      <p className='font-semibold text-gray-900 text-sm'>
        {label ?? doc.title}
      </p>
      <p className='text-xs text-gray-400 truncate'>{doc.title}</p>
    </div>
  );
}

export default CredentialsPanel;
