import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppContext } from '@/lib/context';
import { cn } from '@/lib/utils';
import { Check, CloudUpload, FileClock, Link2 } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function ProRequestModal({
  children,
  offer,
  refetchOffers,
}: {
  children: React.ReactNode;
  offer: any;
  refetchOffers: any;
}) {
  const { user, sendNotification } = useAppContext();
  const image = offer?.partner?.personalInfo?.image;
  const companyName = offer?.partner?.personalInfo?.companyName;
  const companyIndustry = offer?.partner?.personalInfo?.industry;
  const createdAt = offer?.createdAt;

  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFileChange = (id: number, file: any) => {
    if (file.size > 3 * 1024 * 1024) {
      return toast.error('File size should not exceed 3MB', {
        position: 'top-center',
      });
    }
    setFiles((prevFiles) => {
      const fileExists = prevFiles.some((f) => f.id === id);
      if (fileExists) {
        return prevFiles.map((f) => (f.id === id ? { ...f, file } : f));
      }
      return [...prevFiles, { id, file }];
    });
  };

  const handleCancel = () => {
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      return toast.error('No files uploaded');
    }

    setIsLoading(true);
    const formData = new FormData();

    for (const file of files) {
      if (typeof file.file === 'object' && file.file) {
        formData.append(`${file.id}`, file.file, file.id);
      }
    }
    formData.append('id', offer?._id);

    const response = await fetch('/api/user/offer/upload', {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();

    if (responseData.status === 200) {
      toast.success(
        responseData.message || 'Documents submitted successfully!'
      );
      await sendNotification(
        `<p><span style="font-weight: 600; color: #008000;">${user?.personalInfo?.firstName} ${user?.personalInfo?.lastName}</span> has responded to your offer.</p>`,
        offer?.partner?._id
      );
      refetchOffers();
      setOpen(false);
    } else {
      toast.error(responseData.message || 'Something went wrong!');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[600px] bg-accent'>
        <DialogHeader className='flex flex-row items-center gap-3'>
          <img
            src={image}
            alt='cna'
            className='md:size-[58px] size-[40px] rounded-full object-cover'
          />
          <div className='flex flex-col gap-1 items-start'>
            <DialogTitle className='md:text-lg text-base font-normal'>
              {companyName}
              <span className='md:text-xs text-[10px] bg-[#FAB607] px-2 py-1 rounded-full ml-1'>
                {moment(createdAt).fromNow()}
              </span>
            </DialogTitle>
            <DialogDescription className='md:text-sm text-[12px]'>
              {companyIndustry}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className='flex flex-col gap-6 my-8'>
          <p className='md:text-base text-sm text-[#1C1C1C] flex items-center gap-2'>
            <FileClock className='md:w-6 md:h-6 w-4 h-4 text-[#6C6C6C]' />
            The client is requesting:
          </p>
          {offer?.documentsNeeded?.map((document: any, idx: number) => (
            <div
              key={idx}
              className='bg-white rounded-[12px] py-5 px-3 flex items-center gap-4'
            >
              <div className='flex flex-col sm:flex-row gap-4 justify-between w-full'>
                <div className='flex items-center gap-4'>
                  <Check
                    className={cn(
                      'md:size-6 size-4 text-[#D2D2D2]',
                      document?.status === 'uploaded' && 'text-primary'
                    )}
                  />
                  <div>
                    <h2 className='md:text-base text-sm text-[#1C1C1C]'>
                      {document?.title}
                    </h2>
                    {files.find((f) => f.id === document?._id) ? (
                      <span className='text-[10px] text-[#6C6C6C]'>
                        {files.find((f) => f.id === document?._id)?.file?.name}{' '}
                        (
                        {(
                          files.find((f) => f.id === document?._id)?.file
                            ?.size / 1024
                        ).toFixed(2)}{' '}
                        kb)
                      </span>
                    ) : document?.status === 'uploaded' ? (
                      <Link
                        href={document?.url}
                        target='_blank'
                        className='text-sm text-blue-500 flex items-center gap-2'
                      >
                        <Link2 className='w-4 h-4' /> View
                      </Link>
                    ) : (
                      <span className='text-[10px] text-[#6C6C6C]'>
                        image or pdf formats, up to 3MB.
                      </span>
                    )}
                  </div>
                </div>

                <label className='cursor-pointer text-[#455468] font-medium text-sm border border-[#AFBACA] h-10 flex items-center justify-center gap-2 rounded-lg px-4'>
                  <input
                    type='file'
                    className='hidden'
                    accept='image/*,application/pdf'
                    onChange={(e) =>
                      handleFileChange(document?._id, e.target.files?.[0])
                    }
                  />
                  <CloudUpload className='w-6 h-6' />
                  Upload
                </label>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className='flex flex-row gap-4 '>
          <DialogClose asChild>
            <Button
              variant='outline'
              className='w-full md:h-[60px] rounded-[12px]'
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className='w-full md:h-[60px] rounded-[12px]'
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
