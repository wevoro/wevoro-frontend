'use client';
import React from 'react';
import EditBtn from './edit-btn';
import Title from '../title';
import { MoreHorizontal } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import NoData from '../no-data';
import { cn } from '@/lib/utils';

const isImageFile = (file: string) => {
  const extension = file?.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = ['jpg', 'jpeg', 'png', 'svg'];
  return imageExtensions.includes(extension);
};

const getFileType = (file: string) => {
  const extension = file?.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = ['jpg', 'jpeg', 'png', 'svg'];

  if (imageExtensions.includes(extension)) {
    return extension.toUpperCase();
  } else if (extension === 'pdf') {
    return 'PDF';
  } else {
    return extension.toUpperCase() || 'FILE';
  }
};

const getFileIcon = (file: string) => {
  return isImageFile(file) ? '/image.svg' : '/file.svg';
};

const Documents: React.FC<{ proUser?: any; from?: string }> = ({
  proUser,
  from,
}) => {
  const { user } = useAppContext();
  const userData = proUser ? proUser : user;
  const documents = userData?.documents;

  const noData = !documents;

  const availableDocuments = [
    documents?.certificate && {
      name: 'Certificate',
      type: getFileType(documents?.certificate),
      image: getFileIcon(documents?.certificate),
      url: documents?.certificate,
    },
    documents?.resume && {
      name: 'Resume',
      type: getFileType(documents?.resume),
      image: getFileIcon(documents?.resume),
      url: documents?.resume,
    },
    documents?.governmentId && {
      name: 'Government ID',
      type: getFileType(documents?.governmentId),
      image: getFileIcon(documents?.governmentId),
      url: documents?.governmentId,
    },
  ].filter(Boolean);
  return (
    <div
      className={cn(
        'bg-white md:rounded-[16px]',
        from === 'admin' ? 'p-0' : 'px-4 p-6 md:p-8 '
      )}
    >
      <div className='flex items-center justify-between border-b pb-4 mb-8'>
        <Title text='Documents' className='mb-0 !text-lg md:!text-2xl' />
        {from !== 'admin' && <EditBtn href={`/pro/edit/documents?edit=true`} />}
      </div>

      {!noData ? (
        <div className='flex flex-wrap md:flex-nowrap gap-6'>
          {availableDocuments.map((document, index) => (
            <div
              onClick={() => {
                window.open(document.url, '_blank');
              }}
              key={index}
              className='flex flex-col justify-between p-4 md:p-8 border rounded-[24px] w-full h-32 md:h-48 cursor-pointer'
            >
              <div className='flex justify-between'>
                {isImageFile(document.url) ? (
                  <img
                    src={document.url}
                    alt={document.type}
                    className='size-[40px] md:size-[60px] mr-2 object-cover rounded-md'
                  />
                ) : (
                  <img
                    src={document.image}
                    alt={document.type}
                    className='size-[40px] md:size-[60px] mr-2'
                  />
                )}

                <MoreHorizontal className='size-4 md:size-8 cursor-pointer' />
              </div>

              <p className='text-sm md:text-lg font-medium text-[#1C1C1C]'>
                {document.name}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <NoData />
      )}
    </div>
  );
};

export default Documents;
