'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Clock, Upload } from 'lucide-react';
import UploadDocumentModal from './upload-document-modal';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useUserContext } from '@/lib/contexts';
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
}: CredentialRowProps) {
  const { data: documents } = useDocuments();
  const doc = (documents ?? []).find((d: any) => d.documentType === documentType);
  const status = getDocStatus(doc);

  return (
    <div className='w-full border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4'>
      <div className='flex items-center gap-4 min-w-0'>
        {/* Status icon */}
        <div className='shrink-0'>
          {status === 'none' && (
            <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center'>
              <Upload className='w-4 h-4 text-gray-400' />
            </div>
          )}
          {status === 'pending' && (
            <div className='w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center'>
              <Clock className='w-5 h-5 text-amber-500' />
            </div>
          )}
          {status === 'approved' && (
            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
              <CheckCircle2 className='w-5 h-5 text-primary' />
            </div>
          )}
          {status === 'rejected' && (
            <div className='w-10 h-10 rounded-full bg-red-50 flex items-center justify-center'>
              <CheckCircle2 className='w-5 h-5 text-red-400' />
            </div>
          )}
        </div>

        <div className='min-w-0'>
          <p className='font-semibold text-gray-900'>{label}</p>
          <p className='text-sm text-gray-400'>{hint}</p>
          {status === 'pending' && (
            <span className='inline-block mt-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5'>
              Pending review
            </span>
          )}
          {status === 'approved' && (
            <span className='inline-block mt-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5'>
              Reviewed ✓
            </span>
          )}
          {status === 'rejected' && (
            <span className='inline-block mt-1 text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-full px-2 py-0.5'>
              Rejected — please re-upload
            </span>
          )}
        </div>
      </div>

      {/* Upload button always available so user can re-upload */}
      <UploadDocumentModal
        category={category}
        documentType={documentType}
        defaultTitle={defaultTitle}
        document={status !== 'none' ? doc : undefined}
      >
        <Button
          variant='outline'
          className='border-primary text-primary rounded-xl hover:bg-primary/5 gap-2 shrink-0'
        >
          <Upload className='w-4 h-4' />
          {status === 'none' ? 'Upload' : 'Update'}
        </Button>
      </UploadDocumentModal>
    </div>
  );
}

/**
 * SCRUM-60: Renders all 5 required credential rows with role-driven labels.
 */
function RequiredCredentialRows() {
  const { user } = useUserContext();
  const role = user?.professionalInfo?.role;
  return (
    <>
      {REQUIRED_CREDENTIALS_BASE.map((c) => {
        const label = getCredentialLabel(c, role);
        const hint =
          c.category === 'medical'
            ? 'doc or pdf formats, up to 5MB.'
            : 'jpeg, png, pdf formats, up to 2MB.';
        return (
          <CredentialRow
            key={c.key}
            label={label}
            hint={hint}
            category={c.category}
            documentType={c.documentType}
            defaultTitle={label}
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
      <DialogContent
        className='sm:max-w-[600px] p-8 rounded-2xl'
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className='flex flex-col items-center gap-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900'>
              Completing Profile
            </h2>
            <p className='text-gray-500 mt-2'>
              Please upload the below credentials to complete your profile
            </p>
          </div>

          <div className='w-full flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-full px-5 py-3'>
            <AlertTriangle className='w-5 h-5 text-amber-500 shrink-0' />
            <span className='text-amber-600 font-medium text-sm'>
              Important: Your profile is not visible for the employers
            </span>
          </div>

          <RequiredCredentialRows />

          {/* legacy direct rows removed — list is now driven by REQUIRED_CREDENTIALS_BASE */}

          <div className='w-full'>
            <Button
              variant='outline'
              onClick={onClose}
              className='w-full h-14 font-semibold text-lg rounded-xl border-gray-200'
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
