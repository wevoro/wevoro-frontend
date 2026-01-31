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
    <div className='relative w-[104px] h-[104px] md:w-52 md:h-52'>
      <img
        src={profileImage}
        alt='Profile'
        className='rounded-full w-full h-full object-cover p-1 bg-white'
      />
      {!isProProfileFromPartner && !isPublicProPage && !isPartnerFromPro && (
        <label className='absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-tertiary p-1 rounded-full cursor-pointer md:w-14 md:h-14 w-7 h-7 sm:w-10  sm:h-10 flex items-center justify-center text-white'>
          <input
            type='file'
            accept='image/*'
            onChange={handleImageUpload}
            className='hidden'
          />
          <Camera className='md:h-6 md:w-6 sm:h-5 sm:w-5 h-4 w-4' />
        </label>
      )}
    </div>
  );
};

export default ProfileImage;
