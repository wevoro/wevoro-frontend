'use client';

import {
  Check,
  MoveUpRight,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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

import ProfessionalInformation from '../dashboard/professional-information';
import AdminAlertModal from './admin-alert-modal';
import PartnerPersonalInformation from '../dashboard/partner-personal-information';
import { AdminEditUserModal } from './admin-edit-user-modal';
import AdminCredentials from './admin-credentials';
import DownloadAuditTrail from './download-audit-trail';
import { toast } from 'sonner';

function BackgroundChecks({
  data,
  onStatusChange,
}: {
  data: any;
  onStatusChange: (status: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(
    data?.backgroundCheckStatus ?? 'not_verified'
  );

  const handleUpdate = async (newStatus: 'verified' | 'failed') => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/background-check', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data._id,
          backgroundCheckStatus: newStatus,
        }),
      });
      const result = await res.json();
      if (result.status === 200) {
        toast.success(
          newStatus === 'verified'
            ? 'Background check verified'
            : 'Background check failed'
        );
        setStatus(newStatus);
        onStatusChange(newStatus);
      } else {
        toast.error(result.message || 'Update failed');
      }
    } catch {
      toast.error('Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='border border-gray-200 rounded-2xl p-5'>
      <h3 className='font-semibold text-gray-900 text-base mb-3'>
        Background Checks
      </h3>
      <div className='flex items-center justify-between gap-4'>
        <p className='text-sm text-gray-500'>
          Is this user verified as having passed the background check?{' '}
          <a
            href='https://www.checkr.com'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary underline underline-offset-2'
          >
            Verify now
          </a>
        </p>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            disabled={loading}
            onClick={() => handleUpdate('verified')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              status === 'verified'
                ? 'bg-primary text-white'
                : 'text-green-500 hover:bg-green-50'
            }`}
          >
            <Check className='w-4 h-4' />
          </button>
          <button
            disabled={loading}
            onClick={() => handleUpdate('failed')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              status === 'failed'
                ? 'bg-red-500 text-white'
                : 'text-red-400 hover:bg-red-50'
            }`}
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReviewApplicationModal({
  open,
  onOpenChange,
  children,
  status,
  data,
  from,
}: any) {
  const [localData, setLocalData] = useState(data);

  // Keep localData in sync when data prop changes (e.g. parent refetch)
  if (data?._id !== localData?._id) {
    setLocalData(data);
  }

  const jobTitle =
    localData?.professionalInfo?.experience?.[0]?.jobTitle ?? '';

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
          <div className='pr-2'>
            <div className='flex flex-col gap-5'>
              {/* Header: avatar + name/title + action buttons */}
              <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
                <div className='flex gap-3 items-center'>
                  <Image
                    unoptimized
                    src={
                      localData?.personalInfo?.image ||
                      '/dummy-profile-pic.jpg'
                    }
                    alt='Profile picture'
                    width={108}
                    height={108}
                    className='rounded-full object-cover size-20'
                  />
                  <div className='flex flex-col gap-1'>
                    <p className='font-semibold text-xl'>
                      {localData?.personalInfo?.firstName}{' '}
                      {localData?.personalInfo?.lastName}
                    </p>
                    {jobTitle && (
                      <p className='text-muted-foreground text-sm'>
                        {jobTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex flex-wrap flex-row sm:flex-col gap-2 sm:gap-3'>
                  {(localData?.status === 'pending' ||
                    localData?.status === 'in-review') && (
                    <div className='flex flex-row items-center gap-2'>
                      <AdminAlertModal alertType='approve' data={localData}>
                        <Button
                          variant='default'
                          className='rounded-lg inline-flex items-center gap-2'
                        >
                          <Check className='size-4' />
                          Approve
                        </Button>
                      </AdminAlertModal>
                      <AdminAlertModal alertType='reject' data={localData}>
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
                  <MessageModal data={localData}>
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

              {/* Edit / Block / Remove row */}
              {localData?.status !== 'removed' && (
                <div className='flex flex-row items-center gap-2'>
                  <AdminEditUserModal data={localData}>
                    <Button
                      variant='outline'
                      className='w-full rounded-lg inline-flex items-center gap-2'
                    >
                      <Pencil className='size-4' />
                      Edit
                    </Button>
                  </AdminEditUserModal>

                  {/* Blocked accounts previously showed no control at all here,
                      leaving no way back. Offer the inverse action instead. */}
                  {localData?.status === 'blocked' ? (
                    <AdminAlertModal alertType='unblock' data={localData}>
                      <Button
                        variant='outline'
                        className='w-full rounded-lg inline-flex items-center gap-2'
                      >
                        <UserCheck className='size-4' />
                        Unblock
                      </Button>
                    </AdminAlertModal>
                  ) : (
                    <AdminAlertModal alertType='block' data={localData}>
                      <Button
                        variant='outline'
                        className='w-full rounded-lg inline-flex items-center gap-2'
                      >
                        <UserX className='size-4' />
                        Block
                      </Button>
                    </AdminAlertModal>
                  )}
                  <AdminAlertModal alertType='remove' data={localData}>
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

              {/* Partner verification info */}
              {from === 'partner' && localData?.partnerVerification && (
                <div className='flex flex-col gap-4'>
                  <h2 className='text-lg font-semibold'>
                    Verification Information
                  </h2>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm text-muted-foreground'>
                        State License / Certification Number *
                      </span>
                      <span className='font-medium'>
                        {localData.partnerVerification.licenseNumber || 'N/A'}
                      </span>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm text-muted-foreground'>
                        EIN (Employer Identification Number) *
                      </span>
                      <span className='font-medium'>
                        {localData.partnerVerification.ein || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {localData.partnerVerification.licenseFile && (
                    <div className='flex items-center gap-3 p-4 border rounded-lg bg-gray-50'>
                      <div className='flex items-center justify-center w-10 h-10 bg-red-100 rounded'>
                        <span className='text-[10px] font-bold text-red-600'>
                          PDF
                        </span>
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium'>License Document</p>
                      </div>
                      <a
                        href={localData.partnerVerification.licenseFile}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-2 text-green-600 text-sm font-medium hover:underline'
                      >
                        <MoveUpRight className='size-4' />
                        Download
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Pro: Background Checks + Credentials */}
              {from !== 'partner' && (
                <>
                  <BackgroundChecks
                    data={localData}
                    onStatusChange={(s) =>
                      setLocalData((prev: any) => ({
                        ...prev,
                        backgroundCheckStatus: s,
                      }))
                    }
                  />
                  <AdminCredentials
                    userId={localData?._id}
                    role={localData?.professionalInfo?.role}
                  />
                  <DownloadAuditTrail userId={localData?._id} />
                </>
              )}

              {/* Profile info sections */}
              <div className='flex flex-col gap-6 pt-2'>
                {from === 'partner' ? (
                  <PartnerPersonalInformation
                    from='admin'
                    partnerUser={localData}
                  />
                ) : (
                  <PersonalInformation from='admin' proUser={localData} />
                )}

                {from !== 'partner' && (
                  <ProfessionalInformation from='admin' proUser={localData} />
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
