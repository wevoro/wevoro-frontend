'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';
import { useCredentialStatus } from '@/app/apiHooks/useCredentialStatus';
import { useUserContext } from '@/lib/contexts';
import CredentialStatusCard from './credential-status-card';
import RemoveCredentialDialog from './remove-credential-dialog';
import UploadDocumentModal from './upload-document-modal';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { CredentialStatus } from '@/lib/credential-config';

const CredentialStatusSection: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; credential: CredentialStatus | null }>({ open: false, credential: null });
  const [removeLoading, setRemoveLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; credential: CredentialStatus | null }>({ open: false, credential: null });
  const { user } = useUserContext();
  const { data: credentials, refetch } = useCredentialStatus(user?._id);
  const queryClient = useQueryClient();

  // Show ALL uploaded credentials (verified, pending, rejected) — not just verified
  const uploadedCredentials = (credentials ?? []).filter(
    (c: CredentialStatus) => c.state !== 'not_uploaded'
  );
  const verifiedCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'verified').length;
  const pendingCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'pending').length;
  const rejectedCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'rejected').length;

  if (uploadedCredentials.length === 0) return null;

  const handleRemove = async () => {
    if (!removeDialog.credential?.document?._id) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/user/document-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: removeDialog.credential.document._id }),
      });
      const data = await res.json();
      if (data.status === 200 || res.ok) {
        toast.success('Credential removed successfully');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast.error(data.message || 'Failed to remove credential');
      }
    } catch {
      toast.error('Failed to remove credential');
    } finally {
      setRemoveLoading(false);
      setRemoveDialog({ open: false, credential: null });
    }
  };

  return (
    // BUG-05: White background container matching Personal/Professional Information sections
    <div className='bg-white md:rounded-2xl px-4 p-6 md:p-8'>
      <div className='flex flex-col gap-4'>
        {/* BUG-06: Section header — font size matches other section headings */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className='flex items-center justify-between w-full group border-b pb-4'
        >
          <div className='flex items-center gap-2 flex-wrap'>
            <h2 className='text-lg md:text-2xl font-semibold text-tertiary'>
              Credentials Status
            </h2>
            <div className='flex items-center gap-1.5'>
              {verifiedCount > 0 && (
                <span className='text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium'>
                  {verifiedCount} verified
                </span>
              )}
              {pendingCount > 0 && (
                <span className='text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium'>
                  {pendingCount} pending
                </span>
              )}
              {rejectedCount > 0 && (
                <span className='text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium'>
                  {rejectedCount} rejected
                </span>
              )}
            </div>
          </div>
          {collapsed ? (
            <ChevronDown className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          ) : (
            <ChevronUp className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          )}
        </button>

        {!collapsed && (
          <div className='grid gap-4'>
            {uploadedCredentials.map((cred: CredentialStatus, idx: number) => (
              <CredentialStatusCard
                key={cred.key}
                credential={cred}
                index={idx}
                onUpdateVerification={() => setUploadModal({ open: true, credential: cred })}
                onRemove={() => setRemoveDialog({ open: true, credential: cred })}
              />
            ))}
          </div>
        )}

        {/* Remove confirmation dialog */}
        <RemoveCredentialDialog
          open={removeDialog.open}
          onOpenChange={(open) => setRemoveDialog({ open, credential: removeDialog.credential })}
          credentialName={removeDialog.credential?.label || ''}
          onConfirm={handleRemove}
          loading={removeLoading}
        />

        {/* Upload modal for Update Verification */}
        {uploadModal.open && uploadModal.credential && (
          <UploadDocumentModal
            category={uploadModal.credential.category}
            documentType={uploadModal.credential.key}
            defaultTitle={uploadModal.credential.label}
            document={uploadModal.credential.document as any}
            open={uploadModal.open}
            onOpenChange={(open) => {
              if (!open) {
                setUploadModal({ open: false, credential: null });
                refetch();
                queryClient.invalidateQueries({ queryKey: ['documents'] });
              }
            }}
          >
            <span />
          </UploadDocumentModal>
        )}
      </div>
    </div>
  );
};

export default CredentialStatusSection;
