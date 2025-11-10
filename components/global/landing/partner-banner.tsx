import React from 'react';
import Container from '../container';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import ProButton from './pro-button';

const PartnerBanner = ({ environmentType }: { environmentType: string }) => {
  return (
    <div className='partner-banner-bg'>
      <Container className='h-full w-full pt-32 pb-12 text-center relative z-10'>
        <div className='flex flex-col gap-9 max-w-4xl mx-auto'>
          <h1 className='md:text-[50px] text-[31px] font-light text-green-900 md:leading-[55px] leading-[34.1px]'>
            Looking for a CNA?{' '}
            <span className='font-medium'>
              Register now and review pro profiles all in one
            </span>
          </h1>
          <p className='md:text-lg text-sm text-[#6C6C6C]'>
            Create your profile and start exploring CNA profiles. Send your
            offers with potential CNA’s to accelerate your Job recruiting.
          </p>
          {environmentType !== 'waitlist' ? (
            <Button
              href='/partner/signup'
              className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto'
            >
              Get Started
            </Button>
          ) : (
            <ProButton />
          )}

          <div className='max-w-[982px] mx-auto w-full'>
            <Image
              src='https://res.cloudinary.com/dordkfpi1/image/upload/v1762799244/nbipkyu9w5untteuc6ut.png'
              alt='App Store'
              width={982}
              height={663}
              className='lg:w-[896px] lg:h-[663px]'
            />
          </div>

          {/* <div className='-mt-12 max-w-[471px] mx-auto'>
            <p className='text-[#6C6C6C] md:text-base text-sm'>Download Now</p>
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
          </div> */}
        </div>
      </Container>
    </div>
  );
};

export default PartnerBanner;
