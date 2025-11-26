'use client';
import React from 'react';
import Container from '../container';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import CareerButton from './career-button';

const CareerPro = ({
  buttonText,
  titleLight,
  titleBold,
  description,
  subtitle,
  subDescription,
  proCategories,
  environmentType,
}: any) => {
  return (
    <div className='bg-[#BBF8DC] relative md:mt-56 my-16 min-h-[500px]'>
      <Container className='pt-20 pb-28'>
        <div className='flex gap-12 lg:flex-row flex-col items-center relative md:bottom-36 bottom-24'>
          <div className='flex flex-col md:gap-10 gap-6 mt-16 md:mt-32 xl:mt-16'>
            <h2 className='md:text-[45px] text-[31px] font-light text-green-900 md:leading-[49.5px] leading-[34.1px] text-center md:text-left transition-all duration-300'>
              <span className='font-medium'>{titleBold}</span> {titleLight}
            </h2>

            <p className='md:text-lg text-sm text-[#6C6C6C] md:text-left text-center'>
              {description}
            </p>
          </div>
          <Image
            src='/career-pro.webp'
            alt=''
            width={643}
            height={515}
            className='w-[500px] xl:w-[643px]  xl:-mt-0'
          />
        </div>

        <div className='-mt-10 md:-mt-16 flex flex-col justify-center items-center md:text-left text-center'>
          <h3 className='text-lg md:text-[28px] text-secondary leading-[19.8px] md:leading-[30.8px] mb-6'>
            {subtitle}
          </h3>
          <p className='md:text-lg text-sm text-[#6C6C6C] '>{subDescription}</p>
          <div className='grid md:grid-cols-3 lg:grid-cols-6 grid-cols-2 gap-3 mt-9'>
            {proCategories?.map((item: any) => (
              <div
                key={item}
                className='bg-white rounded-[12px] p-4 text-center lg:min-h-[240px] min-h-[180px] flex items-center justify-center'
              >
                <p className='text-secondary text-sm md:text-lg font-medium'>
                  {item.title}
                </p>
              </div>
            ))}
          </div>
          {environmentType !== 'waitlist' ? (
            <Button
              href='/pro/signup'
              className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto mt-10'
            >
              {buttonText}
            </Button>
          ) : (
            <div className='mt-10'>
              <CareerButton
                buttonText={buttonText}
                environmentType={environmentType}
              />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default CareerPro;
