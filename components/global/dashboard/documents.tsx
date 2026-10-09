'use client';
import React, { useState } from 'react';
import Title from '../title';
import {
  Plus,
  MoreHorizontal,
  LockKeyhole,
  Trash2,
  Pencil,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import UploadDocumentModal, { SHARING_NOTE } from './upload-document-modal';
import DocumentViewer from './document-viewer';
import { downloadFile } from '@/utils/download';

import { fileIcons, getFileType } from '@/utils/file';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { getUserDocuments } from '@/app/actions';
import { REQUIRED_CREDENTIALS } from '@/lib/credential-config';

// SCRUM-61: documents that belong to the locked credential list never appear in
// the supporting-Documents section. The Credentials Status section owns those.
const CREDENTIAL_DOCUMENT_TYPES = REQUIRED_CREDENTIALS.map((c) => c.documentType);

// Design meta line: "Non Medical . ( 2.1 MB ) C...jpeg"
const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface Document {
  _id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  privacy: string;
  consent: boolean;
  category: string;
  documentType: string;
  fileSize?: number;
}

const Documents: React.FC<{ proUser?: any; from?: string }> = ({
  proUser,
  from,
}) => {
  // Whose documents these are. On the caregiver's own profile there is no
  // proUser and this is the logged-in user's list. On an agency's view of a
  // caregiver, proUser IS the caregiver — it used to be accepted and ignored, so
  // the section listed the AGENCY's own documents, offered an upload card that
  // filed into the agency's account, and put Update / Remove on every card.
  const viewedUserId: string | undefined = proUser?._id;
  const readOnly = !!viewedUserId;

  const { data: documents, refetch: refetchDocuments } = useQuery({
    // The own-profile key stays ['documents'] so the upload modal's
    // invalidation keeps refreshing it exactly as before.
    queryKey: readOnly ? ['documents', viewedUserId] : ['documents'],
    queryFn: () => getUserDocuments(viewedUserId),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  // SCRUM-61: single combined Documents section — supporting docs only.
  // Credential rows (CNA Certificate, Driver's License, Auto Insurance, CPR Test,
  // TB Test) are excluded; they're owned by the Credentials Status section.
  const supportingDocuments = (documents ?? []).filter(
    (d: Document) => !CREDENTIAL_DOCUMENT_TYPES.includes(d.documentType),
  );

  // Someone else's profile with no supporting documents: nothing to list and
  // nothing they may add, so show no empty box.
  if (readOnly && supportingDocuments.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-white md:rounded-2xl',
        from === 'admin' ? 'p-0' : 'px-4 p-6 md:p-8 ',
      )}
    >
      <Title
        text='Documents'
        className={cn(
          'border-b pb-4',
          from === 'onboard' ? '!text-lg md:!text-xl' : '!text-lg md:!text-2xl',
        )}
      />

      {/* SCRUM-177: replaces the per-document Private toggle — the caregiver
          controls who sees these by choosing who gets the profile link. Own
          profile only; on an agency's view of a caregiver "your profile" is
          the wrong voice. */}
      {!readOnly && (
        <p className='mt-3 mb-4 text-xs sm:text-sm font-medium text-muted-foreground'>
          {SHARING_NOTE}
        </p>
      )}

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6'>
        {supportingDocuments.map((document: any, index: number) => (
          <EachDocument
            document={document}
            key={index}
            refetchDocuments={refetchDocuments}
            readOnly={readOnly}
          />
        ))}
        {from !== 'onboard' && !readOnly && (
          <UploadDocumentButton
            category='non_medical'
            hasDocumets={supportingDocuments.length > 0}
          />
        )}
      </div>
    </div>
  );
};

export default Documents;

const EachDocument = ({
  document,
  refetchDocuments,
  readOnly = false,
}: {
  document: any;
  refetchDocuments: () => void;
  /** Someone else's document: view only, no Update / Remove. */
  readOnly?: boolean;
}) => {
  const fileName = document.url?.split('/').pop()?.split('?')[0] || '';
  // The paywall withholds the file link until the agency buys the credential
  // package, so a locked document has no url. Show the card, but never open a
  // viewer onto nothing.
  const locked = !document.url;

  const card = (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-6 justify-between p-4 md:p-6 border rounded-[24px] w-full',
        locked
          ? 'cursor-default'
          : 'cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all',
      )}
    >
      <div className='flex justify-between gap-2'>
        <img
          // A locked document has no url to read a file type from.
          src={fileIcons[getFileType(document.url)] || '/file.svg'}
          alt={document.title}
          className='size-[30px] md:size-[40px] lg:size-[60px]'
        />

        <div
          className='flex items-center'
          onClick={(e) => e.stopPropagation()}
        >
          {readOnly ? (
            // SCRUM-177: this padlock is NOT the caregiver's privacy flag — it
            // is drawn only when the url was withheld (SCRUM-119 packet paywall
            // / SCRUM-99 tier gate), and it stays, because a card with no url
            // has no file to open. The caregiver-facing privacy indicator that
            // used to sit on the owner's own cards is gone.
            locked && (
              <span className='size-6 md:size-8 lg:size-10 flex items-center justify-center bg-accent md:rounded-xl'>
                <LockKeyhole className='size-3 md:size-5' />
              </span>
            )
          ) : (
            <MoreDropdown
              document={document}
              refetchDocuments={refetchDocuments}
            />
          )}
        </div>
      </div>

      <div className='min-w-0'>
        <p className='text-sm sm:text-base md:text-xl font-medium text-tertiary truncate'>
          {document.title}
        </p>
        <p className='text-xs sm:text-sm font-medium text-muted-foreground truncate'>
          {document.category === 'medical' ? 'Medical' : 'Non Medical'}
          {document.fileSize ? ` . ( ${formatFileSize(document.fileSize)} )` : ''}
          {fileName ? ` ${fileName}` : ''}
        </p>
      </div>
    </div>
  );

  return locked ? (
    card
  ) : (
    <DocumentViewer documents={document} title='View Document'>
      {card}
    </DocumentViewer>
  );
};

const UploadDocumentButton = ({
  category,
  hasDocumets,
}: {
  category: string;
  hasDocumets: boolean;
}) => {
  // SCRUM-61: Documents section's "+" button is Add More — supporting doc list,
  // Category defaults to Non-Medical, both fields editable.
  return (
    <UploadDocumentModal addMore>
      <Button
        variant='special'
        // Stable hook for the end-to-end upload test; the button is icon-only,
        // so there is no text for a test to find it by.
        data-testid='add-document'
        className={cn(
          'flex flex-col items-center justify-center p-4 md:p-8 border border-[#BBF8DC] rounded-3xl w-full cursor-pointer',
          hasDocumets ? 'h-full' : 'h-[186px]',
        )}
      >
        <p className='md:size-10 size-8 rounded-full bg-[#008000] flex items-center justify-center hover:bg-[#026a02] transition-colors'>
          <Plus className='w-5 h-5 text-white' strokeWidth={2.5} />
        </p>
      </Button>
    </UploadDocumentModal>
  );
};

export function MoreDropdown({
  document,
  refetchDocuments,
}: {
  document: any;
  refetchDocuments: () => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/user/document-delete?documentId=${document._id}`,
        {
          method: 'DELETE',
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        toast.success('Document deleted successfully!');
        refetchDocuments();
        setShowDeleteDialog(false);
      } else {
        toast.error(result.message || 'Failed to delete document');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='md:rounded-xl size-6 md:size-8 lg:size-10'
          >
            <MoreHorizontal className='size-3 md:size-5 cursor-pointer' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className='cursor-pointer'
              onSelect={() => {
                downloadFile(
                  document.url,
                  document.title || 'document',
                );
              }}
            >
              <Download />
              <span>Download</span>
            </DropdownMenuItem>
            <UploadDocumentModal document={document}>
              <DropdownMenuItem
                className='cursor-pointer'
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <Pencil />
                <span>Update</span>
              </DropdownMenuItem>
            </UploadDocumentModal>
            <DropdownMenuItem
              className='cursor-pointer'
              onSelect={() => setShowDeleteDialog(true)}
            >
              <Trash2 />
              <span>Remove</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document &quot;{document.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
