'use client';

import React from 'react';
import Image from 'next/image';
import Container from '../container';
import { Button } from '@/components/ui/button';
import { scrollToSection } from '@/lib/utils';

const Grow = ({
  source,
  title,
  description,
  googlePlayLink,
  appStoreLink,
  buttonText,
  environmentType,
}: {
  source: string;
  title: string;
  description: string;
  googlePlayLink: string;
  appStoreLink: string;
  buttonText: string;
  environmentType: string;
}) => {
  const bgImage =
    source === 'partner'
      ? 'https://res.cloudinary.com/dordkfpi1/image/upload/v1762620586/mbicu1vgmn5fp22ipjdx.jpg'
      : source === 'pro'
        ? 'https://res.cloudinary.com/dordkfpi1/image/upload/v1762620588/pmumlbooyjhzv5ler1hu.png'
        : 'https://res.cloudinary.com/dordkfpi1/image/upload/v1762620587/rzdpdorgiagg4l7kk10w.png';

  const buttonHref = source === 'partner' ? '/partner/signup' : '/pro/signup';

  return (
    <div className='relative h-full w-full py-32'>
      <Image
        src={bgImage}
        alt='Grow background'
        fill
        className='object-cover object-center -z-10'
        priority
        quality={100}
      />
      <Container>
        <div className='max-w-xl flex flex-col gap-9 text-center md:text-left mx-auto md:mx-0'>
          <div>
            <h1 className='md:text-[50px] text-[34px] text-white md:leading-[60px] leading-[43.2px] font-semibold mb-3'>
              {title}
            </h1>
            <p className='md:text-lg text-sm text-[#FAFAFA]'>{description}</p>
          </div>
          {environmentType === 'waitlist' ? (
            <Button
              onClick={() => scrollToSection('joinwaitlist')}
              className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto md:mx-0'
            >
              Join the waitlist
            </Button>
          ) : (
            <Button
              href={buttonHref}
              className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto md:mx-0'
            >
              {buttonText}
            </Button>
          )}
          {/* {environmentType !== 'waitlist' && (
            <div>
              <p className='text-[#FAFAFA] text-base'>Download Now</p>
              <div className='flex md:space-x-6 pt-2 md:flex-row flex-col items-center'>
                <a href={appStoreLink} target='_blank'>
                  <img
                    src='/appstore-white.svg'
                    alt='Download on the App Store'
                    className='w-[174px] h-[72px] md:w-[223px] md:h-full'
                  />
                </a>
                <a href={googlePlayLink} target='_blank'>
                  <img
                    src='/playstore-white.svg'
                    alt='Get it on Google Play'
                    className='w-[174px] h-[72px] md:w-[223px] md:h-full'
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

export default Grow;
