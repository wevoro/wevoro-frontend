import Hero from '@/components/global/landing/v2/hero';
import Stats from '@/components/global/landing/v2/stats';
import Caregivers from '@/components/global/landing/v2/caregivers';
import Verified from '@/components/global/landing/v2/verified';
import Agencies from '@/components/global/landing/v2/agencies';
import BetaFocus from '@/components/global/landing/v2/beta-focus';
import Testimonials from '@/components/global/landing/v2/testimonials';
import ProviderNetwork from '@/components/global/landing/v2/provider-network';
import CtaBanner from '@/components/global/landing/v2/cta-banner';
import Faq from '@/components/global/landing/v2/faq';
import FinalCta from '@/components/global/landing/v2/final-cta';
import Reveal from '@/components/global/landing/v2/reveal';

export const metadata = {
  title: 'Wevoro — One Verified Credential Profile',
  description:
    'Caregivers build a single, verified credential profile. Agencies access it instantly. The 21-day document collection process becomes a thing of the past.',
};

export default function LandingV2() {
  return (
    <>
      {/* Sections below reveal their own header + cards (staggered) via <Reveal>
          internally. The single-block sections (cta / faq / final) are wrapped
          here so they reveal as one block. Hero stays static (above the fold). */}
      <Hero />
      <Stats />
      <div id='caregivers' className='scroll-mt-28'>
        <Caregivers />
      </div>
      <div id='how-it-works' className='scroll-mt-28'>
        <Verified />
      </div>
      <div id='agencies' className='scroll-mt-28'>
        <Agencies />
      </div>
      <BetaFocus />
      <Testimonials />
      <div id='credential-network' className='scroll-mt-28'>
        <ProviderNetwork />
      </div>
      <Reveal>
        <CtaBanner />
      </Reveal>
      <div id='faqs' className='scroll-mt-28'>
        <Reveal>
          <Faq />
        </Reveal>
      </div>
      <Reveal>
        <FinalCta />
      </Reveal>
    </>
  );
}
