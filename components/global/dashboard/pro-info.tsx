import moment from 'moment';
import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import React from 'react';
import ProfileName from './profile-name';
import CopyApplyLink from './copy-apply-link';

const ProInfo = ({ user, isProProfileFromPartner, isPublicProPage }: any) => {
  const personalInfo = user?.personalInfo;
  const status = user?.status;
  const role = user?.role;
  const name =
    personalInfo?.firstName && personalInfo?.lastName
      ? `${personalInfo?.firstName} ${personalInfo?.lastName}`
      : 'N/A';

  // Figma "10. Profile": profession sits directly under the name (e.g. "CNA")
  const profession = user?.professionalInfo?.role;

  // Figma "CNA profile - Preview mode": a viewer sees a BACKGROUND CHECKED
  // pill beside the profession. The caregiver's own profile design omits it.
  const isBackgroundChecked =
    user?.professionalInfo?.gchexsStatus === 'yes' &&
    (isProProfileFromPartner || isPublicProPage);

  // No backend "rising" flag yet — treat accounts newer than 30 days as rising.
  const isRising =
    !!user?.createdAt && moment().diff(moment(user.createdAt), 'days') < 30;

  // Figma: the Copy Link column starts level with the NAME (design y=79),
  // not the pill row above it (y=40), so offset it when pills are present.
  const hasStatusPills = role === 'pro' && (isRising || !!user?.isRecentlyActive);

  const shareLink = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${user?.shareId || user?._id}`
    : `/p/${user?.shareId || user?._id}`;

  return (
    <div className='flex justify-between lg:flex-row flex-col gap-3 sm:gap-6 w-full'>
      <div className='flex-1 flex flex-col gap-1 sm:gap-3'>
        <ProfileName
          name={name}
          role={role}
          status={status}
          isRecentlyActive={user?.isRecentlyActive}
          isRising={isRising}
          fromSpecialPage={isProProfileFromPartner || isPublicProPage}
        />
        <div className='flex flex-col sm:gap-3 gap-1'>
          {profession && (
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-base sm:text-xl text-[#3A4742] font-medium'>
                {profession}
              </p>
              {isBackgroundChecked && (
                <>
                  <span className='text-[#3A4742]'>.</span>
                  <span className='flex items-center gap-2 rounded-lg bg-[#F9F9FA] px-3 py-1.5 text-xs font-medium text-[#3A4742]'>
                    <CheckCircle2 className='w-4 h-4 fill-[#008000] text-white' />
                    BACKGROUND CHECKED
                  </span>
                </>
              )}
            </div>
          )}

        </div>
      </div>
      {!isProProfileFromPartner && !isPublicProPage && (
        <div
          className={cn(
            'flex flex-col gap-4 w-full lg:max-w-[561px]',
            hasStatusPills && 'lg:mt-10',
          )}
        >
          <CopyApplyLink link={shareLink} />
        </div>
      )}
    </div>
  );
};

export default ProInfo;

