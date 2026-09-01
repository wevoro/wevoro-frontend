'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';
import { useCredentialStatus } from '@/app/apiHooks/useCredentialStatus';
import { useUserContext } from '@/lib/contexts';
import CredentialStatusCard, { resolveCardStatus } from './credential-status-card';
import RemoveCredentialDialog from './remove-credential-dialog';
import UploadDocumentModal from './upload-document-modal';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { CredentialStatus } from '@/lib/credential-config';

// Design order for this section only — REQUIRED_CREDENTIALS keeps its own order
// because it also drives the upload and completion flows.
const DISPLAY_ORDER = ['certifications', 'cpr_test', 'tb_tests', 'driver_license', 'auto_insurance'];
const displayRank = (key: string) => {
  const i = DISPLAY_ORDER.indexOf(key);
  return i === -1 ? DISPLAY_ORDER.length : i;
};

const CredentialStatusSection: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; credential: CredentialStatus | null }>({ open: false, credential: null });
  const [removeLoading, setRemoveLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; credential: CredentialStatus | null }>({ open: false, credential: null });
  const { user } = useUserContext();
  const { data: credentials, refetch } = useCredentialStatus(user?._id);
  const queryClient = useQueryClient();
  // SCRUM-110: CNA and PCA are mutually exclusive tracks — a PCA profile shows
  // the two-document PCA group, a CNA profile the single certificate card.
  const isPca = (user as any)?.professionalInfo?.role === 'PCA';

  // Show ALL uploaded credentials (verified, pending, rejected) — not just verified
  const uploadedCredentials = (credentials ?? []).filter(
    (c: CredentialStatus) => c.state !== 'not_uploaded'
  );
  const verifiedCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'verified').length;
  const pendingCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'pending').length;
  const rejectedCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'rejected').length;
  const orderedCredentials = [...uploadedCredentials].sort(
    (a: CredentialStatus, b: CredentialStatus) => displayRank(a.key) - displayRank(b.key)
  );

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

  // SCRUM-108: every credential alert email deep-links to #credentials;
  // nothing carried that id, so the CTA dropped the caregiver at the top of
  // the profile instead of on their credentials.
  return (
    // BUG-05: White background container matching Personal/Professional Information sections
    <div id='credentials' className='bg-white md:rounded-2xl px-4 p-6 md:p-8'>
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
            {/* Design: the heading stands alone — each card carries its own
                status, so the confirmed/pending/rejected tally is gone. */}
          </div>
          {collapsed ? (
            <ChevronDown className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          ) : (
            <ChevronUp className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          )}
        </button>

        {!collapsed && (
          <div className='grid gap-4'>
            {orderedCredentials.map((cred: CredentialStatus, idx: number) => {
              const card = (titleOverride?: string) => (
                <CredentialStatusCard
                  credential={cred}
                  index={idx}
                  titleOverride={titleOverride}
                  onUpdateVerification={() => setUploadModal({ open: true, credential: cred })}
                  onRemove={() => setRemoveDialog({ open: true, credential: cred })}
                />
              );

              // SCRUM-110: the certification credential renders inside a titled
              // group whose tint follows the weakest status. PCA carries two
              // documents, CNA one.
              if (cred.key === 'certifications') {
                const status = resolveCardStatus(cred);
                const tint =
                  status === 'confirmed'
                    ? 'border-[#BBF8DC] bg-[#F4FDF8]'
                    : status === 'expiresSoon'
                      ? 'border-[#FCFFDD] bg-[#FFFDF6]'
                      : status === 'expired'
                        ? 'border-[#FCE8E8] bg-[#FEFCFC]'
                        : 'border-[#DFE2E0] bg-white';
                return (
                  <div key={cred.key} className={`rounded-2xl border p-4 ${tint}`}>
                    <h3 className='mb-3 text-lg md:text-2xl font-semibold text-[#1C1C1C]'>
                      {isPca ? 'PCA Certifications' : 'CNA Certification'}
                    </h3>
                    <div className='grid gap-3'>
                      {isPca ? (
                        <>
                          {card('Written Exam (GACCP)')}
                          {card('RN / LPN sign-off')}
                        </>
                      ) : (
                        card('CNA Certification')
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <React.Fragment key={cred.key}>
                  {card(cred.key === 'driver_license' ? 'Driving License' : undefined)}
                </React.Fragment>
              );
            })}
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
