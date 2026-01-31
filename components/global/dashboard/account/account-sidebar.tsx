import React from 'react';
import ProfileImage from '../profile-image';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import ProfileName from '../profile-name';
import ProAccountInfo from './pro-account-info';
import { useAuthContext, useUserContext } from '@/lib/contexts';
import PartnerAccountInfo from './partner-account-info';

const AccountSidebar = () => {
  const { user, isUserLoading } = useUserContext();
  const { deleteAccount } = useAuthContext();
  const name =
    user?.personalInfo?.firstName && user?.personalInfo?.lastName
      ? `${user?.personalInfo?.firstName} ${user?.personalInfo?.lastName}`
      : 'N/A';
  const status = user?.status;
  const role = user?.role;

  if (isUserLoading) {
    return (
      <aside className='lg:px-6 2xl:px-10 py-10 2xl:py-20 bg-white flex flex-col gap-[52px] h-screen  overflow-y-auto scrollbar-hide'>
        <div className='flex flex-col gap-8 lg:pt-20'>
          <div className='flex flex-col gap-4'>
            <ProfileImage userProfileImage={'/dummy-profile-pic.jpg'} />
            <div className='flex flex-col gap-1 sm:gap-3 w-full'>
              <div className='w-full h-4 bg-gray-200 rounded-full animate-pulse'></div>
              <div className='flex justify-between flex-col gap-12'>
                <div className='w-full h-4 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='w-full h-4 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='w-full h-4 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='w-full h-4 bg-gray-200 rounded-full animate-pulse'></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }
  return (
    <aside className='lg:px-6 2xl:px-10 py-10 2xl:py-20 bg-white flex flex-col gap-[52px] h-screen  overflow-y-auto scrollbar-hide'>
      <div className='flex flex-col gap-8 lg:pt-20'>
        <div className='flex flex-col gap-4'>
          <ProfileImage userProfileImage={user?.personalInfo?.image} />
          <div className='flex flex-col gap-1 sm:gap-3 w-full'>
            <ProfileName name={name} status={status} role={role} />
            <div className='flex justify-between flex-col gap-12'>
              {user?.role === 'pro' && <ProAccountInfo />}
              {user?.role === 'partner' && <PartnerAccountInfo />}
              <Button
                variant='ghost'
                className='text-start text-red-500 font-medium w-max'
                onClick={deleteAccount}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AccountSidebar;
