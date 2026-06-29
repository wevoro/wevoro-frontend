import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bound, Eyebrow, HAIRLINE } from './shared';

const reviews = [
  {
    quote:
      'I used to resubmit the same documents to every agency. Now I send one link and they have everything they need.',
    name: 'Maria Santos',
    role: 'Certified Nursing Assistant, 7 years experience',
  },
  {
    quote:
      'The 21-day onboarding bottleneck has been the industry’s dirty secret for years. WeVoro actually solves it.',
    name: 'James Okonkwo',
    role: 'Staffing Director, CareFirst Agency',
  },
];

export default function Testimonials() {
  return (
    <section className='bg-white'>
      <Bound className='py-20 lg:py-24'>
        <div className='text-center'>
          <Eyebrow>Early Feedback</Eyebrow>
        </div>
        <div className='mt-10 grid gap-6 md:grid-cols-2'>
          {reviews.map((r) => (
            <div
              key={r.name}
              className={cn('rounded-2xl border bg-white p-8', HAIRLINE)}
            >
              <div className='flex gap-1'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className='size-4 fill-primary text-primary' />
                ))}
              </div>
              <p className='mt-5 text-base leading-[1.6] text-tertiary'>
                &ldquo;{r.quote}&rdquo;
              </p>
              <p className='mt-6 text-sm font-semibold text-tertiary'>{r.name}</p>
              <p className='text-xs text-muted-foreground'>{r.role}</p>
            </div>
          ))}
        </div>
      </Bound>
    </section>
  );
}
