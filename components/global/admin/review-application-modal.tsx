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

// SCRUM-99 (Phase 4): human-readable labels for the CPR providers an agency
// accepts (stored as codes on personalInfo.acceptedCprProviders).
const CPR_LABELS: Record<string, string> = {
  red_cross: 'American Red Cross',
  aha: 'American Heart Association',
  hsi: 'Health & Safety Institute',
  any: 'Any accredited provider',
};

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <span className='font-medium'>{value?.trim() ? value : 'N/A'}</span>
    </div>
  );
}

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

              {/* SCRUM-99 (Phase 4): agency verification is a lookup, not an EIN.
                  Confirm these four fields against the Georgia Home Care Provider
                  Registry + the Secretary of State business search, then Approve
                  to mark the agency Confirmed (which unlocks the sensitive tier). */}
              {from === 'partner' && (
                <div className='flex flex-col gap-4 border border-gray-200 rounded-2xl p-5'>
                  <div>
                    <h2 className='text-lg font-semibold'>Verify this agency</h2>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Confirm the details below against the{' '}
                      <a
                        href='https://dch.georgia.gov/hfrd'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary underline underline-offset-2'
                      >
                        Georgia Home Care Provider Registry
                      </a>{' '}
                      and the{' '}
                      <a
                        href='https://ecorp.sos.ga.gov/BusinessSearch'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary underline underline-offset-2'
                      >
                        Secretary of State
                      </a>{' '}
                      business search. Approving marks the agency{' '}
                      <strong>Confirmed</strong> and unlocks sensitive credentials.
                    </p>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <InfoField
                      label='Contact Name'
                      value={`${localData?.personalInfo?.firstName || ''} ${
                        localData?.personalInfo?.lastName || ''
                      }`.trim()}
                    />
                    <InfoField
                      label='Agency Name'
                      value={localData?.personalInfo?.companyName}
                    />
                    <InfoField
                      label='City'
                      value={localData?.personalInfo?.address?.city}
                    />
                    <InfoField
                      label='State'
                      value={localData?.personalInfo?.address?.state}
                    />
                  </div>
                  {Array.isArray(
                    localData?.personalInfo?.acceptedCprProviders
                  ) &&
                    localData.personalInfo.acceptedCprProviders.length > 0 && (
                      <InfoField
                        label='CPR providers accepted'
                        value={localData.personalInfo.acceptedCprProviders
                          .map((c: string) => CPR_LABELS[c] || c)
                          .join(', ')}
                      />
                    )}

                  {/* Legacy accounts that submitted the old license/EIN form still
                      show that document, but it is no longer the basis for
                      verification. */}
                  {localData?.partnerVerification && (
                    <div className='flex flex-col gap-3 pt-1 border-t border-gray-100'>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3'>
                        <InfoField
                          label='State License / Certification #'
                          value={localData.partnerVerification.licenseNumber}
                        />
                        <InfoField
                          label='EIN (legacy)'
                          value={localData.partnerVerification.ein}
                        />
                      </div>
                      {localData.partnerVerification.licenseFile && (
                        <a
                          href={localData.partnerVerification.licenseFile}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-2 text-green-600 text-sm font-medium hover:underline'
                        >
                          <MoveUpRight className='size-4' />
                          License Document
                        </a>
                      )}
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
