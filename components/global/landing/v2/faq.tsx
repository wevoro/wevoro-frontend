'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bound, Eyebrow, HAIRLINE, Serif } from './shared';

const faqs = [
  {
    q: 'Is WeVoro free for caregivers?',
    a: 'Yes — completely. Caregivers build, store, and share their verified credential profile for free. No setup fees, no subscription, and no credit card required.',
  },
  {
    q: 'How do agencies access a caregiver’s credentials?',
    a: 'When a caregiver shares their WeVoro profile link, you click it and create a free agency account. That instantly unlocks their full, verified credential pack — no chasing documents.',
  },
  {
    q: 'What does WeVoro charge agencies for?',
    a: 'During the beta, agency access is free while we focus on getting credential sharing right. Pricing for agencies will be introduced as we move beyond beta.',
  },
  {
    q: 'How does WeVoro verify credentials?',
    a: 'Every document — licenses, certifications, TB tests, background checks — is reviewed and verified before it appears in a caregiver’s shareable profile, so you never see fakes or expired certificates.',
  },
  {
    q: 'Can I use my WeVoro profile on job boards like Indeed?',
    a: 'Yes. Attach your WeVoro profile link to any application — Indeed, LinkedIn, or a direct email — and agencies get instant access to your complete credential pack.',
  },
  {
    q: 'What is the Credential Provider Network?',
    a: 'It’s what’s coming after beta: a network of clinics and schools offering caregivers discounted, bulk-rate access to CPR certifications, TB tests, CNA training, and renewals.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className='bg-white'>
      <Bound className='py-20 lg:py-24'>
        <div className='grid gap-12 lg:grid-cols-[340px_1fr] lg:gap-16'>
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className='mt-4 text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-tertiary lg:text-[48px]'>
              Questions
              <br />
              <Serif>answered.</Serif>
            </h2>
            <p className='mt-6 text-sm text-muted-foreground'>
              Still curious? Reach out at{' '}
              <a
                href='mailto:hello@wevoro.com'
                className='font-semibold text-primary hover:underline'
              >
                hello@wevoro.com
              </a>
            </p>
          </div>

          <div className='flex flex-col'>
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className={cn('border-b', HAIRLINE)}>
                  <button
                    type='button'
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-trigger-${i}`}
                    className='flex w-full items-center justify-between gap-4 py-5 text-left'
                  >
                    <span className='text-sm font-medium text-tertiary'>
                      {f.q}
                    </span>
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border',
                        HAIRLINE
                      )}
                    >
                      {isOpen ? (
                        <Minus className='size-3.5 text-primary' />
                      ) : (
                        <Plus className='size-3.5 text-muted-foreground' />
                      )}
                    </span>
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role='region'
                    aria-labelledby={`faq-trigger-${i}`}
                    className={cn(
                      'grid transition-all duration-300',
                      isOpen ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'
                    )}
                  >
                    <div className='overflow-hidden'>
                      <p className='pr-11 text-sm leading-[1.7] text-muted-foreground'>
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Bound>
    </section>
  );
}
