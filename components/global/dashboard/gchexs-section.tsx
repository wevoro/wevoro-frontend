'use client';
import React, { useState, useEffect } from 'react';
import GchexsFlag from './gchexs-flag';
import GchexsEditModal from './gchexs-edit-modal';
import { useUserContext } from '@/lib/contexts';
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
  const data = userData || user;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [gchexsStatus, setGchexsStatus] = useState<GchexsStatus>('not_set');
  const [gchexsDocUrl, setGchexsDocUrl] = useState<string | undefined>();

  useEffect(() => {
    if (data?.professionalInfo?.gchexsStatus) {
      setGchexsStatus(data.professionalInfo.gchexsStatus);
      setGchexsDocUrl(data.professionalInfo.gchexsDocumentUrl);
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
        formData.append('isPublic', 'true');
        formData.append('consent', 'true');

        const uploadResponse = await fetch('/api/document/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
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
      }
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className='mt-2'>
      <GchexsFlag
        status={gchexsStatus}
        documentUrl={gchexsStatus === 'yes' ? gchexsDocUrl : undefined}
        isEditable={isEditable}
        onEdit={() => setIsEditModalOpen(true)}
        showPrompt={isEditable && gchexsStatus === 'not_set'}
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
