import { useUserContext } from '@/lib/contexts';
import { Camera } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const ProfileImage = ({
  isProProfileFromPartner,
  isPublicProPage,
  isPartnerFromPro,
  userProfileImage,
}: {
  isProProfileFromPartner?: boolean;
  isPublicProPage?: boolean;
  isPartnerFromPro?: boolean;
  userProfileImage?: string;
}) => {
  const { refetchUser } = useUserContext();

  const [profileImage, setProfileImage] = useState(
    userProfileImage || '/dummy-profile-pic.jpg',
  );

  useEffect(() => {
    setProfileImage(userProfileImage || '/dummy-profile-pic.jpg');
  }, [userProfileImage]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        setProfileImage(imageUrl);
      }
      const formData = new FormData();

      formData.append('image', file!);

      const response = await fetch('/api/user/personal-information', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      if (responseData.status === 200) {
        refetchUser();
        toast.success('Profile image updated successfully!');
      } else {
        toast.error(responseData.message || 'Something went wrong!');
      }
    } catch (error: any) {
      console.log('inside catch', error);
      toast.error(error.message || 'Something went wrong!');
    }
  };

  return (
    <div className='relative w-[104px] h-[104px] md:w-52 md:h-52 group'>
      {!isProProfileFromPartner && !isPublicProPage && !isPartnerFromPro ? (
        <label className='cursor-pointer block relative w-full h-full' title='Click to change profile picture'>
          <input
            type='file'
            accept='image/*'
            onChange={handleImageUpload}
            className='hidden'
          />
          <img
            src={profileImage}
            alt='Profile'
            className='rounded-full w-full h-full object-cover p-1 bg-white transition-opacity group-hover:opacity-75'
          />
          <div className='absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all'>
            <Camera className='md:h-8 md:w-8 h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
          </div>
        </label>
      ) : (
        <img
          src={profileImage}
          alt='Profile'
          className='rounded-full w-full h-full object-cover p-1 bg-white'
        />
      )}
    </div>
  );
};

export default ProfileImage;
