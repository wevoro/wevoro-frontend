import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AddMore from '../professional-info/add-more';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import Remove from '../professional-info/remove';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserDocuments } from '@/app/actions';
import { Lock } from 'lucide-react';

// Helper to extract filename from URL
const getFilenameFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').pop() || '';
    // Truncate if too long
    return filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
  } catch {
    return 'document.pdf';
  }
};

export function OfferRequestModal({
  children,
  offerData,
  proUser,
}: {
  children: React.ReactNode;
  offerData?: any;
  proUser?: any;
}) {
  // console.log('🚀 ~ OfferRequestModal ~ proUser:', proUser);

  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      jobLink: offerData?.jobLink || '',
      documentsNeeded: offerData?.documentsNeeded || [{ title: '' }],
      partnerNotes: offerData?.partnerNotes || '',
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['documents', proUser?._id],
    queryFn: () => getUserDocuments(proUser?._id),
  });
  // console.log('🚀 ~ OfferRequestModal ~ documents:', documents);

  // Check if all documents are selected
  const allSelected = useMemo(() => {
    return (
      documents?.length > 0 && selectedDocuments.length === documents.length
    );
  }, [documents, selectedDocuments]);

  // Handle select all
  const handleSelectAll = () => {
    if (documents?.length > 0) {
      setSelectedDocuments(documents.map((doc: any) => doc._id));
    }
  };

  // Handle unselect all
  const handleUnselectAll = () => {
    setSelectedDocuments([]);
  };

  // Handle individual document toggle
  const handleDocumentToggle = (docId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId],
    );
  };

  const isEdit = offerData && Object.keys(offerData).length > 0;

  // Pre-populate form when editing an existing offer
  useEffect(() => {
    if (open && offerData) {
      // Reset form with offer data
      const existingDocRequests =
        offerData?.documentsNeeded?.filter(
          (doc: any) => !doc.document, // New document requests (no reference to existing doc)
        ) || [];

      reset({
        jobLink: offerData?.jobLink || '',
        partnerNotes: '',
        documentsNeeded:
          existingDocRequests.length > 0
            ? existingDocRequests.map((doc: any) => ({
                title: doc.title || '',
              }))
            : [{ title: '' }],
      });

      // Pre-select documents that were already requested (have document reference)
      const preSelectedDocs =
        offerData?.documentsNeeded
          ?.filter((doc: any) => doc.document) // Only existing document references
          ?.map((doc: any) =>
            typeof doc.document === 'object' ? doc.document._id : doc.document,
          ) || [];

      setSelectedDocuments(preSelectedDocs);
    }
  }, [open, offerData, reset]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedDocuments([]);
      reset({
        jobLink: '',
        partnerNotes: '',
        documentsNeeded: [{ title: '' }],
      });
    }
  }, [open, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'documentsNeeded',
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    // When updating, get existing documents from the offer to preserve their status
    const existingOfferDocs = offerData?.documentsNeeded || [];

    // Format existing documents from user's profile
    const existingDocs = selectedDocuments.map((docId) => {
      const doc = documents?.find((d: any) => d._id === docId);

      // Check if this document was already in the offer (to preserve its status)
      const previousOfferDoc = existingOfferDocs.find((od: any) => {
        const odDocId =
          typeof od.document === 'object' ? od.document?._id : od.document;
        return odDocId === docId;
      });

      return {
        document: docId,
        title:
          doc?.title || doc?.documentType?.replace(/_/g, ' ') || 'Document',
        category: doc?.category || null,
        privacy: doc?.privacy || null,
        url: doc?.url || null,
        // Preserve existing status if this doc was already in the offer, otherwise set based on privacy
        status:
          previousOfferDoc?.status ||
          (doc?.privacy === 'public' ? 'granted' : 'pending'),
      };
    });

    // Format new document requests (partner requesting Pro to upload)
    // Check if the doc title already exists in the offer to preserve status/url
    const newDocRequests = (data.documentsNeeded || [])
      .filter((doc: { title: string }) => doc.title?.trim())
      .map((doc: { title: string; _id?: string }) => {
        // Check if this document request already exists in the offer (by _id or title match)
        const previousOfferDoc = existingOfferDocs.find((od: any) => {
          // Match by _id if available, or by title for documents without references
          if (doc._id && od._id === doc._id) return true;
          if (!od.document && od.title === doc.title.trim()) return true;
          return false;
        });

        return {
          // Preserve the _id if it exists (for existing missing doc requests)
          ...(previousOfferDoc?._id && { _id: previousOfferDoc._id }),
          document: null,
          title: doc.title.trim(),
          category: null,
          privacy: null,
          // Preserve URL if pro already uploaded
          url: previousOfferDoc?.url || null,
          // Preserve status if already uploaded/handled
          status: previousOfferDoc?.status || 'pending',
        };
      });

    // Combine into single documentsNeeded array
    const allDocumentsNeeded = [...existingDocs, ...newDocRequests];

    const payload = {
      ...data,
      documentsNeeded: allDocumentsNeeded,
      pro: proUser?._id,
    };
    console.log('🚀 ~ onSubmit ~ payload:', payload);

    // Remove the old form field data
    delete payload.partnerNotes;

    if (!offerData?._id && data.partnerNotes) {
      payload.notes = [{ note: data.partnerNotes, role: 'partner' }];
    }

    if (offerData?._id) {
      payload.offer = offerData?._id;
    }

    const response = await fetch('/api/user/offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData: any = await response.json();
    console.log('🚀 ~ onSubmit ~ responseData:', responseData);

    if (responseData.status === 200) {
      reset();
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setOpen(false);
      router.push(`/partner/onboardings`);
      setIsLoading(false);
      toast.success(
        offerData?._id
          ? `Offer updated successfully!`
          : `Offer sent successfully!`,
        {
          position: 'top-center',
        },
      );
      // Notification is now sent from the backend
    }

    if (responseData.status === 500) {
      setIsLoading(false);
      return toast.error(responseData.message || `Offer send failed`, {
        position: 'top-center',
      });
    }
    setIsLoading(false);
  };

  const removeDocument = (index: number) => {
    remove(index);
  };

  const renderError = (message: string) => {
    return <p className='text-red-500 text-sm pt-1'>{message}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[800px]  gap-6 overflow-y-auto max-h-[80vh]  md:p-8'>
        <DialogHeader className='font-semibold text-base md:text-lg text-start'>
          {isEdit ? 'Update Offer Details' : 'Send Offer'}
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='flex flex-col gap-8 h-full '
        >
          <div className='flex flex-col gap-4  rounded-sm'>
            <p className='text-base font-medium'>Job link</p>
            <div className='rounded-xl border border-[#DFE2E0] py-5 px-4'>
              <p className='text-sm font-medium pb-2'>
                URL <span className='text-red-500'>*</span>
              </p>
              <Controller
                name='jobLink'
                control={control}
                rules={{ required: 'Job link is required' }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Input
                      {...field}
                      placeholder='Ex: https://www.indeed.com'
                      className='rounded-xl h-11'
                      isError={!!error}
                    />
                    {error && renderError(error.message || '')}
                  </>
                )}
              />
            </div>
          </div>

          <div className='flex flex-col gap-4  rounded-sm'>
            <p className='text-base font-medium'>Documents to be provided</p>
            <div className='p-4 border rounded-xl'>
              {/* Select All / Unselect All Controls */}
              <div className='flex items-center gap-6 mb-4'>
                <label className='flex items-center gap-2 text-sm font-medium cursor-pointer text-gray-700 hover:text-primary transition-colors'>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      if (checked) handleSelectAll();
                    }}
                    className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                  />
                  Select all
                </label>
                <label className='flex items-center gap-2 text-sm font-medium cursor-pointer text-gray-700 hover:text-gray-900 transition-colors'>
                  <Checkbox
                    checked={selectedDocuments.length === 0}
                    onCheckedChange={(checked) => {
                      if (checked) handleUnselectAll();
                    }}
                  />
                  Un Select all
                </label>
              </div>

              {/* Documents List */}
              <div className='flex flex-col gap-3 max-h-[300px] overflow-y-auto'>
                {documents?.map((doc: any) => {
                  const isSelected = selectedDocuments.includes(doc._id);
                  return (
                    <label
                      key={doc._id}
                      className={cn(
                        'flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-[#DFE2E0] hover:border-gray-300',
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleDocumentToggle(doc._id)}
                        className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 truncate'>
                          {doc.title || doc.documentType?.replace(/_/g, ' ')}
                        </p>
                        <p className='text-xs text-gray-500 truncate'>
                          {getFilenameFromUrl(doc.url)}
                        </p>
                      </div>
                      {doc.privacy === 'private' && (
                        <Lock className='w-4 h-4 text-gray-400 flex-shrink-0' />
                      )}
                    </label>
                  );
                })}
                {(!documents || documents.length === 0) && (
                  <div className='flex flex-col items-center gap-3 py-6 text-center'>
                    <div className='w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center'>
                      <Lock className='w-5 h-5 text-amber-500' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-700'>
                        No documents uploaded yet
                      </p>
                      <p className='text-xs text-gray-500 mt-1 max-w-[300px]'>
                        This professional hasn&apos;t uploaded any documents to their profile. You can still request specific documents below using the &quot;Add More&quot; button.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={cn('flex flex-col gap-4')}>
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className={cn('rounded-xl border border-[#DFE2E0] py-5 px-4')}
                >
                  <div className='flex justify-between items-center'>
                    <p className='text-sm font-medium pb-2'>
                      Title <span className='text-red-500'>*</span>
                    </p>

                    <div className='mb-2'>
                      <Remove handleRemove={() => removeDocument(index)} />
                    </div>
                  </div>
                  <Controller
                    name={`documentsNeeded.${index}.title`}
                    control={control}
                    rules={{
                      required: 'Title is required',
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input
                          {...field}
                          placeholder='Ex: Patient Service Fundamentals'
                          className='rounded-xl h-11'
                          isError={!!error}
                        />
                        {error && renderError(error.message || '')}
                      </>
                    )}
                  />
                </div>
              ))}
              <AddMore
                handleAdd={() => append({ title: '' })}
                iconBgColor='bg-primary'
                textColor='text-primary'
              />
            </div>
          </div>

          {!offerData?._id && (
            <div className='flex flex-col gap-2  rounded-sm'>
              <p className='text-base font-medium'>Notes</p>
              <Controller
                name='partnerNotes'
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder='Write your message and more details for the pro..'
                    className='rounded-xl h-40'
                  />
                )}
              />
            </div>
          )}
          <DialogFooter className='flex flex-row gap-4 '>
            <DialogClose asChild>
              <Button
                disabled={isLoading}
                type='button'
                variant='outline'
                className='w-full md:h-[60px] rounded-xl'
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type='submit'
              className='w-full md:h-[60px] rounded-xl'
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
