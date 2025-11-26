'use client';
import React from 'react';
import Container from '../container';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CareerButton from './career-button';

const ExpandJob = ({
  description,
  partnerCategories,
  buttonText,
  titleLight,
  titleBold,
  subtitle,
  subDescription,
  environmentType,
}: any) => {
  return (
    <div className='bg-[#6ADD8D] relative my-16 min-h-[500px]'>
      <Container className='py-20'>
        <div className='flex gap-12 lg:flex-row flex-col items-center'>
          <div className='flex flex-col md:gap-10 gap-6'>
            <h2 className='md:text-[45px] text-[31px] font-light text-green-900 md:leading-[49.5px] leading-[34.1px] text-center md:text-left transition-all duration-300'>
              <span className='font-medium'>{titleBold}</span> {titleLight}
            </h2>

            <p className='md:text-lg text-sm text-[#1C1C1C] md:text-left text-center'>
              {description}
            </p>
          </div>
          <Image
            src='/expand.webp'
            alt=''
            width={643}
            height={515}
            className='w-[500px] xl:w-[643px]'
          />
        </div>

        <div className='mt-16 flex flex-col justify-center items-center md:text-left text-center'>
          <h3 className='text-lg md:text-[28px] text-secondary leading-[19.8px] md:leading-[30.8px] mb-6'>
            {subtitle}
          </h3>
          <p className='md:text-lg text-sm text-[#1C1C1C] '>{subDescription}</p>
          <div className='grid sm:grid-cols-2 grid-cols-1 gap-3 mt-9 w-full'>
            {partnerCategories?.map((item: any, index: number) => (
              <div
                key={index}
                className={cn(
                  'rounded-[12px] p-4 text-center lg:min-h-[152px] min-h-[120px] flex items-center justify-center',
                  index === 0 ? 'bg-[#BBF8DC]' : 'bg-white'
                )}
              >
                <div className='text-secondary text-lg font-medium'>
                  <p>
                    {item.title} <br />{' '}
                    <span style={{ fontWeight: '400', fontSize: '16px' }}>
                      {item.description}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          {environmentType !== 'waitlist' ? (
            <Button
              href='/partner/signup'
              className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto mt-10'
            >
              {buttonText}
            </Button>
          ) : (
            <div className='mt-10'>
              <CareerButton
                environmentType={environmentType}
                buttonText={buttonText}
              />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default ExpandJob;
