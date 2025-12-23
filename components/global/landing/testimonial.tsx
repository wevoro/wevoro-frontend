import React from 'react';
import Container from '../container';
import Image from 'next/image';
import { Star } from 'lucide-react';

const Testimonial = ({
  source,
  personName,
  titleLight,
  titleBold,
  description,
}: {
  source: 'home' | 'partner' | 'pro';
  personName: string;
  titleLight: string;
  titleBold: string;
  description: string;
}) => {
  return (
    // <div className='bg-[url("/testimonial-bg.png")] bg-auto bg-center bg-no-repeat py-32'>
    <Container className='py-28 px-0 sm:px-0 lg:px-8 bg-[url("/testimonial-bg-mobile.svg")] md:bg-[url("/testimonial-bg.svg")] bg-auto bg-center bg-no-repeat'>
      <div
        className='text-center'
        style={{
          background:
            'linear-gradient(90deg, #FFFFFF 0%, rgba(255, 255, 255, 0.6) 25%, #FFFFFF 50%, rgba(255, 255, 255, 0.6) 75%, #FFFFFF 100%)',
        }}
      >
        <h2 className='md:text-[48px] text-[31px] font-light text-secondary md:leading-[57.6px] leading-[37.2px] max-w-[780px] mx-auto transition-all duration-300 relative'>
          <span className='font-medium'>
            <img
              src='/quote.svg'
              alt='quote'
              className='absolute left-10 md:left-[unset] bottom-[90px] md:bottom-[70px] md:size-[unset] w-20 h-12'
            />
            {titleBold}
          </span>
          <br />
          {titleLight}
        </h2>
        <div className='relative mt-16'>
          <Image
            src={
              source === 'partner'
                ? '/partner-testimonial-phone.webp'
                : '/testimonial-phone.webp'
            }
            alt='testimonial phone'
            width={300}
            height={600}
            className='mx-auto'
          />
          <div
            className='absolute -bottom-8 left-1/2 transform -translate-x-1/2 p-4 w-full min-h-[242px] flex items-center justify-center flex-col testimonial-gradient'
            style={{
              background:
                'linear-gradient(90deg, rgba(0, 128, 0, 0) 0%, rgba(0, 128, 0, 0.475) 16.67%, rgba(0, 128, 0, 0.76) 33.33%, rgba(0, 128, 0, 0.95) 50%, rgba(0, 128, 0, 0.76) 66.67%, rgba(0, 128, 0, 0.475) 83.33%, rgba(0, 128, 0, 0) 100%)',
            }}
          >
            <div className='flex justify-evenly max-w-[826px] mx-auto w-full relative'>
              <img
                src='/quote-green.svg'
                alt='quote'
                className='absolute md:w-[79px] md:h-[56px] w-[31px] h-[23px] md:-top-4 -top-8 left-0'
              />
              <div className='max-w-[426px] mx-auto flex items-center justify-center flex-col md:gap-9 gap-4'>
                <p className='text-white font-normal md:text-base text-sm'>
                  {description}
                </p>
                <div className='flex items-center gap-3'>
                  <Image
                    src='/user.png'
                    alt='Profile picture'
                    width={60}
                    height={60}
                    className='rounded-full md:size-[60px] size-[48px] object-cover'
                  />

                  <div className='flex flex-col gap-1'>
                    <h3 className='text-white font-semibold md:text-xl text-sm'>
                      {personName}
                    </h3>
                    <div className='flex gap-0.5'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className='md:size-4 size-3 fill-[#FF9100] stroke-[#FF9100]'
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <img
                src='/quote-green.svg'
                alt='quote'
                className='absolute md:w-[106px] md:h-[76px] w-[56px] h-[40px] md:bottom-6 -bottom-8 right-0 rotate-180'
              />
            </div>
          </div>
        </div>
      </div>
    </Container>
    // </div>
  );
};

export default Testimonial;
