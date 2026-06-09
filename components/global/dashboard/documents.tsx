'use client';
import React, { useState } from 'react';
import Title from '../title';
import {
  Plus,
  MoreHorizontal,
  LockKeyhole,
  Globe,
  Trash2,
  Pencil,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import UploadDocumentModal from './upload-document-modal';
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
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { REQUIRED_CREDENTIALS } from '@/lib/credential-config';

// SCRUM-61: documents that belong to the locked credential list never appear in
// the supporting-Documents section. The Credentials Status section owns those.
const CREDENTIAL_DOCUMENT_TYPES = REQUIRED_CREDENTIALS.map((c) => c.documentType);

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
}

const Documents: React.FC<{ proUser?: any; from?: string }> = ({
  proUser,
  from,
}) => {
  const { data: documents, refetch: refetchDocuments } = useDocuments();

  // SCRUM-61: single combined Documents section — supporting docs only.
  // Credential rows (CNA Certificate, Driver's License, Auto Insurance, CPR Test,
  // TB Test) are excluded; they're owned by the Credentials Status section.
  const supportingDocuments = (documents ?? []).filter(
    (d: Document) => !CREDENTIAL_DOCUMENT_TYPES.includes(d.documentType),
  );

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

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6'>
        {supportingDocuments.map((document: any, index: number) => (
          <EachDocument
            document={document}
            key={index}
            refetchDocuments={refetchDocuments}
          />
        ))}
        {from !== 'onboard' && (
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
}: {
  document: any;
  refetchDocuments: () => void;
}) => {
  return (
    <DocumentViewer documents={document} title='View Document'>
      <div className='flex flex-col gap-6 justify-between p-4 md:p-6 border rounded-[24px] w-full cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all'>
        <div className='flex justify-between gap-2'>
          <img
            src={fileIcons[getFileType(document.url)]}
            alt={document.title}
            className='size-[30px] md:size-[40px] lg:size-[60px]'
          />

          <div
            className='flex items-center'
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size='icon'
              variant='ghost'
              className='size-6 md:size-8 lg:size-10 cursor-pointer bg-accent hover:bg-gray-100 md:rounded-xl'
            >
              {document.privacy === 'public' ? (
                <Globe className='size-3 md:size-5' />
              ) : (
                <LockKeyhole className='size-3 md:size-5' />
              )}
            </Button>
            <MoreDropdown
              document={document}
              refetchDocuments={refetchDocuments}
            />
          </div>
        </div>

        <div>
          <p className='text-sm sm:text-base md:text-xl font-medium text-tertiary truncate'>
            {document.title}
          </p>
          <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
            {document.category === 'medical' ? 'Medical' : 'Non-Medical'}
          </p>
        </div>
      </div>
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
        className={cn(
          'flex flex-col items-center justify-center p-4 md:p-8 border border-[#BBF8DC] rounded-3xl w-full cursor-pointer',
          hasDocumets ? 'h-full' : 'h-[186px]',
        )}
      >
        <p className='md:size-10 size-8 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700 transition-colors'>
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
