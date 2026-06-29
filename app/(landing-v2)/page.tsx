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

export const metadata = {
  title: 'Wevoro — One Verified Credential Profile',
  description:
    'Caregivers build a single, verified credential profile. Agencies access it instantly. The 21-day document collection process becomes a thing of the past.',
};

export default function LandingV2() {
  return (
    <>
      <Hero />
      <Stats />
      <div id='how-it-works'>
        <Caregivers />
      </div>
      <Verified />
      <Agencies />
      <BetaFocus />
      <Testimonials />
      <div id='credential-network'>
        <ProviderNetwork />
      </div>
      <CtaBanner />
      <div id='faqs'>
        <Faq />
      </div>
      <FinalCta />
    </>
  );
}
