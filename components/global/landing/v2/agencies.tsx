import Image from 'next/image';
import Link from 'next/link';
import { MoveRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bound, Eyebrow, Serif } from './shared';

const steps = [
  {
    n: 1,
    title: 'Caregiver Applies',
    text: 'A caregiver shares their WeVoro profile link with your team during the application process.',
  },
  {
    n: 2,
    title: 'Create Your Account',
    text: 'Click the link and create a free WeVoro agency account to access the full, verified credential pack.',
  },
  {
    n: 3,
    title: 'Review & Hire',
    text: 'Everything you need — licenses, certifications, background checks — verified and organized. Ready on day one.',
  },
];

export default function Agencies() {
  return (
    <section className='bg-white'>
      <Bound className='py-20 lg:py-24'>
        <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
          <div className='relative order-2 aspect-[603/452] overflow-hidden rounded-2xl bg-[#edf7f1] lg:order-1'>
            <Image
              src='/partners.webp'
              alt='Healthcare agency professional reviewing credentials'
              fill
              className='object-cover'
              sizes='(max-width: 1024px) 100vw, 50vw'
            />
            <div className='absolute inset-0 bg-gradient-to-br from-[#1a5c38]/20 to-transparent' />
          </div>

          <div className='order-1 lg:order-2'>
            <Eyebrow>For Agencies</Eyebrow>
            <h2 className='mt-4 text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-tertiary lg:text-[48px]'>
              Onboard in hours,
              <br />
              <Serif>not weeks.</Serif>
            </h2>
            <p className='mt-6 text-sm leading-[1.6] text-muted-foreground'>
              When a caregiver shares their WeVoro profile link, create a free
              agency account to unlock their full verified credential pack. No
              more chasing documents. No more 21-day delays.
            </p>

            <div className='mt-10 flex flex-col gap-8'>
              {steps.map((s) => (
                <div key={s.n} className='flex gap-5'>
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border bg-[#edf7f1] text-xs font-semibold text-primary',
                      'border-[#1a5c38]/[0.2]'
                    )}
                  >
                    {s.n}
                  </span>
                  <div>
                    <h3 className='text-sm font-semibold text-tertiary'>
                      {s.title}
                    </h3>
                    <p className='mt-1 text-xs leading-[1.6] text-muted-foreground'>
                      {s.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href='/partner/signup'
              className='group mt-10 inline-flex items-center gap-2 text-sm font-semibold text-primary'
            >
              Learn about agency access
              <MoveRight className='size-4 transition-transform group-hover:translate-x-1' />
            </Link>
          </div>
        </div>
      </Bound>
    </section>
  );
}
