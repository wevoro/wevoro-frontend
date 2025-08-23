'use client';
import Image from 'next/image';
import Link from 'next/link';
import { MoveLeft, MoveRight } from 'lucide-react';
import Container from '../container';

export default function WhyWevoro({
  source,
  getStartedPartnerText,
  getStartedProText,
  features,
  titleLight,
  titleBold,
  environmentType,
}: {
  source?: string;
  getStartedPartnerText?: string;
  getStartedProText?: string;
  features: any[];
  titleLight?: string;
  titleBold?: string;
  environmentType?: string;
}) {
  return (
    <Container className='md:my-24 my-16'>
      {source === 'pro' && (
        <h2 className='md:text-[45px] text-[31px] font-light text-green-900 md:leading-[54px] leading-[37.2px] text-center max-w-[509px] mx-auto transition-all duration-300 mb-12'>
          {titleLight} <span className='font-medium'>{titleBold}</span>
        </h2>
      )}
      {source === 'partner' && (
        <h2 className='md:text-[45px] text-[31px] font-light text-green-900 md:leading-[54px] leading-[37.2px] text-center max-w-[509px] mx-auto transition-all duration-300 mb-12'>
          {titleLight} <span className='font-medium'>{titleBold}</span>
        </h2>
      )}
      <div className='grid gap-9 md:grid-cols-3'>
        {features?.map((item, index) => (
          <div key={index} className='flex flex-col items-center text-center'>
            <div className=''>
              <Image
                src={item.img}
                alt={item.title}
                width={376}
                height={376}
                className='h-full w-full'
              />
            </div>
            <h3 className='md:mb-9 mb-6 md:text-[28px] text-lg font-semibold md:leading-[39.2px] leading-[25.2px] text-secondary max-w-[180px]'>
              {item.title}
            </h3>
            <p className='text-muted-foreground md:text-base text-sm max-w-[332px]'>
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {environmentType !== 'waitlist' && (
        <>
          {!source && (
            <div className='md:mt-20 mt-16 flex flex-col items-center justify-center md:gap-16 gap-14 sm:flex-row'>
              <Link
                href='/pro/signup'
                className='inline-flex items-center font-medium underline text-primary hover:text-primary/80'
              >
                <MoveLeft className='mr-3 size-6' />
                {getStartedProText}
              </Link>
              <Link
                href='/partner/signup'
                className='inline-flex items-center font-medium underline text-secondary hover:text-secondary/80'
              >
                {getStartedPartnerText}
                <MoveRight className='ml-3 size-6' />
              </Link>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
