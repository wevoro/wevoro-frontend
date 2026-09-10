'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Info, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import DocumentPreviewModal from '@/components/global/dashboard/document-preview-modal';
import UploadDocumentsModal from './upload-documents-modal';
import ReplaceDocumentModal from './replace-document-modal';
import RemoveDocumentDialog from './remove-document-dialog';
import { formatFileSize } from './format';

// SCRUM-117: 10 documents per role group is a hard cap agreed in the 2026-08-31
// client meeting, so the add affordance closes once a group is full.
const MAX_DOCUMENTS_PER_ROLE = 10;

type Role = 'CNA' | 'PCA';

export interface SigningDoc {
  _id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  version: number;
}

interface Group {
  role: Role;
  documents: SigningDoc[];
  caregiversSent: number;
  fullySigned: number;
}

const emptyGroup = (role: Role): Group => ({
  role,
  documents: [],
  caregiversSent: 0,
  fullySigned: 0,
});

// DOCX is accepted alongside PDF, so the row badge names the actual file type
// rather than hard-coding the PDF label from the mock.
const fileBadge = (fileName: string) => {
  const ext = fileName?.split('.').pop()?.toUpperCase();
  return ext === 'DOC' || ext === 'DOCX' ? 'DOC' : 'PDF';
};

const SigningDocuments: React.FC = () => {
  const [groups, setGroups] = useState<Record<Role, Group>>({
    CNA: emptyGroup('CNA'),
    PCA: emptyGroup('PCA'),
  });
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; role: Role }>({
    open: false,
    role: 'CNA',
  });
  const [replaceModal, setReplaceModal] = useState<{
    open: boolean;
    document: SigningDoc | null;
  }>({ open: false, document: null });
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    document: SigningDoc | null;
  }>({ open: false, document: null });
  const [previewDoc, setPreviewDoc] = useState<SigningDoc | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/esign/documents');
      const result = await response.json();

      if (result.status === 200 && result.data) {
        setGroups({
          CNA: result.data.CNA ?? emptyGroup('CNA'),
          PCA: result.data.PCA ?? emptyGroup('PCA'),
        });
      } else {
        toast.error(result.message || 'Failed to load signing documents');
      }
    } catch {
      toast.error('Failed to load signing documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (loading) return <SigningDocumentsSkeleton />;

  const bothEmpty =
    groups.CNA.documents.length === 0 && groups.PCA.documents.length === 0;

  return (
    <div className='flex flex-col gap-6 px-4 md:px-0'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-bold text-[#1C1C1C]'>Signing documents</h1>
        <p className='text-sm text-[#6C6C6C] max-w-3xl'>
          {bothEmpty
            ? 'Upload the documents caregivers sign when they connect with your agency. You can add more than one document per role — we handle sending, reminders, and tracking automatically.'
            : 'These documents are sent for signature when a caregiver connects with your agency. Add or remove documents anytime.'}
        </p>
      </div>

      {bothEmpty && (
        <div className='flex gap-3 rounded-[12px] bg-[#ECFAF0] p-4'>
          <Info className='size-5 shrink-0 text-[#008000] mt-0.5' />
          <div className='flex flex-col gap-1'>
            <p className='text-sm font-bold text-[#1C1C1C]'>
              What happens after you upload
            </p>
            <p className='text-sm text-[#5E6864]'>
              When a caregiver connects, WeVoro sends all matching documents (CNA
              or PCA) for signature, auto-reminds them by email until every
              document is signed, and notifies you once they&apos;re all
              complete.
            </p>
          </div>
        </div>
      )}

      <div className='grid md:grid-cols-2 gap-5'>
        {(['CNA', 'PCA'] as Role[]).map((role) => (
          <GroupCard
            key={role}
            group={groups[role]}
            onUpload={() => setUploadModal({ open: true, role })}
            onPreview={(document) => setPreviewDoc(document)}
            onReplace={(document) => setReplaceModal({ open: true, document })}
            onRemove={(document) => setRemoveDialog({ open: true, document })}
          />
        ))}
      </div>

      <UploadDocumentsModal
        open={uploadModal.open}
        onOpenChange={(open: boolean) =>
          setUploadModal((state) => ({ ...state, open }))
        }
        role={uploadModal.role}
        existingCount={groups[uploadModal.role].documents.length}
        onUploaded={() => {
          setUploadModal((state) => ({ ...state, open: false }));
          fetchDocuments();
        }}
      />

      {replaceModal.document && (
        <ReplaceDocumentModal
          open={replaceModal.open}
          onOpenChange={(open: boolean) =>
            setReplaceModal((state) => ({ ...state, open }))
          }
          document={replaceModal.document}
          onReplaced={() => {
            setReplaceModal({ open: false, document: null });
            fetchDocuments();
          }}
        />
      )}

      {/* SCRUM-120: the same viewer the admin uses, with replace still offered
          because this is the agency's own document. */}
      {previewDoc && (
        <DocumentPreviewModal
          open
          onOpenChange={(v) => !v && setPreviewDoc(null)}
          fileName={previewDoc.fileName}
          fileUrl={previewDoc.fileUrl}
          fileSize={previewDoc.fileSize}
          onReplace={() =>
            setReplaceModal({ open: true, document: previewDoc })
          }
        />
      )}

      {removeDialog.document && (
        <RemoveDocumentDialog
          open={removeDialog.open}
          onOpenChange={(open: boolean) =>
            setRemoveDialog((state) => ({ ...state, open }))
          }
          document={removeDialog.document}
          onRemoved={() => {
            setRemoveDialog({ open: false, document: null });
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
};

export default SigningDocuments;

const GroupCard = ({
  group,
  onUpload,
  onPreview,
  onReplace,
  onRemove,
}: {
  group: Group;
  onUpload: () => void;
  onPreview: (document: SigningDoc) => void;
  onReplace: (document: SigningDoc) => void;
  onRemove: (document: SigningDoc) => void;
}) => {
  const count = group.documents.length;
  const isFull = count >= MAX_DOCUMENTS_PER_ROLE;

  return (
    <div className='flex flex-col gap-4 rounded-[16px] border border-[#DFE2E0] bg-white p-5'>
      <div className='flex items-center gap-2'>
        <span className='rounded-full bg-[#ECFAF0] px-2.5 py-1 text-[11px] font-semibold text-[#008000]'>
          {group.role}
        </span>
        <h2 className='text-[17px] font-bold text-[#1C1C1C]'>
          {group.role} documents
        </h2>
        {count > 0 && (
          <span className='text-sm text-[#5E6864]'>
            · {count} {count === 1 ? 'document' : 'documents'}
          </span>
        )}
        {count > 0 && (
          <span className='ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-[#ECFAF0] px-2.5 py-1 text-[11px] font-semibold text-[#008000]'>
            <span className='size-1.5 rounded-full bg-[#008000]' />
            Active
          </span>
        )}
      </div>

      {count === 0 ? (
        <div className='flex flex-col items-center gap-3 rounded-[12px] border border-dashed border-[#DFE2E0] bg-[#F2F4F3] px-4 py-8 text-center'>
          <Upload className='size-6 text-[#5E6864]' />
          <div className='flex flex-col gap-1'>
            <p className='text-sm font-bold text-[#1C1C1C]'>
              No documents added yet
            </p>
            <p className='text-xs text-[#5E6864]'>
              Add one or more files this {group.role} must sign · PDF, up
              to 10 MB each
            </p>
          </div>
          <Button
            onClick={onUpload}
            className='h-11 rounded-[12px] bg-[#008000] px-6 text-white hover:bg-[#01400F]'
          >
            Upload documents
          </Button>
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-3'>
            {group.documents.map((document) => (
              <div
                key={document._id}
                className='flex items-center gap-3 rounded-[12px] bg-[#F4F5F6] p-3'
              >
                <span className='flex size-8 shrink-0 items-center justify-center'>
                  <span className='flex h-6 w-5 items-end justify-center rounded-[3px] bg-[#E94435]/10 pb-[3px] text-[7px] font-bold leading-none text-[#E94435] [clip-path:polygon(0_0,68%_0,100%_28%,100%_100%,0_100%)]'>
                    {fileBadge(document.fileName)}
                  </span>
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-bold text-[#1C1C1C]'>
                    {document.fileName}
                  </p>
                  <p className='text-xs text-[#5E6864]'>
                    {formatFileSize(document.fileSize)}
                  </p>
                </div>
                {/* SCRUM-120: icon-only row actions. An agency could upload a
                    document and then never see it again — only replace or
                    remove it. Preview is the eye; a third text link would have
                    turned the row into a wall of words, so all three are icons
                    with tooltips and labels for screen readers. */}
                <div className='flex shrink-0 items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => onPreview(document)}
                    aria-label={`Preview ${document.fileName}`}
                    title='Preview'
                    className='flex size-8 items-center justify-center rounded-lg border border-[#DFE2E0] bg-white text-[#1C1C1C] transition-colors hover:bg-[#F2F4F3]'
                  >
                    <Eye className='size-5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => onReplace(document)}
                    aria-label={`Replace ${document.fileName}`}
                    title='Replace'
                    className='flex size-8 items-center justify-center rounded-lg border border-[#DFE2E0] bg-white text-[#1C1C1C] transition-colors hover:bg-[#F2F4F3]'
                  >
                    <Upload className='size-5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => onRemove(document)}
                    aria-label={`Remove ${document.fileName}`}
                    title='Remove'
                    className='flex size-8 items-center justify-center rounded-lg border border-[#DFE2E0] bg-white text-[#E94435] transition-colors hover:bg-[#FDECEB]'
                  >
                    <Trash2 className='size-5' />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type='button'
            onClick={onUpload}
            disabled={isFull}
            className='flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[#DFE2E0] py-3 text-sm font-semibold text-[#008000] transition-colors hover:border-[#008000] hover:bg-[#ECFAF0] disabled:pointer-events-none disabled:opacity-50'
          >
            <Plus className='size-4' />
            {isFull
              ? `Limit reached · ${MAX_DOCUMENTS_PER_ROLE} documents`
              : 'Add document'}
          </button>

          <div className='flex items-start gap-2'>
            <Info className='mt-0.5 size-3.5 shrink-0 text-[#5E6864]' />
            <p className='text-xs text-[#5E6864]'>
              Sent automatically to {group.role}s on connection ·{' '}
              {group.caregiversSent}{' '}
              {group.caregiversSent === 1 ? 'caregiver' : 'caregivers'} ·{' '}
              {group.fullySigned} fully signed
            </p>
          </div>
        </>
      )}
    </div>
  );
};

const SigningDocumentsSkeleton = () => (
  <div className='flex flex-col gap-6 px-4 md:px-0'>
    <div className='flex flex-col gap-2'>
      <div className='h-8 w-56 animate-pulse rounded bg-gray-200' />
      <div className='h-4 w-full max-w-2xl animate-pulse rounded bg-gray-200' />
    </div>
    <div className='grid md:grid-cols-2 gap-5'>
      {[0, 1].map((index) => (
        <div
          key={index}
          className='flex flex-col gap-4 rounded-[16px] border border-[#DFE2E0] bg-white p-5'
        >
          <div className='flex items-center gap-2'>
            <div className='h-5 w-12 animate-pulse rounded-full bg-gray-200' />
            <div className='h-5 w-36 animate-pulse rounded bg-gray-200' />
          </div>
          <div className='h-[168px] w-full animate-pulse rounded-[12px] bg-gray-100' />
        </div>
      ))}
    </div>
  </div>
);
