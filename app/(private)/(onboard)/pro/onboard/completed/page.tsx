import OnboardButton from '@/components/global/onboard-button';
import React from 'react';

const Completed = () => {
  return (
    <div className='flex items-center justify-center h-[calc(100vh-150px)]'>
      <div className='bg-white flex flex-col justify-center items-center gap-10 max-w-[780px] mx-auto h-auto w-full py-10'>
        <img
          src='/confetti.svg'
          alt='confetti'
          className='w-[116px] h-[114px] mx-auto'
        />
        <div className='text-center'>
          <h1 className='text-2xl leading-7 tracking-[0.5px] mb-4'>
            Congratulations!
          </h1>
          <p className='text-[32px] leading-9 font-semibold tracking-[0.5px]'>
            You’ve completed the process
          </p>
        </div>
        <OnboardButton text='View Job Prospects' href='/pro/profile' />
      </div>
    </div>
  );
};

export default Completed;
