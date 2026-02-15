'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  Check,
  CloudUpload,
  FileClock,
  X,
  FileText,
  RotateCw,
} from 'lucide-react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Helper to extract filename from URL
const getFilenameFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').pop() || '';
    return filename.length > 25 ? filename.substring(0, 22) + '...' : filename;
  } catch {
    return 'document.pdf';
  }
};

// Helper to format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

// PDF icon component
const PdfIcon = () => (
  <div className='w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center'>
    <FileText className='w-5 h-5 text-red-600' />
  </div>
);

interface UploadedFile {
  file: File;
  docId: string;
}

interface AccessStatus {
  docId: string;
  status: 'granted' | 'denied' | 'pending';
  originalStatus: 'pending';
}

export function ProRequestModal({
  children,
  offer,
}: {
  children: React.ReactNode;
  offer: any;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const image = offer?.partner?.personalInfo?.image;
  const companyName = offer?.partner?.personalInfo?.companyName;
  const companyIndustry = offer?.partner?.personalInfo?.industry;
  const createdAt = offer?.createdAt;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [accessStatuses, setAccessStatuses] = useState<AccessStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Separate documents into two categories
  const { missingDocuments, accessRequestedDocuments } = useMemo(() => {
    const docs = offer?.documentsNeeded || [];
    return {
      // Missing: New document requests (no existing document reference)
      missingDocuments: docs.filter(
        (doc: any) => !doc.document && doc.status === 'pending',
      ),
      // Access Requested: Existing private documents with pending status
      accessRequestedDocuments: docs.filter(
        (doc: any) =>
          doc.document && doc.privacy === 'private' && doc.status === 'pending',
      ),
    };
  }, [offer?.documentsNeeded]);

  // Handle file upload for missing documents
  const handleFileChange = (docId: string, file: File | undefined) => {
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      return toast.error('File size should not exceed 3MB', {
        position: 'top-center',
      });
    }

    setUploadedFiles((prev) => {
      const existing = prev.findIndex((f) => f.docId === docId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { file, docId };
        return updated;
      }
      return [...prev, { file, docId }];
    });
  };

  // Remove uploaded file
  const removeUploadedFile = (docId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.docId !== docId));
  };

  // Handle grant/deny access for existing documents
  const handleAccessChange = (
    docId: string,
    status: 'granted' | 'denied' | 'pending',
  ) => {
    setAccessStatuses((prev) => {
      const existing = prev.findIndex((a) => a.docId === docId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], status };
        return updated;
      }
      return [...prev, { docId, status, originalStatus: 'pending' }];
    });
  };

  // Get current access status for a document
  const getAccessStatus = (docId: string) => {
    return accessStatuses.find((a) => a.docId === docId)?.status || 'pending';
  };

  // Handle cancel / reset
  const handleCancel = () => {
    setUploadedFiles([]);
    setAccessStatuses([]);
  };

  // Handle submit
  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();

      // Add offer ID
      formData.append('offerId', offer?._id);

      // Add files for missing documents
      for (const { file, docId } of uploadedFiles) {
        formData.append(docId, file, docId);
      }

      // Add status updates as JSON string
      const statusUpdates = accessStatuses
        .filter((a) => a.status !== 'pending')
        .map(({ docId, status }) => ({
          documentId: docId,
          status,
        }));

      if (statusUpdates.length > 0) {
        formData.append('statusUpdates', JSON.stringify(statusUpdates));
      }

      console.log({ statusUpdates });

      // Single API call for everything
      const response = await fetch('/api/user/offer/pro-respond', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.status !== 200) {
        toast.error(data.message || 'Failed to submit response');
        setIsLoading(false);
        return;
      }

      // Success
      toast.success('Response submitted successfully!', {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      router.push(`/pro/jobs`);
      setOpen(false);
      handleCancel();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there's anything to submit
  const hasChanges =
    uploadedFiles.length > 0 ||
    accessStatuses.some((a) => a.status !== 'pending');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[600px] max-h-[85vh] overflow-y-auto'>
        {/* Header */}
        <DialogHeader className='flex flex-row items-center gap-3'>
          <img
            src={image}
            alt={companyName}
            className='md:size-[58px] size-[40px] rounded-full object-cover'
          />
          <div className='flex flex-col gap-1 items-start'>
            <DialogTitle className='md:text-lg text-base font-normal flex items-center gap-2'>
              {companyName}
              <span className='md:text-xs text-[10px] bg-[#FAB607] px-2 py-1 rounded-full'>
                {moment(createdAt).fromNow()}
              </span>
            </DialogTitle>
            <DialogDescription className='md:text-sm text-[12px]'>
              {companyIndustry}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-6 my-4'>
          {/* Request intro */}
          <p className='md:text-base text-sm text-tertiary flex items-center gap-2'>
            <FileClock className='md:w-6 md:h-6 w-4 h-4 text-muted-foreground' />
            The client is requesting:
          </p>

          {/* Missing Documents Section */}
          {missingDocuments.length > 0 && (
            <div className='flex flex-col gap-3'>
              <h3 className='font-semibold text-tertiary'>Missing Document</h3>
              {missingDocuments.map((doc: any) => {
                const uploadedFile = uploadedFiles.find(
                  (f) => f.docId === doc._id,
                );
                const isUploaded = !!uploadedFile;

                return (
                  <div
                    key={doc._id}
                    className='bg-white rounded-xl border p-4 flex flex-col gap-3'
                  >
                    {/* Document info row */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={cn(
                            'size-7 rounded-full flex items-center justify-center',
                            isUploaded ? 'bg-[#33B55B]' : 'bg-[#F9F9FA]',
                          )}
                        >
                          <Check
                            className={cn(
                              'size-5',
                              isUploaded ? 'text-white' : 'text-gray-300',
                            )}
                          />
                        </div>
                        <div>
                          <p className='font-medium text-tertiary'>
                            {doc.title}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            doc or pdf formats, up to 3mb.
                          </p>
                        </div>
                      </div>

                      {/* Upload button */}
                      <label className='cursor-pointer'>
                        <input
                          type='file'
                          className='hidden'
                          accept='image/*,application/pdf,.doc,.docx'
                          onChange={(e) =>
                            handleFileChange(doc._id, e.target.files?.[0])
                          }
                        />
                        <span
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                            isUploaded
                              ? 'border-gray-200 text-gray-400'
                              : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary',
                          )}
                        >
                          <CloudUpload className='w-4 h-4' />
                          Upload
                        </span>
                      </label>
                    </div>

                    {/* Uploaded file preview */}
                    {isUploaded && (
                      <div className='flex items-center justify-between border rounded-xl p-3'>
                        <div className='flex items-center gap-3'>
                          <PdfIcon />
                          <div>
                            <p className='text-sm font-medium text-tertiary pb-1'>
                              {uploadedFile.file.name.length > 25
                                ? uploadedFile.file.name.substring(0, 22) +
                                  '...'
                                : uploadedFile.file.name}
                            </p>
                            <p className='text-xs text-muted-foreground flex items-center gap-2'>
                              {formatFileSize(uploadedFile.file.size)} •{' '}
                              <span className='text-primary flex items-center gap-1 '>
                                <span className='bg-[#33B55B] size-4 flex items-center justify-center rounded-full'>
                                  <Check className='w-3 h-3 text-white' />
                                </span>
                                Complete
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeUploadedFile(doc._id)}
                          className='text-gray-400 hover:text-gray-600 transition-colors'
                        >
                          <X className='w-5 h-5' />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Access Requested Section */}
          {accessRequestedDocuments.length > 0 && (
            <div className='flex flex-col gap-3'>
              <h3 className='font-semibold text-tertiary'>Access Requested</h3>
              {accessRequestedDocuments.map((doc: any) => {
                const currentStatus = getAccessStatus(doc._id);
                const isGranted = currentStatus === 'granted';
                const isDenied = currentStatus === 'denied';

                return (
                  <div
                    key={doc._id}
                    className='bg-white rounded-xl border p-4 flex items-center justify-between'
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className={cn(
                          'size-7 rounded-full flex items-center justify-center',
                          isGranted
                            ? 'bg-[#33B55B]'
                            : isDenied
                              ? 'bg-red-600'
                              : 'bg-[#F9F9FA]',
                        )}
                      >
                        <Check
                          className={cn(
                            'size-5',
                            isGranted
                              ? 'text-white'
                              : isDenied
                                ? 'text-white'
                                : 'text-gray-300',
                          )}
                        />
                      </div>

                      <div>
                        <p className='font-medium text-tertiary'>{doc.title}</p>
                        <p className='text-xs text-muted-foreground'>
                          {getFilenameFromUrl(doc.url)}{' '}
                          {doc.document?.size &&
                            `${formatFileSize(doc.document.size)}`}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className='flex items-center gap-2'>
                      {currentStatus === 'pending' ? (
                        <>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='border-primary text-primary hover:bg-primary hover:text-white rounded-xl'
                            onClick={() =>
                              handleAccessChange(doc._id, 'granted')
                            }
                          >
                            <Check className='w-4 h-4 mr-1' />
                            Grant Access
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-xl'
                            onClick={() =>
                              handleAccessChange(doc._id, 'denied')
                            }
                          >
                            <X className='w-5 h-5' />
                          </Button>
                        </>
                      ) : (
                        <button
                          type='button'
                          onClick={() => handleAccessChange(doc._id, 'pending')}
                          className='flex items-center gap-1 text-sm hover:text-primary transition-colors'
                        >
                          <RotateCw className='size-5' />
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {missingDocuments.length === 0 &&
            accessRequestedDocuments.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <p>No pending document requests.</p>
              </div>
            )}
        </div>

        {/* Footer */}
        <DialogFooter className='flex flex-row gap-4'>
          <DialogClose asChild>
            <Button
              variant='outline'
              className='w-full md:h-[60px] rounded-xl border'
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className='w-full md:h-[60px] rounded-xl border'
            onClick={handleSubmit}
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
