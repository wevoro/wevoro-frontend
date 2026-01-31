import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

import { useUserContext } from '@/lib/contexts';

const Cover = ({
  isProProfileFromPartner,
  isPublicProPage,
  isPartnerFromPro,
  userCoverImage,
}: {
  isProProfileFromPartner: boolean;
  isPublicProPage: boolean;
  isPartnerFromPro: boolean;
  userCoverImage: string;
}) => {
  const { refetchUser } = useUserContext();
  const [coverImage, setCoverImage] = useState(userCoverImage || '/cover.png');

  useEffect(() => {
    setCoverImage(userCoverImage || '/cover.png');
  }, [userCoverImage]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        setCoverImage(imageUrl);
      }
      const formData = new FormData();

      formData.append('coverImage', file!);

      const response = await fetch('/api/user/cover-image', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      if (responseData.status === 200) {
        refetchUser();
        toast.success('Cover image updated successfully!');
      } else {
        toast.error(responseData.message || 'Something went wrong!');
      }
    } catch (error: any) {
      console.log('inside catch', error);
      toast.error(error.message || 'Something went wrong!');
    }
  };

  return (
    <div className='relative w-full h-[150px] md:h-[250px] lg:h-[319px] '>
      {!isProProfileFromPartner && !isPublicProPage && !isPartnerFromPro && (
        <label className='absolute z-10 top-4 md:top-8 left-4 md:left-8 cursor-pointer flex items-center space-x-2 bg-gray-500/20 backdrop-blur-md p-1.5 md:p-2 rounded-lg md:rounded-[16px] text-white text-xs md:text-sm font-normal'>
          <input
            type='file'
            accept='image/*'
            onChange={handleImageUpload}
            className='hidden'
          />

          <Camera className='h-4 w-4 md:h-6 md:w-6' />
          <span>Cover Image</span>
        </label>
      )}
      <Image
        src={coverImage}
        alt='Cover'
        layout='fill'
        objectFit='cover'
        className='md:rounded-t-[16px] bg-gray-50'
        loading='lazy'
      />
    </div>
  );
};

export default Cover;
