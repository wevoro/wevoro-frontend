import Image from 'next/image';
import Link from 'next/link';
import { MoveUpRight } from 'lucide-react';
import { Bound, Serif } from './shared';

export default function CtaBanner() {
  return (
    <section className='relative flex min-h-[480px] items-center overflow-hidden'>
      <Image
        src='/home-grow.webp'
        alt=''
        fill
        className='object-cover'
        sizes='100vw'
      />
      <div className='absolute inset-0 bg-gradient-to-r from-[#01400f]/95 via-[#01400f]/75 to-[#01400f]/20' />
      <Bound className='relative w-full py-20 lg:py-[110px]'>
        <div className='max-w-xl'>
          <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.6px] text-white backdrop-blur-sm'>
            <span className='size-1.5 rounded-full bg-[#bbf8dc]' /> Beta Now Open
            — Limited Spots
          </span>
          <h2 className='mt-6 text-[40px] font-bold leading-[1.05] tracking-[-1.5px] text-white lg:text-[56px]'>
            Be First to
            <br />
            <Serif className='text-[#bbf8dc]'>Hire Without Waiting.</Serif>
          </h2>
          <p className='mt-6 text-sm leading-[1.7] text-white/80'>
            Caregivers: build your verified credential profile once and share it
            everywhere. Agencies: access a complete, pre-verified credential pack
            the moment a caregiver applies. No more 21-day delays. Join the beta
            and be part of what changes home care hiring.
          </p>
          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <Link
              href='/pro/signup'
              className='inline-flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90'
            >
              Join as Caregiver <MoveUpRight className='size-4' />
            </Link>
            <Link
              href='/partner/signup'
              className='inline-flex h-[50px] items-center justify-center rounded-[14px] border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10'
            >
              Join as Agency
            </Link>
          </div>
          <p className='mt-6 text-xs text-white/60'>
            Free for caregivers · No credit card required · Beta access, limited
            availability
          </p>
        </div>
      </Bound>
    </section>
  );
}
