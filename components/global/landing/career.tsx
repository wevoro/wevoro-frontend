import React from 'react';
import Container from '../container';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import CareerButton from './career-button';

const Career = ({
  buttonText,
  titleLight,
  titleBold,
  description,
  badgeText,
  environmentType,
}: any) => {
  return (
    <Container className='py-20 flex gap-12 lg:flex-row flex-col-reverse items-center'>
      <Image src='/career.webp' alt='' width={643} height={515} />

      <div className='flex flex-col md:gap-10 gap-6'>
        <div className='flex flex-col gap-2 justify-center items-center md:items-start'>
          <Button className='bg-[#BBF8DC] text-secondary text-sm rounded-[32px] w-fit'>
            {badgeText}
          </Button>
          <h2 className='md:text-[45px] text-[31px] font-light text-green-900 md:leading-[49.5px] leading-[34.1px] text-center md:text-left transition-all duration-300'>
            <span className='font-medium'>{titleLight}</span> {titleBold}
          </h2>
        </div>
        <p className='md:text-lg text-sm text-[#6C6C6C] md:text-left text-center'>
          {description}
        </p>
        <CareerButton
          environmentType={environmentType}
          buttonText={buttonText}
        />
      </div>
    </Container>
  );
};

export default Career;
