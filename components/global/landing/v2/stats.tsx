import { cn } from '@/lib/utils';
import { Bound, HAIRLINE } from './shared';

const stats = [
  {
    value: '21',
    unit: 'days',
    text: 'Average credential collection time at agencies — we cut that to hours.',
  },
  {
    value: '100%',
    unit: '',
    text: 'Verification visibility — every document shows its status at a glance.',
  },
  {
    value: '1',
    unit: 'link',
    text: 'Is all a caregiver needs to share their entire credential history.',
  },
];

export default function Stats() {
  return (
    <section className={cn('border-y bg-[#f4f9f6]/40', HAIRLINE)}>
      <Bound className='py-16'>
        <div className='grid gap-8 sm:grid-cols-3 sm:gap-0'>
          {stats.map((s, i) => (
            <div
              key={s.value}
              className={cn(
                'flex flex-col',
                i > 0 && 'sm:pl-8',
                i < stats.length - 1 && cn('sm:border-r sm:pr-8', HAIRLINE)
              )}
            >
              <p className='flex items-end gap-1'>
                <span className='text-[48px] font-bold leading-none tracking-[-1.2px] text-primary'>
                  {s.value}
                </span>
                {s.unit && (
                  <span className='pb-0.5 text-xl font-semibold text-muted-foreground'>
                    {s.unit}
                  </span>
                )}
              </p>
              <p className='mt-3 max-w-[396px] text-sm leading-[1.6] text-muted-foreground'>
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </Bound>
    </section>
  );
}
