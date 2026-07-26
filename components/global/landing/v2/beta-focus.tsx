import { Building2, FileText, Share2, Zap } from 'lucide-react';
import { Bound, Serif } from './shared';
import Reveal from './reveal';

const cards = [
  {
    icon: FileText,
    title: 'Verified Credential Pack',
    text: 'Every document in a caregiver’s profile is verified before it reaches you. No fakes, no expired certificates, no surprises.',
  },
  {
    icon: Share2,
    title: 'One-Link Sharing',
    text: 'Caregivers share a single WeVoro link from any job board — Indeed, LinkedIn, or direct. You get full access in seconds.',
  },
  {
    icon: Building2,
    title: 'Agency Account Creation',
    text: 'Opening a caregiver’s profile creates your agency account. That’s how WeVoro grows — through the hiring flow, not a sales funnel.',
  },
  {
    icon: Zap,
    title: 'Instant Onboarding',
    text: 'The 21-day document collection process is replaced with immediate access to a complete, organized credential pack.',
  },
];

export default function BetaFocus() {
  return (
    <section className='bg-primary'>
      <Bound className='py-20 lg:py-24'>
        <div className='grid gap-6 lg:grid-cols-2 lg:items-end'>
          <Reveal>
            <span className='text-xs font-semibold uppercase tracking-[1.2px] text-[#bbf8dc]'>
              Beta Focus
            </span>
            <h2 className='mt-4 text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-white lg:text-[48px]'>
              Credential Sharing.
              <br />
              <Serif>Done right.</Serif>
            </h2>
          </Reveal>
          <Reveal>
            <p className='text-sm leading-[1.7] text-white/90 lg:pb-2'>
              Our beta focuses entirely on making credential sharing seamless for
              caregivers and agencies. Everything else comes after we nail this.
            </p>
          </Reveal>
        </div>

        <div className='mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {cards.map(({ icon: Icon, title, text }, i) => (
            <Reveal
              key={title}
              delay={i * 100}
              className='rounded-2xl border border-white/10 bg-white/[0.08] p-6'
            >
              <span className='flex size-11 items-center justify-center rounded-xl bg-white'>
                <Icon className='size-5 text-primary' />
              </span>
              <h3 className='mt-5 text-base font-semibold text-white'>{title}</h3>
              <p className='mt-2 text-xs leading-[1.7] text-white/80'>{text}</p>
            </Reveal>
          ))}
        </div>
      </Bound>
    </section>
  );
}
