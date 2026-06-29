import Link from 'next/link';
import { MoveRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bound, Eyebrow, HAIRLINE, Serif } from './shared';

const steps = [
  {
    n: '01',
    title: 'Build Your Profile',
    text: 'Upload your certifications, licenses, TB tests, background checks, and any other credentials into one secure, organized profile.',
  },
  {
    n: '02',
    title: 'Share With One Link',
    text: 'When you apply to a job on Indeed or anywhere else, attach your WeVoro profile link. No more digging through files or re-submitting paperwork.',
  },
  {
    n: '03',
    title: 'Get Hired Faster',
    text: 'Agencies receive your pre-verified credential pack instantly. The hiring process that used to take 21 days can start same day.',
  },
];

export default function Caregivers() {
  return (
    <section className='bg-white'>
      <Bound className='py-20 lg:py-24'>
        <Eyebrow>For Caregivers</Eyebrow>
        <h2 className='mt-4 text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-tertiary lg:text-[48px]'>
          Your credentials.
          <br />
          <Serif>Your career.</Serif>
        </h2>

        <div className='mt-16 grid gap-x-8 gap-y-12 md:grid-cols-3'>
          {steps.map((s) => (
            <div key={s.n} className='group relative flex flex-col pt-8'>
              <span className={cn('absolute left-0 top-0 h-px w-full', `bg-[#1a5c38]/[0.12]`)} />
              <span className='absolute left-0 top-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full' />
              <span className='font-mono text-xs text-muted-foreground'>
                {s.n}
              </span>
              <h3 className='mt-4 text-xl font-semibold text-tertiary'>
                {s.title}
              </h3>
              <p className='mt-3 text-sm leading-[1.6] text-muted-foreground'>
                {s.text}
              </p>
            </div>
          ))}
        </div>

        <Link
          href='/pro/signup'
          className='group mt-12 inline-flex items-center gap-2 text-sm font-semibold text-primary'
        >
          Create your free profile
          <MoveRight className='size-4 transition-transform group-hover:translate-x-1' />
        </Link>
      </Bound>
    </section>
  );
}
