'use client';

import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SCRUM-119 — the real card form.
 *
 * Card details are collected by Stripe's own PaymentElement inside an iframe,
 * so raw card numbers never touch WeVoro's DOM, our servers, or our logs. That
 * is a hard requirement of taking cards, not a preference.
 *
 * confirmPayment tells us the charge went through, but that is the BROWSER
 * talking. It is reported upward as "submitted", and the caller then waits for
 * the server — webhook or reconciliation — before anything is released.
 */

const money = (cents?: number | null) =>
  cents === null || cents === undefined ? '—' : `$${(cents / 100).toFixed(2)}`;

interface StripeCardFormProps {
  clientSecret: string;
  publishableKey: string;
  priceCents: number;
  /** Raised once Stripe accepts the card. Delivery still waits on the server. */
  onSubmitted: () => void;
  onFailed: (message: string) => void;
}

const CardFields: React.FC<Omit<StripeCardFormProps, 'clientSecret' | 'publishableKey'>> = ({
  priceCents,
  onSubmitted,
  onFailed,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        // Staying on the page keeps the modal's state machine intact; only a
        // payment method that truly needs a redirect will bounce out.
        redirect: 'if_required',
        confirmParams: { return_url: window.location.href },
      });

      if (error) {
        onFailed(error.message || 'Card declined');
        return;
      }
      onSubmitted();
    } catch {
      onFailed('Payment could not be completed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button
        type='submit'
        disabled={!stripe || busy}
        className='mt-5 h-12 w-full gap-2 rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
      >
        <Lock className='size-4' />
        {busy ? 'Processing…' : `Pay ${money(priceCents)} & download documents`}
      </Button>
      <p className='mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-[#6C6C6C]'>
        <Lock className='size-3' />
        Secure payment via Stripe · Charged once · Re-downloads are always free
      </p>
    </form>
  );
};

const StripeCardForm: React.FC<StripeCardFormProps> = ({
  clientSecret,
  publishableKey,
  ...rest
}) => {
  // loadStripe must not be called on every render — it injects a script tag.
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  if (!stripePromise || !clientSecret) {
    return (
      <p className='rounded-lg bg-[#FDF4E3] px-4 py-3 text-[13px] text-[#8A5D06]'>
        Card payment is unavailable right now. Please try again shortly.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#008000',
            colorText: '#1C1C1C',
            borderRadius: '8px',
            fontFamily: 'Poppins, system-ui, sans-serif',
          },
        },
      }}
    >
      <CardFields {...rest} />
    </Elements>
  );
};

export default StripeCardForm;
