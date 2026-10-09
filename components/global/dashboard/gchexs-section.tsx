'use client';
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import GchexsFlag from './gchexs-flag';
import GchexsEditModal from './gchexs-edit-modal';
import Title from '../title';
import { useUserContext } from '@/lib/contexts';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import type { GchexsStatus } from '@/app/types/types';

interface GchexsSectionProps {
  /** If true, allows editing (pro view). If false, read-only (partner/admin view). */
  isEditable?: boolean;
  /** Override user data (for partner/admin view of another user) */
  userData?: any;
}

/**
 * SCRUM-66: GCHEXS Background Check Section
 * Wraps the GchexsFlag with edit modal and data fetching
 */
const GchexsSection: React.FC<GchexsSectionProps> = ({
  isEditable = false,
  userData,
}) => {
  const { user, refetchUser } = useUserContext();
  const queryClient = useQueryClient();
  const data = userData || user;
  /**
   * SCRUM-193: the GCHEXS Confirmation is one document per caregiver
   * (SCRUM-145/146), and the only thing that can approve it is the admin's
   * background-check decision (SCRUM-151 — it is not in the admin Credentials
   * list). Its reviewStatus is what the Credentials widget on this page prints,
   * so the section reads the same row rather than showing the caregiver's own
   * answer as a finished check.
   *
   * Owner view only: the agency/admin view is handed a `userData` object that
   * carries no documents, and this hook returns the SIGNED-IN user's. The
   * dashboard layout already runs the same query, so this costs no extra
   * request.
   */
  const { data: ownDocuments } = useDocuments();
  const gchexsReviewStatus: 'pending' | 'approved' | 'rejected' | undefined =
    userData
      ? undefined
      : (ownDocuments as any[] | undefined)?.find(
          (doc: any) => doc?.documentType === 'gchexs',
        )?.reviewStatus;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [gchexsStatus, setGchexsStatus] = useState<GchexsStatus>('not_set');
  const [gchexsDocUrl, setGchexsDocUrl] = useState<string | undefined>();
  const [gchexsUpdatedAt, setGchexsUpdatedAt] = useState<string | undefined>();

  useEffect(() => {
    if (data?.professionalInfo?.gchexsStatus) {
      setGchexsStatus(data.professionalInfo.gchexsStatus);
      setGchexsDocUrl(data.professionalInfo.gchexsDocumentUrl);
      setGchexsUpdatedAt(data.professionalInfo.gchexsUpdatedAt);
    }
  }, [data]);

  const handleSave = async (status: 'yes' | 'no', file?: File) => {
    try {
      let docUrl = gchexsDocUrl;
      let docFileId = undefined;

      // If there's a file, upload it first via the document upload endpoint
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'gchexs');
        formData.append('documentType', 'gchexs');
        formData.append('title', 'GCHEXS Confirmation');
        // SCRUM-177: the Private toggle is gone; every upload is sent as
        // 'true'. The field stays on the wire because
        // /api/user/document-upload appends isPublic unconditionally — left
        // out it would reach the backend as the string "null".
        formData.append('isPublic', 'true');
        formData.append('consent', 'true');
        // SCRUM-145/146: replace the caregiver's existing GCHEXS document
        // rather than add another one. (The server also enforces this.)
        const existingId = data?.professionalInfo?.gchexsDocumentFileId;
        if (existingId) formData.append('documentId', existingId);

        const uploadResponse = await fetch('/api/user/document-upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (uploadData.status === 200 || uploadData.success) {
          docUrl = uploadData.data?.url;
          docFileId = uploadData.data?._id;
        }
      }

      // Update GCHEXS status
      const response = await fetch('/api/user/gchexs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gchexsStatus: status,
          gchexsDocumentUrl: docUrl,
          gchexsDocumentFileId: docFileId,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setGchexsStatus(status);
        if (status === 'yes' && docUrl) setGchexsDocUrl(docUrl);
        if (refetchUser) refetchUser();
        // SCRUM-148: the file also lands in the Documents list and in the
        // credential status, and both are cached. Without this the caregiver
        // kept seeing the file they just replaced until they reloaded the page.
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['credentialStatus'], refetchType: 'all' });
      }
    } catch (err) {
      throw err;
    }
  };

  // The unanswered state is now a card that carries its own "Background check"
  // heading, so the section heading would be the same words twice.
  const showPrompt = isEditable && gchexsStatus === 'not_set';

  return (
    <div className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
      {!showPrompt && (
        <Title text='Background check' className='mb-2 !text-lg md:!text-2xl' />
      )}
      <GchexsFlag
        status={gchexsStatus}
        documentUrl={gchexsStatus === 'yes' ? gchexsDocUrl : undefined}
        completedAt={gchexsUpdatedAt}
        reviewStatus={gchexsStatus === 'yes' ? gchexsReviewStatus : undefined}
        isEditable={isEditable}
        onEdit={() => setIsEditModalOpen(true)}
        showPrompt={showPrompt}
      />
      {isEditable && (
        <GchexsEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentStatus={gchexsStatus}
          currentDocUrl={gchexsDocUrl}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default GchexsSection;
