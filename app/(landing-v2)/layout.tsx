import React from 'react';
import Navbar from '@/components/global/navbar';
import Footer from '@/components/global/landing/v2/footer';
import { getEnvironment } from '@/app/actions';
import { transformEnvironment } from '@/utils/transformEnvironment';
import { dmSans, newsreader } from '@/components/global/landing/v2/fonts';

export default async function LandingV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const environment = await getEnvironment();
  const environmentType = transformEnvironment(environment?.environmentType);

  return (
    <div
      className={`${dmSans.variable} ${newsreader.variable}`}
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      <Navbar environmentType={environmentType} />
      <div className='mt-16'>{children}</div>
      <Footer />
    </div>
  );
}
