'use client';

import React, { useEffect, useState } from 'react';
import { Check, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getUserDocuments } from '@/app/actions';
import AdminVerifyModal from './admin-verify-modal';

interface Document {
  _id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  category: string;
  documentType: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  credentialIdNumber?: string;
  credentialIssueDate?: string;
  credentialExpirationDate?: string;
  issuingOrganization?: string;
}

const CREDENTIAL_SLOTS = [
  { key: 'certifications', label: 'CNA Certificate', category: 'non_medical' },
  { key: 'driver_license', label: "Driver's License", category: 'non_medical' },
  { key: 'auto_insurance', label: 'Auto Insurance', category: 'non_medical' },
  { key: 'cpr_test', label: 'CPR Test', category: 'medical' },
  { key: 'tb_tests', label: 'TB Test', category: 'medical' },
];

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBytes(url: string) {
  return '';
}

function getFileExtension(url: string) {
  return url?.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'FILE';
}

function getFilename(url: string, title: string) {
  const fromUrl = url?.split('/').pop()?.split('?')[0];
  return fromUrl || title || 'Document';
}

interface CredentialRowProps {
  label: string;
  doc: Document | undefined;
  onReview: (id: string, status: 'approved' | 'rejected') => void;
  onApproveClick: (id: string, label: string, doc: Document) => void;
  loading: string | null;
}

function CredentialRow({ label, doc, onReview, onApproveClick, loading }: CredentialRowProps) {
  const isApproved = doc?.reviewStatus === 'approved';
  const isRejected = doc?.reviewStatus === 'rejected';
  const isPending = doc && doc.reviewStatus === 'pending';
  const isEmpty = !doc;

  return (
    <div className='flex flex-col gap-3 py-4 border-b border-gray-100 last:border-0'>
      {/* Row header */}
      <div className='flex items-center justify-between'>
        <span className='font-semibold text-gray-900 text-sm'>{label}</span>
        <div className='flex items-center gap-2'>
          {isApproved ? (
            <div className='flex items-center gap-2'>
              <Check className='w-4 h-4 text-primary' />
              <span className='text-xs text-primary font-medium'>Reviewed</span>
              {doc?.reviewedAt && (
                <span className='text-xs text-gray-400'>
                  {formatDate(doc.reviewedAt)}
                </span>
              )}
            </div>
          ) : (
            <>
              <button
                disabled={isEmpty || loading === doc?._id}
                onClick={() => doc && onApproveClick(doc._id, label, doc)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isEmpty
                    ? 'text-gray-200 cursor-not-allowed'
                    : 'text-green-500 hover:bg-green-50 cursor-pointer'
                }`}
              >
                <Check className='w-4 h-4' />
              </button>
              <button
                disabled={isEmpty || loading === doc?._id}
                onClick={() => doc && onReview(doc._id, 'rejected')}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isEmpty
                    ? 'text-gray-200 cursor-not-allowed'
                    : 'text-red-400 hover:bg-red-50 cursor-pointer'
                }`}
              >
                <X className='w-4 h-4' />
              </button>
            </>
          )}
        </div>
      </div>

      {/* File card */}
      <div
        className={`flex items-center gap-3 rounded-xl p-3 ${isEmpty ? 'bg-gray-50' : 'bg-gray-50'}`}
      >
        {!isEmpty ? (
          <>
            <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0'>
              <span className='text-[10px] font-bold text-red-600'>
                {getFileExtension(doc!.url)}
              </span>
            </div>
            <div className='min-w-0 w-0 flex-1'>
              <p className='text-sm font-medium text-gray-900 truncate max-w-[160px]'>
                {getFilename(doc!.url, doc!.title)}
              </p>
              {isRejected && (
                <p className='text-xs text-red-500 font-medium'>Rejected</p>
              )}
            </div>
            <a
              href={doc!.url}
              target='_blank'
              rel='noopener noreferrer'
              className='shrink-0'
            >
              <Button
                variant='outline'
                size='sm'
                className='gap-1 text-xs rounded-lg h-8'
              >
                View
                <ArrowUpRight className='w-3 h-3' />
              </Button>
            </a>
          </>
        ) : (
          <>
            <div className='flex-1'>
              <p className='text-sm text-gray-400'>No file attached.</p>
            </div>
            <Button
              variant='outline'
              size='sm'
              disabled
              className='gap-1 text-xs rounded-lg h-8 opacity-40'
            >
              View
              <ArrowUpRight className='w-3 h-3' />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface AdminCredentialsProps {
  userId: string;
}

const AdminCredentials: React.FC<AdminCredentialsProps> = ({ userId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [verifyModal, setVerifyModal] = useState<{
    open: boolean;
    docId: string;
    label: string;
    existingData?: {
      credentialIdNumber?: string;
      credentialIssueDate?: string;
      credentialExpirationDate?: string;
      issuingOrganization?: string;
    };
  }>({ open: false, docId: '', label: '' });

  useEffect(() => {
    if (!userId) return;
    getUserDocuments(userId).then((docs) => {
      if (docs) setDocuments(docs);
    });
  }, [userId]);

  const docsByType: Record<string, Document> = {};
  documents.forEach((doc) => {
    docsByType[doc.documentType] = doc;
  });

  // Show only slots that have uploads OR are key credential types
  const slotsToShow = CREDENTIAL_SLOTS.filter(
    (slot) =>
      !!docsByType[slot.key] ||
      ['driver_license', 'tb_tests', 'certifications'].includes(slot.key)
  );

  // Also include any uploaded docs not in the fixed slot list
  const extraDocs = documents.filter(
    (doc) => !CREDENTIAL_SLOTS.find((s) => s.key === doc.documentType)
  );

  const handleApproveClick = (docId: string, label: string, doc: Document) => {
    setVerifyModal({
      open: true,
      docId,
      label,
      existingData: {
        credentialIdNumber: doc.credentialIdNumber,
        credentialIssueDate: doc.credentialIssueDate,
        credentialExpirationDate: doc.credentialExpirationDate,
        issuingOrganization: doc.issuingOrganization,
      },
    });
  };

  const handleVerifySuccess = (data: any) => {
    // Update the local documents state with the verified document
    setDocuments((prev) =>
      prev.map((d) =>
        d._id === verifyModal.docId
          ? {
              ...d,
              reviewStatus: 'approved' as const,
              reviewedAt: new Date().toISOString(),
              credentialIdNumber: data?.credentialIdNumber || d.credentialIdNumber,
              credentialIssueDate: data?.credentialIssueDate || d.credentialIssueDate,
              credentialExpirationDate: data?.credentialExpirationDate || d.credentialExpirationDate,
              issuingOrganization: data?.issuingOrganization || d.issuingOrganization,
            }
          : d
      )
    );
  };

  const handleReview = async (
    docId: string,
    reviewStatus: 'approved' | 'rejected'
  ) => {
    setLoading(docId);
    try {
      const res = await fetch('/api/admin/document-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, reviewStatus }),
      });
      const data = await res.json();
      if (data.status === 200) {
        toast.success(`Document ${reviewStatus}`);
        setDocuments((prev) =>
          prev.map((d) =>
            d._id === docId
              ? {
                  ...d,
                  reviewStatus,
                  reviewedAt:
                    reviewStatus === 'approved'
                      ? new Date().toISOString()
                      : d.reviewedAt,
                }
              : d
          )
        );
      } else {
        toast.error(data.message || 'Review failed');
      }
    } catch {
      toast.error('Review failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <h2 className='text-lg font-semibold text-gray-900'>Credentials</h2>
      <div className='border border-gray-200 rounded-2xl px-5 py-2'>
        {slotsToShow.map((slot) => (
          <CredentialRow
            key={slot.key}
            label={slot.label}
            doc={docsByType[slot.key]}
            onReview={handleReview}
            onApproveClick={handleApproveClick}
            loading={loading}
          />
        ))}
        {extraDocs.map((doc) => (
          <CredentialRow
            key={doc._id}
            label={doc.title}
            doc={doc}
            onReview={handleReview}
            onApproveClick={handleApproveClick}
            loading={loading}
          />
        ))}
        {slotsToShow.length === 0 && extraDocs.length === 0 && (
          <p className='py-6 text-sm text-gray-400 text-center'>
            No credentials uploaded yet.
          </p>
        )}
      </div>

      {/* Admin Verify Modal */}
      <AdminVerifyModal
        open={verifyModal.open}
        onOpenChange={(open) => setVerifyModal((prev) => ({ ...prev, open }))}
        documentId={verifyModal.docId}
        credentialLabel={verifyModal.label}
        existingData={verifyModal.existingData}
        onSuccess={handleVerifySuccess}
      />
    </div>
  );
};

export default AdminCredentials;
