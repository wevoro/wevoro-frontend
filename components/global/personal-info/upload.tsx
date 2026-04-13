'use client';
import { Camera } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Upload = ({ image, register, imageFile, setValue }: any) => {
  const [imagePreview, setImagePreview] = useState<string | null>(image);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (typeof imageFile === 'object' && imageFile) {
      setImagePreview(URL.createObjectURL(imageFile));
    }
  }, [imageFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please drop an image file.', { position: 'top-center' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size should not exceed 3MB.', { position: 'top-center' });
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    if (setValue) {
      const dt = new DataTransfer();
      dt.items.add(file);
      setValue('image', dt.files, { shouldDirty: true });
    }
  };

  return (
    <div className='flex flex-col items-center justify-center'>
      <label
        htmlFor='profileImage'
        className={`cursor-pointer ${dragOver ? 'ring-2 ring-primary ring-offset-2 rounded-full' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={handleDrop}
      >
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
                <Camera className='w-5 h-5 text-[#6C6C6C]' />
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
          // onChange={handleImageChange}
        />
      </label>
    </div>
  );
};

export default Upload;
