import Image from 'next/image';
import Link from 'next/link';
import { CircleCheck, MoveUpRight } from 'lucide-react';
import { Bound, HAIRLINE, Serif } from './shared';
import { cn } from '@/lib/utils';

const trust = ['No setup fees', 'Free for caregivers', 'Instant sharing'];
const readiness = ['Profile Checked', 'Status Clear', 'Ready to Work'];

export default function Hero() {
  return (
    <section className='relative overflow-hidden bg-white pb-20 pt-10 lg:pb-28 lg:pt-20'>
      <Bound>
        <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
          {/* Left column */}
          <div className='flex flex-col items-start'>
            <span className='inline-flex items-center gap-2 rounded-full bg-[#edf7f1] px-3 py-1.5'>
              <span className='size-1.5 rounded-full bg-[#2e7d52]' />
              <span className='text-xs font-semibold uppercase tracking-[0.6px] text-[#2e7d52]'>
                Now in Beta
              </span>
            </span>

            <h1 className='mt-6 text-[clamp(30px,calc(5vw_-_10px),60px)] font-bold leading-[1.05] tracking-[-1.5px] text-tertiary'>
              One Verified
              <br />
              <Serif className='text-primary'>Credential Profile.</Serif>
              <br />
              Endless Opportunities.
            </h1>

            <p className='mt-8 max-w-[512px] text-base leading-[1.6] text-muted-foreground sm:text-lg'>
              Caregivers build a single, verified credential profile. Agencies
              access it instantly. The 21-day document collection process becomes
              a thing of the past.
            </p>

            <div className='mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
              <Link
                href='/pro/signup'
                className='inline-flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90'
              >
                Build Your Profile Free <MoveUpRight className='size-4' />
              </Link>
              <Link
                href='/partner/signup'
                className={cn(
                  'inline-flex h-[50px] items-center justify-center rounded-[14px] border px-6 text-sm font-semibold text-tertiary transition-colors hover:bg-[#f4f9f6]',
                  HAIRLINE
                )}
              >
                I&rsquo;m an Agency
              </Link>
            </div>

            <div className='mt-10 flex flex-wrap items-center gap-x-6 gap-y-3'>
              {trust.map((t) => (
                <span
                  key={t}
                  className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'
                >
                  <CircleCheck className='size-[13px] text-primary' />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right column — caregiver on green canvas + floating cards */}
          <div className='relative mx-auto w-full max-w-[560px] lg:mx-0'>
            <div className='relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#eef8f1_0%,#cdeed8_48%,#92d3aa_100%)]'>
              <Image
                src='/hero-caregiver.jpg'
                alt='Verified caregiver building their credential profile'
                fill
                className='object-cover object-[70%_center]'
                sizes='(max-width: 1024px) 90vw, 45vw'
                priority
              />
              {/* Figma overlay 1 — image green fade: top transparent → bottom #008000 @45% */}
              <div className='absolute inset-0 bg-gradient-to-b from-transparent to-primary/45' />
              {/* Figma overlay 2 — container tint: bottom #1A5C38 @30% → mid transparent → top #BBF8DC @10% */}
              <div className='absolute inset-0 bg-[linear-gradient(to_top,rgba(26,92,56,0.3)_0%,transparent_50%,rgba(187,248,220,0.1)_100%)]' />
            </div>

            {/* Live readiness card */}
            <div
              className={cn(
                'absolute left-0 top-[20%] hidden w-44 flex-col rounded-2xl border bg-white p-4 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.12)] md:flex lg:-left-6',
                HAIRLINE
              )}
            >
              <div className='flex items-center gap-2'>
                <span className='flex size-8 items-center justify-center rounded-[10px] bg-[#f9f9fa]'>
                  <CircleCheck className='size-4 text-primary' />
                </span>
                <span className='text-xs font-semibold text-tertiary'>
                  Live Readiness
                </span>
              </div>
              <div className='mt-3 flex flex-col gap-1.5'>
                {readiness.map((r) => (
                  <span
                    key={r}
                    className='inline-flex items-center gap-2 text-xs text-muted-foreground'
                  >
                    <CircleCheck className='size-[11px] shrink-0 text-primary' />
                    {r}
                  </span>
                ))}
                <span className='text-xs text-muted-foreground'>
                  100% visibility
                </span>
              </div>
            </div>

            {/* 21 -> 0 card */}
            <div className='absolute bottom-[9%] right-0 hidden w-44 flex-col rounded-2xl bg-primary p-4 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.12)] md:flex lg:-right-5'>
              <span className='text-[30px] font-bold leading-9 text-white'>
                21&rarr;0
              </span>
              <span className='mt-1 text-xs leading-4 text-[#bbf8dc]'>
                Days spent collecting credentials
              </span>
            </div>
          </div>
        </div>
      </Bound>
    </section>
  );
}
