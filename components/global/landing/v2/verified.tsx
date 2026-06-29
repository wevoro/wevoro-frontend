import Link from 'next/link';
import { CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bound, Eyebrow, HAIRLINE, Serif } from './shared';

const items = [
  'CNA / HHA License',
  'CPR Certification',
  'TB Test Results',
  'Background Check',
  'COVID Vaccination',
  'I-9 / Work Authorization',
];

export default function Verified() {
  return (
    <section className='bg-[#f4f9f6]/30'>
      <Bound className='py-20 lg:py-24'>
        <div className='grid items-start gap-10 lg:grid-cols-2 lg:gap-16'>
          <div>
            <Eyebrow>What Gets Verified</Eyebrow>
            <h2 className='mt-4 text-[30px] font-bold leading-[1.1] tracking-[-0.9px] text-tertiary lg:text-[36px]'>
              Everything an agency
              <br />
              <Serif>needs, in one place.</Serif>
            </h2>
            <p className='mt-6 max-w-[612px] text-sm leading-[1.6] text-muted-foreground'>
              WeVoro stores and organizes every document an agency will ever ask
              for. When you share your profile, they get instant access to a
              complete, verified credential pack — no back-and-forth, no waiting.
            </p>
            <Link
              href='/pro/signup'
              className='mt-8 inline-flex h-11 items-center rounded-[14px] bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90'
            >
              Start uploading credentials
            </Link>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            {items.map((it) => (
              <div
                key={it}
                className={cn(
                  'flex items-center gap-3 rounded-[14px] border bg-white p-4',
                  HAIRLINE
                )}
              >
                <CircleCheck className='size-4 shrink-0 text-primary' />
                <span className='text-sm font-medium text-tertiary'>{it}</span>
              </div>
            ))}
          </div>
        </div>
      </Bound>
    </section>
  );
}
