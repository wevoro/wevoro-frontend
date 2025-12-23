'use client';

import React from 'react';
import Container from '../container';
import {
  PencilLine,
  IdCard,
  CloudUpload,
  FileText,
  Video,
  ScanQrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Features = ({ titleLight, titleBold, horizzonFeatures }: any) => {
  const data = [
    {
      icon: <PencilLine className='size-9 text-primary' />,
      bgColor: 'bg-[#BBF8DC]',
    },
    {
      icon: <IdCard className='size-9 text-primary' />,
      bgColor: 'bg-[#6ADD8D]',
    },
    {
      icon: <CloudUpload className='size-9 text-primary' />,
      bgColor: 'bg-[#BBF8DC]',
    },
    {
      icon: <FileText className='size-9 text-primary' />,
      bgColor: 'bg-[#6ADD8D]',
    },
    {
      icon: <Video className='size-9 text-primary' />,
      bgColor: 'bg-[#BBF8DC]',
    },
    {
      icon: <ScanQrCode className='size-9 text-primary' />,
      bgColor: 'bg-[#6ADD8D]',
    },
  ];

  const features = horizzonFeatures?.map((item: any, index: number) => ({
    icon: data[index].icon,
    bgColor: data[index].bgColor,
    ...item,
  }));

  return (
    <Container className='md:my-24 my-16 flex flex-col gap-12'>
      <h2 className='md:text-[45px] text-[31px] font-light text-secondary md:leading-[54px] leading-[37.2px] text-center max-w-[509px] mx-auto transition-all duration-300'>
        {titleLight} <span className='font-medium'>{titleBold}</span>
      </h2>

      <div className='grid md:grid-cols-3 gap-5'>
        {features?.map((item: any, index: number) => (
          <div
            key={index}
            className={cn(
              `bg-white p-4 md:px-9 md:py-12 gap-6 flex flex-col items-start justify-start md:min-h-[448px]`,
              item.bgColor
            )}
          >
            <div className='flex items-center justify-center md:mb-4 bg-white rounded-full size-[92px]'>
              {item.icon}
            </div>
            <h3 className='md:text-[22px] text-lg font-medium text-[#1C1C1C]'>
              {item.title}
            </h3>
            <p className='text-sm md:text-base text-[#1C1C1C]'>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default Features;
