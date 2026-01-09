import React from 'react';
import Container from '../container';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import ProButton from './pro-button';

const PartnerBanner = ({
  titleLight,
  titleBold,
  description,
  buttonText,
  environmentType,
  googlePlayLink,
  appStoreLink,
}: any) => {
  return (
    <div className='partner-banner-bg'>
      <Container className='h-full w-full pt-32 pb-12 text-center relative z-10'>
        <div className='flex flex-col gap-9 max-w-4xl mx-auto'>
          <h1 className='md:text-[50px] text-[31px] font-light text-secondary md:leading-[55px] leading-[34.1px]'>
            {titleLight} <span className='font-medium'>{titleBold}</span>
          </h1>
          <p className='md:text-lg text-sm text-muted-foreground'>
            {description}
          </p>
          {environmentType !== 'waitlist' ? (
            <Button
              href='/partner/signup'
              className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto'
            >
              {buttonText}
            </Button>
          ) : (
            <ProButton />
          )}

          <div className='max-w-[982px] mx-auto w-full'>
            <Image
              src='/partner-laptop.webp'
              alt='App Store'
              width={982}
              height={663}
              className='lg:w-[896px] lg:h-[663px]'
            />
          </div>

          {/* <div className='-mt-12 max-w-[471px] mx-auto'>
            <p className='text-muted-foreground md:text-base text-sm'>Download Now</p>
            <div className='flex md:space-x-6 pt-2 md:flex-row flex-col justify-center items-center'>
              <a href={appStoreLink} target='_blank' rel='noopener noreferrer'>
                <img
                  src='/app-store.svg'
                  alt='Download on the App Store'
                  className='w-[174px] h-[72px] md:w-full md:h-full'
                />
              </a>
              <a
                href={googlePlayLink}
                target='_blank'
                rel='noopener noreferrer'
              >
                <img
                  src='/playstore.svg'
                  alt='Get it on Google Play'
                  className='w-[174px] h-[72px] md:w-full md:h-full'
                />
              </a>
            </div>
          </div> */}
        </div>
      </Container>
    </div>
  );
};

export default PartnerBanner;
