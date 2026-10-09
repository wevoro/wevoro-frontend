import React from 'react';
import { useUserContext } from '@/lib/contexts';
import { caregiverShareLink, isSharingEnabled } from '@/lib/credentialing';
import ShareProfileGate from '../share-profile-gate';

const ProAccountInfo = () => {
  const { user } = useUserContext();
  // SCRUM-133: this box used to spell out /caregiver/<id> with a working Copy
  // button at ANY credential state — a second, ungated way to hand out the
  // profile, at an address the gate never controlled. It now gives out the
  // same /p/ link as the profile's share card, behind the same three states
  // (Locked / In review / Unlocked). SCRUM-156: the link comes from the shared
  // helper, so this box can no longer sit on a skeleton the profile never shows.
  const shareLink = caregiverShareLink(user);


  return (
    <>
      <div className='flex-1 flex flex-col sm:gap-3 gap-1'>
        {/* SCRUM-157: this read `personalInfo.companyName` — an agency field —
            so every caregiver saw "N/A". The role lives in professionalInfo. */}
        <p className='text-base sm:text-xl text-[#3A4742] font-medium'>
          {user?.professionalInfo?.role || 'N/A'}
        </p>

        <div className='flex flex-wrap items-start sm:items-center sm:flex-row flex-col'>
          <span className='text-sm text-[#6d6d6d] mr-6'>
            Profile Completion
          </span>
          <div className='flex items-center'>
            <div className='w-[185px] h-2 bg-[#FAFAFA] rounded-full overflow-hidden'>
              <div
                className='h-full'
                style={{
                  width: `${user?.completionPercentage}%`,
                  background:
                    'linear-gradient(90deg, #33B55B 0%, #008000 100%)',
                }}
              ></div>
            </div>
            <span className='text-sm text-[#3A4742] font-medium ml-2'>
              {user?.completionPercentage}%
            </span>
          </div>
        </div>
      </div>
      {isSharingEnabled() && (
      <div className='flex flex-col gap-3 flex-1' data-testid='settings-share-link'>
        <p className='text-sm sm:text-base font-semibold text-tertiary'>
          Share Link with Employers
        </p>
        {/* Unlocked: the same "Share Profile" button (and share window) as
            the profile header, instead of a separate link-and-Copy box. */}
        <ShareProfileGate
          userId={user?._id}
          shareLink={shareLink}
        />
      </div>
      )}
    </>
  );
};

export default ProAccountInfo;
