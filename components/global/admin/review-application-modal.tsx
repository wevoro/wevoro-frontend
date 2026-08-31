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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const handleUpdate = async (
    newStatus: 'verified' | 'failed' | 'not_verified'
  ) => {
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
        // Wording describes the DECISION, not the outcome of the request.
        // This previously said "Background check failed" on a green success
        // toast, which read as if the save itself had errored.
        toast.success(
          newStatus === 'verified'
            ? 'Background check approved'
            : newStatus === 'failed'
              ? 'Background check rejected'
              : 'Background check decision cleared'
        );
        setStatus(newStatus);
        onStatusChange(newStatus);
      } else {
        toast.error(result.message || 'Could not update the background check');
      }
    } catch {
      toast.error('Could not update the background check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SCRUM-109: rebuilt to the design. Pending shows Approve / Reject; once
  // decided it collapses to a status pill plus the date it was approved.
  const decided = status === 'verified' || status === 'failed';
  const approved = status === 'verified';
  const decidedOn = data?.backgroundCheckUpdatedAt || data?.updatedAt;

  return (
    <div className='flex flex-col gap-4 rounded-xl border border-[#DFE2E0] bg-white p-5'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-3'>
          <h3 className='text-base font-semibold leading-6 text-[#1C1C1C]'>Background check</h3>
          {decided && (
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1.5 text-xs font-medium leading-[18px] ${
                approved ? 'bg-[#F2F4F3] text-[#008000]' : 'bg-[#FDE8E8] text-[#D14343]'
              }`}
            >
              {approved ? 'Approved' : 'Rejected'}
            </span>
          )}
          {!decided && (
            <span className='inline-flex shrink-0 items-center rounded-full bg-[#FEF6E7] px-2.5 py-1.5 text-xs font-medium leading-[18px] text-[#A9700B]'>
              Pending review
            </span>
          )}
        </div>
        <p className='text-[13px] leading-5 text-[#5E6864]'>
          {decided
            ? `The background check was completed manually and ${approved ? 'approved' : 'rejected'} by an admin.`
            : 'Complete the background check manually, then approve or reject the application.'}
        </p>
      </div>

      {decided ? (
        <div className='flex items-center gap-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-[11px] font-medium leading-4 text-[#5E6864]'>
              {approved ? 'APPROVED ON' : 'REJECTED ON'}
            </span>
            <span className='text-sm font-medium leading-[21px] text-[#1C1C1C]'>
              {decidedOn
                ? new Date(decidedOn).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          {/* A menu, not a toggle. This button used to flip the decision the
              instant it was clicked, so opening it to see the options silently
              turned an approval into a rejection. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                disabled={loading}
                className='inline-flex h-[38px] w-[47px] items-center justify-center rounded-[10px] border border-[#B0BCB8] bg-white text-[#1C1C1C] transition-colors hover:bg-gray-50 disabled:opacity-60'
              >
                •••
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-52'>
              <DropdownMenuItem
                onClick={() => handleUpdate(approved ? 'failed' : 'verified')}
                className='cursor-pointer'
              >
                {approved ? 'Change to rejected' : 'Change to approved'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdate('not_verified')}
                className='cursor-pointer text-red-600 focus:text-red-600'
              >
                Undo decision
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className='flex items-center gap-2.5'>
          <button
            type='button'
            disabled={loading}
            onClick={() => handleUpdate('verified')}
            className='inline-flex h-[38px] items-center justify-center rounded-[10px] bg-[#008000] px-5 text-[13px] font-medium leading-5 text-white transition-colors hover:bg-[#026a02] disabled:opacity-60'
          >
            Approve
          </button>
          <button
            type='button'
            disabled={loading}
            onClick={() => handleUpdate('failed')}
            className='inline-flex h-[38px] items-center justify-center rounded-[10px] border border-[#E7A6A6] bg-white px-5 text-[13px] font-medium leading-5 text-[#D14343] transition-colors hover:bg-red-50 disabled:opacity-60'
          >
            Reject
          </button>
        </div>
      )}
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

  // Keep localData in sync when the data prop changes — including a STATUS change
  // after an Approve/Reject refetch, not only a different _id. Without the status
  // check the header kept showing Approve/Reject after the admin already approved.
  if (data?._id !== localData?._id || data?.status !== localData?.status) {
    setLocalData(data);
  }

  // Once a decision is made, show the outcome badge instead of Approve/Reject.
  const decisionBadge = (
    {
      approved: {
        label: 'Approved',
        cls: 'text-green-700 bg-green-50 border-green-200',
      },
      rejected: {
        label: 'Rejected',
        cls: 'text-red-700 bg-red-50 border-red-200',
      },
      blocked: {
        label: 'Blocked',
        cls: 'text-gray-700 bg-gray-100 border-gray-300',
      },
      removed: {
        label: 'Removed',
        cls: 'text-gray-700 bg-gray-100 border-gray-300',
      },
    } as Record<string, { label: string; cls: string }>
  )[localData?.status];

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
                  {localData?.status === 'pending' ||
                  localData?.status === 'in-review' ? (
                    <div className='flex flex-row items-center gap-2'>
                      {/* Design uses a softer green up here than the solid
                          #008000 on the Background-check button below. */}
                      <AdminAlertModal alertType='approve' data={localData}>
                        <Button
                          variant='default'
                          className='rounded-lg inline-flex items-center gap-2 bg-[#8CC891] text-white hover:bg-[#7ABA80]'
                        >
                          <Check className='size-4' />
                          Approve
                        </Button>
                      </AdminAlertModal>
                      <AdminAlertModal alertType='reject' data={localData}>
                        <Button
                          variant='outline'
                          className='rounded-lg inline-flex items-center gap-2 border-[#DFE2E0] text-[#E94435] hover:bg-red-50'
                        >
                          <X className='size-4' />
                          Reject
                        </Button>
                      </AdminAlertModal>
                    </div>
                  ) : (
                    decisionBadge && (
                      <div
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${decisionBadge.cls}`}
                      >
                        {localData?.status === 'approved' ? (
                          <Check className='size-4' />
                        ) : (
                          <X className='size-4' />
                        )}
                        {decisionBadge.label}
                      </div>
                    )
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

              {/* Edit / Block / Remove row.
                  Design: while an application is still awaiting a decision the
                  header carries only Approve / Reject / Send a message. These
                  account-management controls appear once it has been decided
                  (the "Pro Details" view). */}
              {localData?.status !== 'removed' &&
                localData?.status !== 'pending' &&
                localData?.status !== 'in-review' && (
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

              {/* SCRUM-107: Registry Confirmation Status (Faisal's design). Two GA
                  sources, each Confirmed (green) / Can't find (red). NOTE — the
                  automated check is a STOPGAP: per the SCRUM-106 discovery neither
                  GA source exposes a usable public API (the SoS business search is a
                  captcha'd web form; the Home Care Registry is a directory), so the
                  status currently reflects the agency's confirmation state. The admin
                  verifies each source via its "Check" link and makes the final
                  Approve/Reject call (buttons above). Wire the real API check here
                  once a data source is identified. */}
              {from === 'partner' && (
                <div className='flex flex-col gap-4 border border-gray-200 rounded-2xl p-5'>
                  <div>
                    <h2 className='text-lg font-semibold'>
                      Registry Confirmation Status
                    </h2>
                    {(localData?.personalInfo?.companyName ||
                      localData?.personalInfo?.address?.city ||
                      localData?.personalInfo?.address?.state) && (
                      <p className='text-sm text-muted-foreground mt-1'>
                        Looking up{' '}
                        <strong>
                          {localData?.personalInfo?.companyName || 'this agency'}
                        </strong>
                        {[
                          localData?.personalInfo?.address?.city,
                          localData?.personalInfo?.address?.state,
                        ].filter(Boolean).length
                          ? ` · ${[
                              localData?.personalInfo?.address?.city,
                              localData?.personalInfo?.address?.state,
                            ]
                              .filter(Boolean)
                              .join(', ')}`
                          : ''}
                      </p>
                    )}
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm text-muted-foreground'>
                        Georgia Home Care Provider
                      </span>
                      <div className='flex items-center gap-3'>
                        {localData?.status === 'approved' ? (
                          <span className='text-green-600 font-semibold text-sm'>
                            Confirmed
                          </span>
                        ) : (
                          <span className='text-red-600 font-semibold text-sm'>
                            Can&apos;t find
                          </span>
                        )}
                        <a
                          href='https://dch.georgia.gov/hfrd'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary text-xs underline underline-offset-2 inline-flex items-center gap-1'
                        >
                          Check <MoveUpRight className='size-3' />
                        </a>
                      </div>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm text-muted-foreground'>
                        Georgia Secretary of State business
                      </span>
                      <div className='flex items-center gap-3'>
                        {localData?.status === 'approved' ? (
                          <span className='text-green-600 font-semibold text-sm'>
                            Confirmed
                          </span>
                        ) : (
                          <span className='text-red-600 font-semibold text-sm'>
                            Can&apos;t find
                          </span>
                        )}
                        <a
                          href='https://ecorp.sos.ga.gov/BusinessSearch'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary text-xs underline underline-offset-2 inline-flex items-center gap-1'
                        >
                          Check <MoveUpRight className='size-3' />
                        </a>
                      </div>
                    </div>
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
                  <p className='text-xs text-muted-foreground'>
                    Automated status is a stopgap — confirm each source via its
                    link, then Approve or Reject above.
                  </p>
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
