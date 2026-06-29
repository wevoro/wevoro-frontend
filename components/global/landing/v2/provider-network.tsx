import { BadgeCheck, Clock, FileText, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bound, HAIRLINE, Serif } from './shared';

const cards = [
  {
    icon: Shield,
    title: 'CPR & First Aid',
    sub: 'Group rates at certified providers',
  },
  { icon: BadgeCheck, title: 'TB Testing', sub: 'Clinic network near you' },
  {
    icon: Users,
    title: 'CNA Training',
    sub: 'Accredited programs, bulk pricing',
  },
  {
    icon: FileText,
    title: 'Annual Renewals',
    sub: 'Reminders + discounted access',
  },
];

export default function ProviderNetwork() {
  return (
    <section className='bg-white'>
      <Bound className='py-20 lg:py-24'>
        <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
          <div>
            <span className='inline-flex items-center gap-2 rounded-full bg-[#edf7f1] px-3 py-1.5 text-xs font-semibold text-[#2e7d52]'>
              <Clock className='size-3.5' /> Coming After Beta
            </span>
            <h2 className='mt-5 text-[30px] font-bold leading-[1.15] tracking-[-0.9px] text-tertiary lg:text-[36px]'>
              The Credential
              <br />
              <Serif>Provider Network</Serif>
            </h2>
            <p className='mt-6 text-sm leading-[1.7] text-muted-foreground'>
              Caregivers need ongoing CPR certifications, TB tests, CNA training
              renewals — and they pay retail for each one. WeVoro is building a
              network of clinics and schools, negotiating bulk group pricing
              because we represent a large pool of caregivers. You get the right
              provider at a discounted rate. The future of credentialing, not
              just storing it.
            </p>
          </div>

          <div className='grid gap-5 sm:grid-cols-2'>
            {cards.map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className={cn('rounded-2xl border bg-white p-6', HAIRLINE)}
              >
                <Icon className='size-6 text-primary' />
                <h3 className='mt-5 text-base font-semibold text-tertiary'>
                  {title}
                </h3>
                <p className='mt-1 text-xs text-muted-foreground'>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </Bound>
    </section>
  );
}
