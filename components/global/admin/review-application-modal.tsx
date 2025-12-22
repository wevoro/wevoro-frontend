'use client';

import {
  ArrowUpRight,
  Check,
  MoveUpRight,
  Pencil,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import PersonalInformation from '../dashboard/personal-information';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageModal } from './message-modal';
import { useAppContext } from '@/lib/context';
import ProfessionalInformation from '../dashboard/professional-information';
import Documents from '../dashboard/documents';
import AdminAlertModal from './admin-alert-modal';
import PartnerPersonalInformation from '../dashboard/partner-personal-information';
import { useUIContext } from '@/lib/contexts';

export function ReviewApplicationModal({
  open,
  onOpenChange,
  children,
  status,
  data,
  from,
}: any) {
  const { openEditModal, setAdminEditData } = useUIContext();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-full sm:max-w-[852px] p-4 sm:p-8'>
        <DialogHeader className='py-3'>
          <DialogTitle className='text-start text-xl font-semibold'>
            Application Details
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className='h-[70vh] sm:h-[80vh]'>
          <div>
            <div className='flex flex-col gap-4 sm:gap-6'>
              <div className='flex flex-col sm:flex-row items-start sm:justify-between'>
                <div className='flex gap-3 items-center'>
                  <Image
                    unoptimized
                    src={data?.personalInfo?.image || '/dummy-profile-pic.jpg'}
                    alt='Profile picture'
                    width={108}
                    height={108}
                    className='rounded-full object-cover size-20'
                  />
                  <div className='flex flex-col gap-2 sm:gap-3'>
                    <div className='font-semibold text-lg sm:text-xl'>
                      {data?.personalInfo?.firstName}{' '}
                      {data?.personalInfo?.lastName}
                    </div>
                    {/* <div className='text-muted-foreground'>
                      Latest Job Title

                    </div> */}
                  </div>
                </div>
                <div className='flex flex-wrap flex-row sm:flex-col gap-2 sm:gap-4 mt-4 sm:mt-0'>
                  {status === 'pending' && (
                    <div className='flex flex-row items-center gap-2 sm:gap-4'>
                      <AdminAlertModal alertType='approve' data={data}>
                        <Button
                          variant='default'
                          className='rounded-lg inline-flex items-center gap-2'
                        >
                          <Check className='size-4' />
                          Approve
                        </Button>
                      </AdminAlertModal>
                      <AdminAlertModal alertType='reject' data={data}>
                        <Button
                          variant='outline'
                          className='text-red-600 rounded-lg inline-flex items-center gap-2'
                        >
                          <X className='size-4' />
                          Reject
                        </Button>
                      </AdminAlertModal>
                    </div>
                  )}
                  <MessageModal data={data}>
                    <Button
                      variant='outline'
                      className='w-max sm:w-full rounded-lg inline-flex items-center gap-2'
                    >
                      Send a message
                      <MoveUpRight className='size-4' />
                    </Button>
                  </MessageModal>
                </div>
              </div>

              {status === 'approved' && (
                <div className='flex flex-row items-center gap-2 sm:gap-4'>
                  <Button
                    variant='outline'
                    className='w-full rounded-lg inline-flex items-center gap-2'
                    onClick={() => {
                      setAdminEditData({ data, source: 'pro' });
                      openEditModal(data, 'pro');
                    }}
                  >
                    <Pencil className='size-4' />
                    Edit
                  </Button>

                  <AdminAlertModal alertType='block' data={data}>
                    <Button
                      variant='outline'
                      className='w-full rounded-lg inline-flex items-center gap-2'
                      disabled={status === 'blocked'}
                    >
                      <UserX className='size-4' />
                      Block
                    </Button>
                  </AdminAlertModal>
                  <AdminAlertModal alertType='remove' data={data}>
                    <Button
                      variant='outline'
                      className='w-full rounded-lg text-red-600 inline-flex items-center gap-2'
                    >
                      <Trash2 className='size-4' />
                      Remove
                    </Button>
                  </AdminAlertModal>
                </div>
              )}

              <div className='flex flex-col gap-4 sm:gap-8 py-10'>
                {from === 'partner' ? (
                  <PartnerPersonalInformation from='admin' partnerUser={data} />
                ) : (
                  <PersonalInformation from='admin' proUser={data} />
                )}

                {from !== 'partner' && (
                  <>
                    <ProfessionalInformation from='admin' proUser={data} />
                    <Documents from='admin' proUser={data} />
                  </>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
