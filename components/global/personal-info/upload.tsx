'use client';
import { Camera } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const Upload = ({ image, register, imageFile }: any) => {
  const [imagePreview, setImagePreview] = useState<string | null>(image);

  // Update preview when image prop changes (e.g., from AI auto-fill or form reset)
  useEffect(() => {
    if (image && typeof image === 'string') {
      setImagePreview(image);
    } else if (!image) {
      setImagePreview(null);
    }
  }, [image]);

  // Update preview when a new file is selected
  useEffect(() => {
    if (typeof imageFile === 'object' && imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [imageFile]);

  return (
    <div className='flex flex-col items-center justify-center'>
      <label htmlFor='profileImage' className='cursor-pointer'>
        <div className='flex flex-col items-center gap-8'>
          <span className='text-gray-500'>Upload Your Profile Image</span>
          <div className='w-28 h-28 bg-white rounded-full flex items-center justify-center'>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt='Profile Preview'
                className='w-28 h-28 rounded-full object-cover'
              />
            ) : (
              <div className='bg-accent rounded-full w-9 h-9 flex items-center justify-center'>
                <Camera className='w-5 h-5 text-muted-foreground' />
              </div>
            )}
          </div>
        </div>
        <input
          type='file'
          id='profileImage'
          accept='image/*'
          className='hidden'
          {...register('image')}
        />
      </label>
    </div>
  );
};

export default Upload;
