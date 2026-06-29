import Link from 'next/link';
import { ChevronRight, MoveRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bound, HAIRLINE, Serif } from './shared';

export default function FinalCta() {
  return (
    <section className='bg-gradient-to-b from-[#f4f9f6] to-white'>
      <Bound className='py-20 text-center lg:py-28'>
        <h2 className='text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-tertiary lg:text-[48px]'>
          Start faster hiring
          <br />
          <Serif>today.</Serif>
        </h2>
        <p className='mx-auto mt-6 max-w-xl text-sm leading-[1.7] text-muted-foreground'>
          Caregivers build their profile for free. Agencies access verified
          credential packs the moment a caregiver shares their link. No setup
          fees. No long sales cycles.
        </p>
        <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Link
            href='/pro/signup'
            className='inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-6 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto'
          >
            I&rsquo;m a Caregiver — Build My Profile
            <MoveRight className='size-4 shrink-0' />
          </Link>
          <Link
            href='/partner/signup'
            className={cn(
              'inline-flex min-h-[50px] w-full items-center justify-center gap-1 rounded-[14px] border px-6 py-2 text-center text-sm font-semibold text-tertiary transition-colors hover:bg-[#f4f9f6] sm:w-auto',
              HAIRLINE
            )}
          >
            I&rsquo;m an Agency <ChevronRight className='size-4 shrink-0' />
          </Link>
        </div>
        <p className='mt-6 text-xs text-muted-foreground'>
          Free for caregivers · No credit card required
        </p>
      </Bound>
    </section>
  );
}
