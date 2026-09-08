'use client';

import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SCRUM-119 — the card form.
 *
 * Deliberately Stripe's INDIVIDUAL card elements (number / expiry / CVC) rather
 * than PaymentElement. PaymentElement renders whatever Stripe has enabled on the
 * account — Bank, Cash App Pay, Amazon Pay, Link, a country selector and a
 * "save my details" block — which is far more than the approved design and
 * buries the card entry the agency actually came for. These three elements give
 * exactly the three fields in the design, styled to match the rest of the page.
 *
 * Card data still lives inside Stripe's iframes, so raw numbers never touch
 * WeVoro's DOM, servers or logs.
 *
 * Stripe accepting the card is the BROWSER's word for it. It is reported as
 * "submitted" only; the caller then waits for the server before releasing
 * anything.
 */

const money = (cents?: number | null) =>
  cents === null || cents === undefined ? '—' : `$${(cents / 100).toFixed(2)}`;

/** One shared style so the three Stripe iframes match our own inputs. */
const elementStyle = {
  style: {
    base: {
      fontSize: '14px',
      color: '#1C1C1C',
      fontFamily: 'Poppins, system-ui, sans-serif',
      '::placeholder': { color: '#9CA3A0' },
    },
    invalid: { color: '#A72019', iconColor: '#A72019' },
  },
};

interface StripeCardFormProps {
  clientSecret: string;
  publishableKey: string;
  priceCents: number;
  /** Billing details, so the receipt carries who paid. */
  email?: string;
  onSubmitted: () => void;
  onFailed: (message: string) => void;
}

const CardFields: React.FC<Omit<StripeCardFormProps, 'clientSecret' | 'publishableKey'> & {
  clientSecret: string;
}> = ({ clientSecret, priceCents, email, onSubmitted, onFailed }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setBusy(true);
    try {
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: name || undefined,
            email: email || undefined,
          },
        },
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

  const field =
    'rounded-lg border border-[#DFE2E0] bg-white px-3.5 py-3.5 focus-within:border-[#008000]';

  return (
    <form onSubmit={submit}>
      {/* Card number — Stripe draws the brand icon on the right itself. */}
      <div className={field}>
        <CardNumberElement
          options={{ ...elementStyle, showIcon: true, placeholder: '1234 1234 1234 1234' }}
        />
      </div>

      <div className='mt-2.5 grid grid-cols-2 gap-2.5'>
        <div className={field}>
          <CardExpiryElement options={{ ...elementStyle, placeholder: 'MM / YY' }} />
        </div>
        <div className={field}>
          <CardCvcElement options={{ ...elementStyle, placeholder: 'CVC' }} />
        </div>
      </div>

      <label htmlFor='card-name' className='mt-4 block text-[13.5px] text-[#1C1C1C]'>
        Name on card
      </label>
      <input
        id='card-name'
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Full name'
        className='mt-1.5 w-full rounded-lg border border-[#DFE2E0] px-3.5 py-3 text-[14px] text-[#1C1C1C] outline-none placeholder:text-[#9CA3A0] focus:border-[#008000]'
      />

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
  // loadStripe injects a script tag, so it must not run on every render.
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  // Elements re-initialises whenever `options` is a new object, which tore the
  // form down and rebuilt it on every parent render. No clientSecret is passed
  // here on purpose: with individual card elements it is supplied at
  // confirmCardPayment instead, which keeps this object constant.
  const elementsOptions = useMemo(
    () => ({
      appearance: {
        theme: 'stripe' as const,
        variables: { colorPrimary: '#008000', fontFamily: 'Poppins, system-ui, sans-serif' },
      },
    }),
    []
  );

  if (!stripePromise || !clientSecret) {
    return (
      <p className='rounded-lg bg-[#FDF4E3] px-4 py-3 text-[13px] text-[#8A5D06]'>
        Card payment is unavailable right now. Please try again shortly.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <CardFields clientSecret={clientSecret} {...rest} />
    </Elements>
  );
};

export default StripeCardForm;
