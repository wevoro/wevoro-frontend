import React from 'react';
import Container from '../container';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import ProButton from './pro-button';

const ProBanner = ({
  titleLight,
  titleBold,
  description,
  buttonText,
  environmentType,
}: any) => {
  return (
    <div className='pro-banner-bg'>
      <Container className='h-full w-full pt-32 pb-12 text-center'>
        <div className='flex flex-col gap-9 max-w-4xl mx-auto'>
          <h1 className='md:text-[50px] text-[31px] font-light text-green-900 md:leading-[55px] leading-[34.1px]'>
            {titleLight}
            <span className='font-medium'>{titleBold}</span>
          </h1>
          <p className='md:text-lg text-sm text-[#6C6C6C]'>{description}</p>
          {environmentType === 'waitlist' ? (
            <ProButton />
          ) : (
            <Button
              href='/pro/signup'
              className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto'
            >
              {buttonText}
            </Button>
          )}

          <div className='max-w-[982px] mx-auto w-full'>
            <Image
              src='https://res.cloudinary.com/dordkfpi1/image/upload/v1762799351/iyprmer783qxodsd35kj.png'
              alt='App Store'
              width={982}
              height={663}
              className='lg:w-[896px] lg:h-[663px]'
            />
          </div>

          {/* {environmentType !== 'waitlist' && (
            <div className='-mt-12 max-w-[471px] mx-auto'>
              <p className='text-[#6C6C6C] md:text-base text-sm'>
                Download Now
              </p>
              <div className='flex md:space-x-6 pt-2 md:flex-row flex-col justify-center items-center'>
                <img
                  src='/app-store.svg'
                  alt='Download on the App Store'
                  className='w-[174px] h-[72px] md:w-full md:h-full'
                />
                <img
                  src='/playstore.svg'
                  alt='Get it on Google Play'
                  className='w-[174px] h-[72px] md:w-full md:h-full'
                />
              </div>
            </div>
          )} */}
        </div>
      </Container>
    </div>
  );
};

export default ProBanner;
