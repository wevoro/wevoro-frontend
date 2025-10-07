'use client';

import React from 'react';
import Container from '../container';
import { Button } from '@/components/ui/button';
import { MoveUpRight } from 'lucide-react';
import { cn, scrollToSection } from '@/lib/utils';

const Banner = ({
  appStoreLink,
  buttonText,
  googlePlayLink,
  titleLight,
  titleBold,
  description,
  environmentType,
}: any) => {
  return (
    <div
      className={cn(
        'bg-[url("/banner-bg.png")] bg-cover bg-left md:bg-center bg-no-repeat h-full w-full py-32',
        environmentType === 'waitlist' && 'py-40'
      )}
    >
      <Container>
        <div className='max-w-md flex flex-col gap-9 text-center md:text-left mx-auto md:mx-0'>
          <h1 className='md:text-[50px] text-[31px] font-light text-green-900 md:leading-[55px] leading-[34.1px]'>
            {titleLight} <span className='font-medium'>{titleBold}</span>
          </h1>
          <p className='md:text-lg text-sm text-[#6C6C6C]'>{description}</p>
          <div className='flex flex-col md:flex-row gap-4'>
            {environmentType !== 'waitlist' && (
              <Button
                href='/pro/signup'
                className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto md:mx-0'
              >
                {buttonText}
              </Button>
            )}
            {environmentType === 'waitlist' && (
              <Button
                variant='outline'
                onClick={() => scrollToSection('joinwaitlist')}
                className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto md:mx-0 bg-transparent text-white hover:bg-primary hover:text-white hover:border-primary'
              >
                Join the Wait list <MoveUpRight className='w-6 h-6 ml-2' />
              </Button>
            )}
          </div>
          {/* {environmentType !== 'waitlist' && (
            <div className='mt-4'>
              <p className='text-[#6C6C6C] md:text-base text-sm'>
                Download Now
              </p>
              <div className='flex md:space-x-6 pt-2 md:flex-row flex-col justify-center items-center'>
                <a href={appStoreLink} target='_blank'>
                  <img
                    src='/app-store.svg'
                    alt='Download on the App Store'
                    className='w-[174px] h-[72px] md:w-full md:h-full'
                  />
                </a>
                <a href={googlePlayLink} target='_blank'>
                  <img
                    src='/playstore.svg'
                    alt='Get it on Google Play'
                    className='w-[174px] h-[72px] md:w-full md:h-full'
                  />
                </a>
              </div>
            </div>
          )} */}
        </div>
      </Container>
    </div>
  );
};

export default Banner;
