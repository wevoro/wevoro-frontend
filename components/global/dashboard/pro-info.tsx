import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import React from 'react';
import ProfileName from './profile-name';
import ShareProfileModal from './share-profile-modal';

const ProInfo = ({ user, isProProfileFromPartner, isPublicProPage }: any) => {
  const personalInfo = user?.personalInfo;
  const status = user?.status;
  const role = user?.role;
  const name =
    personalInfo?.firstName && personalInfo?.lastName
      ? `${personalInfo?.firstName} ${personalInfo?.lastName}`
      : 'N/A';

  const shareLink = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${user?.shareId || user?._id}`
    : `/p/${user?.shareId || user?._id}`;

  return (
    <div className='flex flex-col gap-1 sm:gap-3 w-full'>
      <ProfileName
        name={name}
        role={role}
        status={status}
        isRecentlyActive={user?.isRecentlyActive}
        fromSpecialPage={isProProfileFromPartner || isPublicProPage}
      />
      <div className='flex justify-between lg:flex-row flex-col sm:gap-6 gap-3'>
        <div className='flex-1 flex flex-col sm:gap-3 gap-1'>
          <p className='text-base sm:text-xl text-[#3A4742] font-medium'>
          </p>

          {!isProProfileFromPartner && !isPublicProPage && (
            <div className='flex items-start sm:items-center sm:flex-row flex-col'>
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
          )}
        </div>
        {!isProProfileFromPartner && !isPublicProPage && (
          <div className='flex flex-col gap-3'>
            <p className='text-sm sm:text-base font-semibold text-tertiary'>
              Share Profile with Agencies
            </p>
            <ShareProfileModal shareLink={shareLink}>
              <Button
                className='w-fit gap-2 rounded-xl h-11 px-6'
                variant='default'
              >
                <Share2 className='w-4 h-4' />
                Share Profile
              </Button>
            </ShareProfileModal>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProInfo;

