'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { isCheckoutReturn, stepBackPastCheckout } from '@/lib/checkout-return';

/**
 * SCRUM-172 / SCRUM-161: the page Stripe sends the agency back to.
 *
 * Stripe's return URL is the caregiver profile with ?payment=…&tx=…. The
 * profile used to render in full here — cover, avatar, action bar — and only
 * then step back in history to the page checkout started from, which renders
 * it all again: two draws of the same profile a few hundred milliseconds
 * apart, seen as a flash. And every data load the first draw had started was
 * cancelled by the step back.
 *
 * Now, while a checkout this tab started is returning, the dashboard shows
 * this quiet screen instead of the page and steps back from here. If the
 * history does not have the expected shape the outcome is shown in place, as
 * before, and the page renders normally.
 */
const CheckoutReturnScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useSearchParams();
  const outcome = params.get('payment');
  const tx = params.get('tx');
  const returning =
    !!tx && (outcome === 'success' || outcome === 'cancelled') && typeof window !== 'undefined'
      ? isCheckoutReturn()
      : false;
  // 'pending' until the effect has decided; 'leaving' while history.go runs;
  // 'inline' when the outcome has to be shown on this page after all.
  const [phase, setPhase] = useState<'pending' | 'leaving' | 'inline'>(
    returning ? 'pending' : 'inline'
  );

  useEffect(() => {
    if (phase !== 'pending' || !tx) return;
    if (stepBackPastCheckout(tx, outcome as 'success' | 'cancelled')) setPhase('leaving');
    else setPhase('inline');
  }, [phase, tx, outcome]);

  if (phase === 'inline') return <>{children}</>;

  return (
    <div
      className='flex min-h-[60vh] flex-col items-center justify-center gap-3 text-[#5E6864]'
      data-testid='checkout-returning'
    >
      <Loader2 className='size-6 animate-spin text-[#008000]' />
      <p className='text-sm'>Returning to WeVoro…</p>
    </div>
  );
};

export default CheckoutReturnScreen;
