'use client';
import React from 'react';
import EditBtn from './edit-btn';
import Title from '../title';
import { Download, Eye, MoreHorizontal } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import NoData from '../no-data';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/lib/contexts';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const handleDownload = async (url: string, name: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${name}.${url.split('.').pop()?.split('?')[0] || 'file'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.success('Download started!');
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
    toast.error('Could not download directly. Opened in new tab.');
  }
};

const Documents: React.FC<{ proUser?: any; from?: string }> = ({
  proUser,
  from,
}) => {
  const { user } = useUserContext();
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
          {availableDocuments.map((document: any, index) => (
            <div
              key={index}
              className='flex flex-col justify-between p-4 md:p-8 border rounded-[24px] w-full h-32 md:h-48 cursor-pointer hover:border-primary/30 transition-colors'
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

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <MoreHorizontal className='size-4 md:size-8 cursor-pointer hover:text-primary transition-colors' />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={() => window.open(document.url, '_blank')}
                    >
                      <Eye className='size-4 mr-2' />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={() =>
                        handleDownload(document.url, document.name)
                      }
                    >
                      <Download className='size-4 mr-2' />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
