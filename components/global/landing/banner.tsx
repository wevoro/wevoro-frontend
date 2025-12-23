'use client';

import React from 'react';
import Image from 'next/image';
import Container from '../container';
import { Button } from '@/components/ui/button';
import { MoveUpRight } from 'lucide-react';
import { cn, scrollToSection } from '@/lib/utils';

const Banner = ({
  appStoreLink,
  ctaCards,
  googlePlayLink,
  titleLight,
  titleBold,
  description,
  environmentType,
}: any) => {
  return (
    <div
      className={cn(
        'relative h-full w-full py-32',
        environmentType === 'waitlist' && 'py-40'
      )}
    >
      <Image
        src='/banner.webp'
        alt='Banner background'
        fill
        className='object-cover object-left md:object-center -z-10'
        priority
        quality={100}
      />
      <Container>
        <div className='max-w-3xl flex flex-col gap-9 text-center md:text-left mx-auto md:mx-0'>
          <h1 className='md:text-[50px] text-[31px] font-light text-secondary md:leading-[55px] leading-[34.1px]'>
            {titleLight} <span className='font-medium'>{titleBold}</span>
          </h1>
          <p className='md:text-lg text-sm text-[#6C6C6C]'>{description}</p>
        </div>

        <div className='flex flex-col md:flex-row gap-4 mt-12'>
          {ctaCards?.map((card: any, index: number) => (
            <div
              key={index}
              className='flex-1 rounded-[32px] bg-[#FCFCFEE5] p-6 md:p-14'
            >
              <div className='flex justify-center md:justify-start mb-3'>
                <span className='inline-flex w-fit px-6 py-3 rounded-full bg-[#BBF8DC] text-secondary text-sm font-medium uppercase tracking-[-2] '>
                  {card.badge}
                </span>
              </div>
              <h2 className='text-2xl md:text-4xl text-center md:text-left text-secondary mb-6'>
                {card.title}
              </h2>
              <ul className='space-y-3 text-[#6C6C6C]  tracking-[-2]  text-sm md:text-lg mb-8 flex-1'>
                {card.features?.map((feature: string, featureIndex: number) => (
                  <li key={featureIndex} className='flex items-start gap-2'>
                    <span className='text-[#1A5632]'>•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {environmentType !== 'waitlist' && (
                <Button
                  href={card.href}
                  className='px-6 md:px-9 h-12 md:h-14 rounded-[12px] w-full md:w-fit text-sm md:text-base font-semibold'
                >
                  {card.buttonText}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* {environmentType !== 'waitlist' && (
          <div className='mt-8'>
            <p className='text-white text-center md:text-base text-sm'>
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
      </Container>
    </div>
  );
};

export default Banner;
