'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Clock, Upload, XCircle } from 'lucide-react';
import UploadDocumentModal from './upload-document-modal';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useUserContext } from '@/lib/contexts';
import { MAX_UPLOAD_MB } from '@/utils/download';
import {
  REQUIRED_CREDENTIALS as REQUIRED_CREDENTIALS_BASE,
  getCredentialLabel,
} from '@/lib/credential-config';

interface CompleteProfileModalProps {
  open: boolean;
  onClose: () => void;
}

interface CredentialRowProps {
  label: string;
  hint: string;
  category: string;
  documentType: string;
  defaultTitle: string;
  accept?: string;
  rejectionReason?: string;
}

function getDocStatus(doc: any): 'none' | 'pending' | 'approved' | 'rejected' {
  if (!doc) return 'none';
  return doc.reviewStatus ?? 'pending';
}

function CredentialRow({
  label,
  hint,
  category,
  documentType,
  defaultTitle,
  rejectionReason,
}: CredentialRowProps) {
  const { data: documents } = useDocuments();
  const doc = (documents ?? []).find((d: any) => d.documentType === documentType);
  const status = getDocStatus(doc);

  // BUG-03: Only show credentials that require action
  // NOT UPLOADED → show with Upload CTA
  // REJECTED → show with rejection reason and Re-Upload CTA
  // PENDING / VERIFIED → do NOT show
  if (status === 'pending' || status === 'approved') return null;

  return (
    <div className='w-full border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
      <div className='flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto'>
        {/* Status icon */}
        <div className='shrink-0'>
          {status === 'none' && (
            <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center'>
              <Upload className='w-4 h-4 text-gray-400' />
            </div>
          )}
          {status === 'rejected' && (
            <div className='w-10 h-10 rounded-full bg-red-50 flex items-center justify-center'>
              <XCircle className='w-5 h-5 text-red-400' />
            </div>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <p className='font-semibold text-gray-900 text-sm sm:text-base'>{label}</p>
          <p className='text-xs sm:text-sm text-gray-400'>{hint}</p>
          {status === 'rejected' && (
            <div className='mt-1'>
              <span className='inline-block text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-full px-2 py-0.5'>
                Rejected — please re-upload
              </span>
              {rejectionReason && (
                <p className='text-xs text-red-500 mt-1'>Reason: {rejectionReason}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload button */}
      <UploadDocumentModal
        category={category}
        documentType={documentType}
        defaultTitle={defaultTitle}
        document={status !== 'none' ? doc : undefined}
      >
        <Button
          variant='outline'
          className='border-primary text-primary rounded-xl hover:bg-primary/5 gap-2 shrink-0 w-full sm:w-auto'
        >
          <Upload className='w-4 h-4' />
          {status === 'none' ? 'Upload' : 'Re-Upload'}
        </Button>
      </UploadDocumentModal>
    </div>
  );
}

/**
 * SCRUM-60: Renders required credential rows with role-driven labels.
 * BUG-03: Only shows credentials that need action (not_uploaded + rejected).
 */
function RequiredCredentialRows() {
  const { user } = useUserContext();
  const { data: documents } = useDocuments();
  const role = user?.professionalInfo?.role;

  // Check if ALL credentials are verified or pending — if so, return null
  const allHandled = REQUIRED_CREDENTIALS_BASE.every((c) => {
    const doc = (documents ?? []).find((d: any) => d.documentType === c.documentType);
    const status = getDocStatus(doc);
    return status === 'approved' || status === 'pending';
  });

  if (allHandled) return null;

  return (
    <>
      {REQUIRED_CREDENTIALS_BASE.map((c) => {
        const label = getCredentialLabel(c, role);
        // SCRUM-97: sizes track the single enforced limit (isValidFileSize).
        const hint =
          c.category === 'medical'
            ? `doc or pdf formats, up to ${MAX_UPLOAD_MB}MB.`
            : `jpeg, png, pdf formats, up to ${MAX_UPLOAD_MB}MB.`;
        const doc = (documents ?? []).find((d: any) => d.documentType === c.documentType);
        return (
          <CredentialRow
            key={c.key}
            label={label}
            hint={hint}
            category={c.category}
            documentType={c.documentType}
            defaultTitle={label}
            rejectionReason={doc?.rejectionReason}
          />
        );
      })}
    </>
  );
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      {/* BUG-01: Responsive modal — scrollable, X always accessible */}
      <DialogContent
        className='sm:max-w-[600px] p-4 sm:p-6 md:p-8 rounded-2xl max-h-[90vh] overflow-y-auto'
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className='flex flex-col items-center gap-4 sm:gap-6'>
          <div className='text-center'>
            <h2 className='text-xl sm:text-2xl font-bold text-gray-900'>
              Completing Profile
            </h2>
            <p className='text-gray-500 mt-2 text-sm sm:text-base'>
              Please upload the below credentials to complete your profile
            </p>
          </div>

          <div className='w-full flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-full px-4 sm:px-5 py-2.5 sm:py-3'>
            <AlertTriangle className='w-5 h-5 text-amber-500 shrink-0' />
            <span className='text-amber-600 font-medium text-xs sm:text-sm'>
              Important: Your profile is not visible for the employers
            </span>
          </div>

          <RequiredCredentialRows />

          <div className='w-full'>
            <Button
              variant='outline'
              onClick={onClose}
              className='w-full h-12 sm:h-14 font-semibold text-base sm:text-lg rounded-xl border-gray-200'
            >
              Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteProfileModal;
