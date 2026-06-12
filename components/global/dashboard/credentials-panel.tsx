'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, CloudUpload, RefreshCw, Trash2, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UploadDocumentModal from './upload-document-modal';
import RemoveCredentialDialog from './remove-credential-dialog';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useUserContext } from '@/lib/contexts';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  rejectionReason?: string;
}

// SCRUM-60: 5-credential list with role-driven label resolved at view time.
const HINT_BY_CATEGORY: Record<string, string> = {
  non_medical: 'jpeg, png, pdf formats, up to 2MB.',
  medical: 'doc or pdf formats, up to 5MB.',
};

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
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; docId: string | null; label: string }>({ open: false, docId: null, label: '' });
  const [removeLoading, setRemoveLoading] = useState(false);
  const [updateModal, setUpdateModal] = useState<{ open: boolean; cred: any; doc: any } | null>(null);
  const { user } = useUserContext();
  const { data: documents, refetch } = useDocuments();
  const queryClient = useQueryClient();

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

  const handleRemove = async () => {
    if (!removeDialog.docId) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/user/document-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: removeDialog.docId }),
      });
      const data = await res.json();
      if (data.status === 200 || res.ok) {
        toast.success('Credential removed successfully');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['credentialStatus'] });
      } else {
        toast.error(data.message || 'Failed to remove credential');
      }
    } catch {
      toast.error('Failed to remove credential');
    } finally {
      setRemoveLoading(false);
      setRemoveDialog({ open: false, docId: null, label: '' });
    }
  };

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
            className='flex flex-col overflow-y-auto scrollbar-thin'
            style={{ gap: 12, maxHeight: 480, scrollbarWidth: 'thin', scrollbarColor: '#000 transparent', marginRight: -16, paddingRight: 16 }}
          >
            {requiredCredentials.map((cred) => {
              const doc = uploadedByType[cred.key];
              const isReviewed = doc?.reviewStatus === 'approved';
              const isRejected = doc?.reviewStatus === 'rejected';
              const isPending = doc && !isReviewed && !isRejected;

              return (
                <div
                  key={cred.key}
                  className='flex flex-col rounded-2xl'
                  style={{ backgroundColor: isRejected ? '#FEF2F2' : '#F5F6F7', gap: 12, padding: '16px 16px 24px' }}
                >
                  {doc ? (
                    /* Uploaded state */
                    <>
                      <div
                        className='flex items-center justify-between rounded-xl px-4 py-3'
                        style={{
                          backgroundColor: '#fff',
                          border: `1px solid ${isRejected ? '#FECACA' : '#E5E7EB'}`,
                        }}
                      >
                        <div className='flex items-center gap-2'>
                          {isReviewed ? (
                            <span className='w-5 h-5 rounded-full bg-[#1A7A3C] flex items-center justify-center shrink-0'>
                              <svg width='11' height='8' viewBox='0 0 11 8' fill='none'>
                                <path d='M1 3.5L4 6.5L10 1' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/>
                              </svg>
                            </span>
                          ) : isRejected ? (
                            <AlertCircle className='w-5 h-5 text-red-500 shrink-0' />
                          ) : (
                            <span className='w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0'>
                              <svg width='11' height='8' viewBox='0 0 11 8' fill='none'>
                                <path d='M1 3.5L4 6.5L10 1' stroke='#9CA3AF' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/>
                              </svg>
                            </span>
                          )}
                          <span
                            className='text-sm font-medium'
                            style={{ color: isReviewed ? '#1A7A3C' : isRejected ? '#DC2626' : '#6B7280' }}
                          >
                            {isReviewed ? 'Reviewed' : isRejected ? 'Rejected' : 'Pending review'}
                          </span>
                        </div>
                        {isReviewed && doc.reviewedAt && (
                          <span className='text-xs text-gray-400'>
                            {formatDate(doc.reviewedAt)}
                          </span>
                        )}
                      </div>
                      {/* Rejection reason */}
                      {isRejected && doc.rejectionReason && (
                        <p className='text-xs text-red-500 px-1'>
                          Reason: {doc.rejectionReason}
                        </p>
                      )}
                      <div>
                        <p className='font-bold text-gray-900 text-sm mb-1'>{cred.label}</p>
                        <p className='text-xs text-gray-400 truncate mb-0.5'>{doc.title}</p>
                      </div>
                      {/* Action buttons for uploaded credentials */}
                      <div className='flex items-center gap-2'>
                        {/* View */}
                        <a href={doc.url} target='_blank' rel='noopener noreferrer' className='flex-1'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full gap-2 rounded-xl border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary text-xs h-9'
                          >
                            <Eye className='w-3.5 h-3.5' />
                            View
                          </Button>
                        </a>
                        {/* Update */}
                        <UploadDocumentModal
                          category={cred.category}
                          documentType={cred.key}
                          defaultTitle={cred.defaultTitle}
                          document={doc as any}
                          open={updateModal?.cred?.key === cred.key ? updateModal.open : undefined}
                          onOpenChange={(open) => {
                            if (!open) {
                              setUpdateModal(null);
                              refetch();
                              queryClient.invalidateQueries({ queryKey: ['credentialStatus'] });
                            }
                          }}
                        >
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1 gap-2 rounded-xl border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-600 text-xs h-9'
                          >
                            <RefreshCw className='w-3.5 h-3.5' />
                            Update
                          </Button>
                        </UploadDocumentModal>
                        {/* Remove */}
                        <Button
                          variant='outline'
                          size='sm'
                          className='flex-1 gap-2 rounded-xl border-gray-300 bg-white text-red-500 hover:border-red-400 hover:text-red-600 text-xs h-9'
                          onClick={() => setRemoveDialog({ open: true, docId: doc._id, label: cred.label })}
                        >
                          <Trash2 className='w-3.5 h-3.5' />
                          Remove
                        </Button>
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
                className='flex flex-col rounded-2xl'
                style={{ backgroundColor: '#F5F6F7', gap: 12, padding: '16px 16px 24px' }}
              >
                <div
                  className='flex items-center justify-between rounded-xl px-4 py-3'
                  style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
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
        </>
      )}

      {/* Remove confirmation dialog */}
      <RemoveCredentialDialog
        open={removeDialog.open}
        onOpenChange={(open) => setRemoveDialog({ open, docId: removeDialog.docId, label: removeDialog.label })}
        credentialName={removeDialog.label}
        onConfirm={handleRemove}
        loading={removeLoading}
      />
    </div>
  );
};

export default CredentialsPanel;
