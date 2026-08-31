'use client';
import { Button } from '@/components/ui/button';
import React from 'react';
import EditBtn from './edit-btn';
import Title from '../title';
import NoData from '../no-data';
import { useUserContext } from '@/lib/contexts';

const Skills: React.FC<{ proUser?: any }> = ({ proUser }) => {
  const { user } = useUserContext();

  const userData = proUser ? proUser : user;
  const skills = userData?.professionalInfo?.skills;

  return (
    <div className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
      <div className='flex items-center justify-between border-b pb-4 mb-8'>
        <Title text='Skills' className='mb-0 !text-lg md:!text-2xl' />
        <EditBtn href={`/pro/edit/professional-information?edit=true#skills`} />
      </div>
      {skills ? (
        <div className='flex flex-wrap gap-3'>
          {skills.map((skill: string, index: number) => (
            <Button
              key={index}
              className='bg-accent text-tertiary text-xs md:text-lg h-8 md:h-12 rounded-xl'
              variant='ghost'
            >
              {skill}
            </Button>
          ))}
        </div>
      ) : (
        <NoData />
      )}
    </div>
  );
};

export default Skills;
