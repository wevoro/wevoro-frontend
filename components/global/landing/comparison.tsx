/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
'use client';
import { Check, SquareCheck, SquareX, X } from 'lucide-react';
import Container from '../container';
import { cn } from '@/lib/utils';
import { RefObject, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function Comparison({
  titleLight,
  titleBold,
  comparisons,
}: any) {
  const heightRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLDivElement>(null)
  );

  const isMobile = useMediaQuery('(max-width: 768px)');

  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    const newHeights = heightRefs.map((ref) => ref.current?.offsetHeight || 0);
    setHeights(newHeights);
  }, [isMobile]);

  return (
    <Container className='pb-32'>
      <h2 className='md:text-[45px] text-[31px] font-light text-green-900 md:leading-[54px] leading-[37.2px] text-center transition-all duration-300 mb-32 md:max-w-none max-w-[343px] mx-auto'>
        <span className='font-medium'>{titleBold}</span> {titleLight}
      </h2>
      <div className='flex'>
        <div className='w-full'>
          <div className='space-y-'>
            {comparisons?.map(
              (
                { title, description }: { title: string; description: string },
                index: number
              ) => (
                <Feature
                  key={index}
                  heightRef={heightRefs[index]}
                  className={index >= 4 ? 'h-auto' : ''}
                  isFirst={index === 0}
                  title={title}
                  description={description}
                />
              )
            )}
          </div>
        </div>
        <div className='bg-primary text-white rounded-[32px] px-4 pt-8 pb-12 w-full md:max-w-[262px] max-w-[100px] mx-auto -mt-20'>
          <h2 className='text-lg md:text-[28px] text-center font-normal mb-4'>
            Wevoro
          </h2>
          <div className='space-y-'>
            {Array.from({ length: comparisons?.length }).map((_, index) => (
              <div
                key={index}
                className='px-0 md:px-6 py-6 w-full flex items-center justify-center'
                style={{ height: heights[index] }}
              >
                <SquareCheck className='size-8 mx-auto text-[#BBF8DC]' />
              </div>
            ))}
          </div>
        </div>
        <div className='w-full -mt-12'>
          <h2 className='md:text-2xl text-lg text-center font-normal mb-4 md:hidden'>
            Comp.
          </h2>
          <h2 className='md:text-2xl text-lg text-center font-normal mb-4 md:block hidden'>
            Competitors
          </h2>
          <div className='space-y-'>
            <Checkmark isFirst={true} height={heights[0]} />
            <Cross height={heights[1]} />
            <Cross height={heights[2]} />
            <Cross height={heights[3]} />
            {/* <Cross height={heights[3]} />
            <Cross height={heights[4]} />
            <Checkmark height={heights[5]} /> */}
          </div>
        </div>
      </div>
    </Container>
  );
}

function Feature({
  title,
  description,
  isFirst,
  className,
  heightRef,
}: {
  title: string;
  description?: string;
  isFirst?: boolean;
  className?: string;
  heightRef?: RefObject<HTMLDivElement>;
}) {
  return (
    <div
      className={cn(
        'pl-0 md:pl-6 pr-3 md:pr-6 py-6 w-full flex flex-col justify-center border-b border-primary',
        isFirst && 'border-t',
        className
      )}
      ref={heightRef}
    >
      <h3 className='font-normal md:text-[25px] text-lg pb-2'>{title}</h3>
      {description && (
        <p className='md:text-base text-xs text-[#6C6C6C]'>{description}</p>
      )}
    </div>
  );
}

function Checkmark({
  isFirst,
  className,
  height,
}: {
  isFirst?: boolean;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn(
        'px-0 md:px-6 py-6 w-full flex items-center justify-center border-b border-primary',
        isFirst && 'border-t',
        className
      )}
      style={{ height }}
    >
      <SquareCheck className='size-8 mx-auto text-secondary' />
    </div>
  );
}

function Cross({
  isFirst,
  className,
  height,
}: {
  isFirst?: boolean;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn(
        'px-0 md:px-6 py-6 w-full flex items-center justify-center border-b border-primary',
        isFirst && 'border-t',
        className
      )}
      style={{ height }}
    >
      <SquareX className='size-8 mx-auto text-red-600' />
    </div>
  );
}
