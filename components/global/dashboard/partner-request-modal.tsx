import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/lib/context';
import AddMore from '../professional-info/add-more';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import Remove from '../professional-info/remove';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  useNotificationsContext,
  useOffersContext,
  useUIContext,
  useUserContext,
} from '@/lib/contexts';

export function PartnerRequestModal({ proUser }: { proUser: any }) {
  // const {
  //   isPartnerOpen,
  //   closePartner,
  //   refetchOffers,
  //   offerData,
  //   user,
  //   sendNotification,
  // } = useAppContext();
  const { user } = useUserContext();
  const { isPartnerOpen, closePartner, offerData } = useUIContext();
  const { sendNotification } = useNotificationsContext();
  const { refetchOffers } = useOffersContext();

  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDocumentsChecked, setIsDocumentsChecked] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      jobLink: offerData?.jobLink || '',
      documentsNeeded: offerData?.documentsNeeded || [{ title: '' }],
      partnerNotes: offerData?.partnerNotes || '',
    },
  });

  useEffect(() => {
    if (offerData) {
      setIsDocumentsChecked(offerData?.documentsNeeded?.length > 0);
      reset({
        jobLink: offerData?.jobLink || '',
        documentsNeeded: offerData?.documentsNeeded || [{ title: '' }],
        partnerNotes: offerData?.partnerNotes || '',
      });
    }
  }, [offerData]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'documentsNeeded',
  });

  const onSubmit = async (data: any) => {
    if (!isDocumentsChecked) {
      delete data.documentsNeeded;
    }
    if (!offerData?._id) {
      data.notes = [{ note: data.partnerNotes, role: 'partner' }];
      delete data.partnerNotes;
    }
    setIsLoading(true);

    const payload = {
      ...data,
      pro: id,
    };

    if (offerData?._id) {
      payload.offer = offerData?._id;
    }

    console.log({ payload });

    const response = await fetch('/api/user/offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData: any = await response.json();

    if (responseData.status === 200) {
      reset();
      refetchOffers();
      closePartner();
      router.push(`/partner/hires`);
      setIsLoading(false);
      toast.success(
        offerData?._id
          ? `Offer updated successfully!`
          : `Offer sent successfully!`,
        {
          position: 'top-center',
        }
      );

      console.log(responseData, proUser?._id || id);

      const message = offerData?._id
        ? `<p><span style="font-weight: 600; color: #008000;">${user?.personalInfo?.companyName}</span> has made some updates to their offer requirements. Please review the changes at your earliest convenience.</p>`
        : `<p>Great news! You have received a new offer from <span style="font-weight: 600; color: #008000;">${user?.personalInfo?.companyName}</span>. Check it out and respond promptly.</p>`;

      await sendNotification(
        message,
        proUser?._id || id || offerData?.pro?._id
      );
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
    <Dialog open={isPartnerOpen} onOpenChange={closePartner}>
      <DialogContent className='sm:max-w-[800px] bg-accent gap-6 overflow-y-auto max-h-[80vh]'>
        <DialogHeader className='font-semibold text-base md:text-lg text-start'>
          The below requirements will be requested from the candidate
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='flex flex-col gap-8 h-full '
        >
          {proUser?.documents && (
            <div className='flex flex-col gap-2 bg-white py-3 px-4 rounded-sm'>
              <p className='text-base font-medium'>Candidate&apos;s Uploaded Documents</p>
              <div className='flex flex-wrap gap-2'>
                {proUser.documents.certificate && (
                  <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Certificate</span>
                )}
                {proUser.documents.resume && (
                  <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Resume/CV</span>
                )}
                {proUser.documents.governmentId && (
                  <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Government ID</span>
                )}
                {!proUser.documents.certificate && !proUser.documents.resume && !proUser.documents.governmentId && (
                  <span className='text-xs text-[#6C6C6C] italic'>No documents uploaded yet.</span>
                )}
              </div>
            </div>
          )}

          <div className='flex flex-col gap-4 bg-white py-3 px-4 rounded-sm'>
            <p className='text-base font-medium'>Job link</p>
            <div className='rounded-[16px] border border-[#DFE2E0] py-5 px-4'>
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
                      className='rounded-[12px] h-11'
                      isError={!!error}
                    />
                    {error && renderError(error.message || '')}
                  </>
                )}
              />
            </div>
          </div>

          <div className='flex flex-col gap-4 bg-white py-3 px-4 rounded-sm'>
            <div className='flex items-center gap-2'>
              <Checkbox
                className='size-5'
                checked={isDocumentsChecked}
                onCheckedChange={(checked) =>
                  setIsDocumentsChecked(checked as boolean)
                }
              />
              <p className='text-base font-medium'>Documents to be provided</p>
            </div>
            <div
              className={cn(
                'flex flex-col gap-4',
                !isDocumentsChecked ? 'opacity-50 pointer-events-none' : ''
              )}
            >
              {!isDocumentsChecked && (
                <p className='text-sm text-[#6C6C6C] italic'>
                  No additional documents will be required from the candidate.
                </p>
              )}
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-[16px] border border-[#DFE2E0] py-5 px-4'
                  )}
                >
                  <div className='flex justify-between items-center'>
                    <p className='text-sm font-medium pb-2'>
                      Title <span className='text-red-500'>*</span>
                    </p>
                    {index > 0 && (
                      <div className='mb-2'>
                        <Remove handleRemove={() => removeDocument(index)} />
                      </div>
                    )}
                  </div>
                  <Controller
                    name={`documentsNeeded.${index}.title`}
                    control={control}
                    rules={{
                      required: isDocumentsChecked
                        ? 'Title is required'
                        : false,
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input
                          {...field}
                          placeholder='Ex: Patient Service Fundamentals'
                          className='rounded-[12px] h-11'
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
            <div className='flex flex-col gap-2 bg-white py-3 px-4 rounded-sm'>
              <p className='text-base font-medium'>Notes</p>
              <Controller
                name='partnerNotes'
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder='Write your message and more details for the pro..'
                    className='rounded-[12px] h-40'
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
                className='w-full md:h-[60px] rounded-[12px]'
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type='submit'
              className='w-full md:h-[60px] rounded-[12px]'
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
