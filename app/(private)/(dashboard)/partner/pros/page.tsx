import { getAllAvailablePros } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, MapPin, MoveUpRight, ShieldCheck, Users, XCircle } from 'lucide-react';
import React from 'react';
import { redirect } from 'next/navigation';
import { isCredentialingMode } from '@/lib/credentialing';

const PartnerPros = async () => {
  // SCRUM-88: the scheduling-era Available Caregivers surface must not render at
  // all in credentialing mode. Removing the "Pros" nav tab left this route live
  // and still reachable by direct link or redirect, so gate the route itself.
  // Returning before the fetch also keeps caregiver data from being queried.
  if (isCredentialingMode()) {
    redirect('/partner/onboardings');
  }

  let pros: any[] = [];
  try {
    pros = (await getAllAvailablePros()) || [];
  } catch (error) {
    console.error('Error fetching pros:', error);
    pros = [];
  }

  if (!pros || pros.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 py-20 bg-white md:rounded-[16px]'>
        <Users className='size-16 text-muted-foreground/40' />
        <h3 className='text-lg font-semibold text-tertiary'>No Caregivers Found</h3>
        <p className='text-sm text-muted-foreground text-center max-w-md'>
          No approved caregivers are available at the moment. Caregivers will appear here once they sign up and get approved.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between px-4 md:px-0'>
        <h2 className='text-lg font-semibold text-tertiary'>
          Available Caregivers ({pros.length})
        </h2>
      </div>

      {pros?.map((pro: any, index: number) => {
        const role = pro?.professionalInfo?.role || pro?.professionalInfo?.caregiverType || 'Caregiver';
        const creds = pro?.credentialSummary || { total: 0, verified: 0, pending: 0, rejected: 0 };

        return (
          <div key={index} className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
            <div className='flex flex-col gap-4 w-full'>
              {/* Header: Name, Role, View Profile */}
              <div className='flex xs:flex-row flex-col justify-between gap-4 xs:items-center'>
                <div className='flex items-center gap-3'>
                  <img
                    src={pro?.personalInfo?.image || '/dummy-profile-pic.png'}
                    alt={pro?.personalInfo?.firstName || 'Caregiver'}
                    width={58}
                    height={58}
                    className='w-12 h-12 sm:size-[58px] rounded-full object-cover'
                  />
                  <div>
                    <div className='flex items-center gap-2'>
                      <h2 className='text-base sm:text-lg text-tertiary font-semibold'>
                        {pro?.personalInfo?.firstName || ''} {pro?.personalInfo?.lastName || ''}
                      </h2>
                      {/* Role Badge */}
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary'>
                        {role}
                      </span>
                    </div>
                    <p className='text-muted-foreground text-xs sm:text-sm flex items-center gap-1.5'>
                      <MapPin className='size-4 flex-shrink-0' />{' '}
                      {pro?.personalInfo?.address?.city &&
                        `${pro.personalInfo.address.city}, `}
                      {pro?.personalInfo?.address?.state &&
                        `${pro.personalInfo.address.state}, `}
                      {pro?.personalInfo?.address?.country || ''}
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Button
                    href={`/partner/pros/${pro._id}`}
                    variant='outline'
                    className='h-10 md:h-12 rounded-[12px] w-fit text-xs md:text-base'
                  >
                    View Profile
                    <MoveUpRight className='size-4 ml-2' />
                  </Button>
                </div>
              </div>

              {/* Credential Status Summary */}
              {creds.total > 0 && (
                <div className='flex flex-wrap gap-3 items-center'>
                  <span className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Credentials:</span>
                  {creds.verified > 0 && (
                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'>
                      <CheckCircle className='size-3.5' />
                      {creds.verified} Verified
                    </span>
                  )}
                  {creds.pending > 0 && (
                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200'>
                      <Clock className='size-3.5' />
                      {creds.pending} Pending
                    </span>
                  )}
                  {creds.rejected > 0 && (
                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200'>
                      <XCircle className='size-3.5' />
                      {creds.rejected} Rejected
                    </span>
                  )}
                  {creds.total > 0 && creds.verified === 0 && creds.pending === 0 && creds.rejected === 0 && (
                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200'>
                      <FileText className='size-3.5' />
                      {creds.total} Documents
                    </span>
                  )}
                </div>
              )}
              {creds.total === 0 && (
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Credentials:</span>
                  <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200'>
                    No credentials uploaded
                  </span>
                </div>
              )}

              {/* Bio */}
              {pro?.personalInfo?.bio && (
                <p
                  className='text-sm md:text-base text-muted-foreground line-clamp-2'
                  dangerouslySetInnerHTML={{
                    __html: pro.personalInfo.bio,
                  }}
                />
              )}

              {/* Skills */}
              <div className='flex flex-wrap gap-2 items-center'>
                {pro?.professionalInfo?.skills
                  ?.slice(0, 8)
                  .map((skill: string, index: number) => (
                    <span
                      key={index}
                      className='bg-accent text-tertiary text-xs px-3 py-1.5 rounded-full'
                    >
                      {skill}
                    </span>
                  ))}
                {pro?.professionalInfo?.skills?.length > 8 && (
                  <span className='text-xs text-muted-foreground'>
                    +{pro?.professionalInfo?.skills?.length - 8} more
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 w-auto'>
                <div className='flex flex-col gap-1'>
                  <p className='text-muted-foreground text-xs'>Email</p>
                  <p className='text-tertiary font-medium text-sm'>
                    {pro?.email}
                  </p>
                </div>
                <div className='flex flex-col gap-1'>
                  <p className='text-muted-foreground text-xs'>Phone</p>
                  <p className='text-tertiary font-medium text-sm'>
                    {pro?.personalInfo?.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PartnerPros;
