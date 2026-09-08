'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CreditCard,
  Download,
  Loader2,
  Lock,
  Mail,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StripeCardForm from './stripe-card-form';

/**
 * SCRUM-119 — the payment gate.
 *
 * A state machine over the five screens in the approved design. The states are
 * driven by the server, never assumed: 'success' is only entered once the
 * backend reports the transaction paid, because a browser saying it paid is not
 * evidence of anything.
 *
 * The summary deliberately separates what is being PAID for (the credential
 * packet) from what is INCLUDED (e-signature tracking), which is acceptance
 * criterion #7 — the agency must never think they are buying signatures.
 */

type GateState = 'form' | 'processing' | 'success' | 'payment-failed' | 'delivery-failed';

const money = (cents?: number | null) =>
  cents === null || cents === undefined ? '—' : `$${(cents / 100).toFixed(2)}`;

const firstName = (full?: string) => (full || '').trim().split(/\s+/)[0] || 'this caregiver';

interface PaymentGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caregiverId: string;
  caregiverName?: string;
  caregiverImage?: string;
  caregiverRole?: string;
  caregiverLocation?: string;
  /** Called after a confirmed payment so the caller can retry the download. */
  onPaid?: () => void | Promise<void>;
}

/** The Wevoro lockup that sits above the card on every state. */
const Wordmark = () => (
  <div className='mb-6 flex items-center justify-center gap-3'>
    <span className='flex size-11 items-center justify-center rounded-full bg-[#22B14C] text-[20px] font-semibold text-white'>
      W
    </span>
    <span className='text-[22px] font-bold text-[#1C1C1C]'>Wevoro</span>
  </div>
);

/** The included-not-charged row. Present on the form and the receipt. */
const EsignRow: React.FC<{ subtitle: string }> = ({ subtitle }) => (
  <div className='flex items-center justify-between gap-3 rounded-lg border border-[#DFE2E0] px-4 py-3'>
    <div className='min-w-0'>
      <p className='text-[14px] font-semibold text-[#1C1C1C]'>E-signature tracking</p>
      <p className='truncate text-[12.5px] text-[#6C6C6C]'>{subtitle}</p>
    </div>
    <div className='flex shrink-0 items-center gap-2'>
      <span className='inline-flex items-center gap-1.5 rounded-full bg-[#FDF4E3] px-2.5 py-1 text-[11.5px] font-medium text-[#8A5D06]'>
        <span className='size-1.5 rounded-full bg-[#C8901A]' />
        In progress
      </span>
      <span className='rounded-full bg-[#DDF3E4] px-2.5 py-1 text-[11.5px] font-medium text-[#046A22]'>
        Included
      </span>
    </div>
  </div>
);

const PaymentGateModal: React.FC<PaymentGateModalProps> = ({
  open,
  onOpenChange,
  caregiverId,
  caregiverName,
  caregiverImage,
  caregiverRole,
  caregiverLocation,
  onPaid,
}) => {
  const [state, setState] = useState<GateState>('form');
  const [busy, setBusy] = useState(false);
  const [packet, setPacket] = useState<any>(null);
  const [checkout, setCheckout] = useState<any>(null);
  const [failure, setFailure] = useState('');
  const [email, setEmail] = useState('');

  const name = packet?.caregiverName || caregiverName || 'This caregiver';
  const price = checkout?.priceCents ?? packet?.priceCents;

  /** Load the price and open (or resume) the purchase. */
  const start = useCallback(async () => {
    setBusy(true);
    try {
      const p = await fetch(`/api/payment/packet/${caregiverId}`).then((r) => r.json());
      setPacket(p?.data ?? null);

      // Already owned — nothing to charge, go straight to the receipt.
      if (p?.data?.paid) {
        setState('success');
        return;
      }

      const res = await fetch(`/api/payment/checkout/${caregiverId}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || json?.status !== 200) {
        setFailure(json?.message || 'Could not start checkout');
        setState('payment-failed');
        return;
      }
      setCheckout(json.data);
      setState(json.data?.alreadyPaid ? 'success' : 'form');
    } catch {
      setFailure('Could not reach the payment service');
      setState('payment-failed');
    } finally {
      setBusy(false);
    }
  }, [caregiverId]);

  useEffect(() => {
    if (!open) return;
    setState('form');
    setFailure('');
    setCheckout(null);
    start();
  }, [open, start]);

  /** Confirm the charge, then hand control back so the download can run. */
  const finishAsPaid = async () => {
    setState('processing');
    try {
      await onPaid?.();
      setState('success');
    } catch {
      // Paid but the file did not arrive. The purchase is safe — this is the
      // delivery-failed state, and retrying must never charge again.
      setState('delivery-failed');
    }
  };

  const pay = async () => {
    if (!checkout?.transactionId) return;
    setBusy(true);
    try {
      if (checkout.testMode) {
        // No Stripe credentials on this environment. The QA path drives the
        // same server-side state machine a webhook would.
        const res = await fetch(`/api/payment/simulate/${checkout.transactionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome: 'succeed' }),
        });
        const json = await res.json();
        if (!res.ok || json?.status !== 200) {
          setFailure(json?.message || 'Payment failed');
          setState('payment-failed');
          return;
        }
        await finishAsPaid();
        return;
      }

      // Live Stripe. The charge is only ever trusted from the server side —
      // either the webhook marks it paid, or /confirm asks Stripe directly.
      // Neither path believes the browser.
      setState('processing');
      const deadline = Date.now() + 40000;
      while (Date.now() < deadline) {
        const c = await fetch(`/api/payment/confirm/${checkout.transactionId}`, {
          method: 'POST',
        }).then((r) => r.json());

        if (c?.data?.status === 'paid') {
          const p = await fetch(`/api/payment/packet/${caregiverId}`).then((r) => r.json());
          setPacket(p?.data ?? packet);
          await finishAsPaid();
          return;
        }
        if (c?.data?.status === 'failed') {
          setFailure(c.data.failureMessage || 'Card declined');
          setState('payment-failed');
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      setFailure('We did not receive confirmation from the card issuer.');
      setState('payment-failed');
    } catch {
      setFailure('Payment could not be completed');
      setState('payment-failed');
    } finally {
      setBusy(false);
    }
  };

  /** QA control: reach the declined state without a real card. */
  const simulateDecline = async () => {
    if (!checkout?.transactionId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/payment/simulate/${checkout.transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: 'fail' }),
      });
      const json = await res.json();
      setFailure(
        json?.data?.failureMessage || 'Card declined — insufficient funds (no charge made)'
      );
      setState('payment-failed');
    } finally {
      setBusy(false);
    }
  };

  const retryDownload = async () => {
    setBusy(true);
    try {
      await onPaid?.();
      setState('success');
    } catch {
      toast.error('The download still could not be prepared');
    } finally {
      setBusy(false);
    }
  };

  const Shell: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({
    children,
    wide,
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The card form grows with Stripe's payment methods and can easily be
          taller than a laptop screen. Without a height cap the dialog is
          centred with translate-y(-50%), so it overflows off the top AND the
          bottom with nothing to scroll — the pay button becomes unreachable. */}
      <DialogContent
        className={`${wide ? 'max-w-[560px]' : 'max-w-[520px]'} max-h-[92vh] overflow-y-auto overscroll-contain border-0 bg-transparent p-0 shadow-none`}
      >
        <Wordmark />
        <div className='rounded-2xl bg-white p-8 shadow-sm'>{children}</div>
      </DialogContent>
    </Dialog>
  );

  // ---------------------------------------------------------------- processing
  if (state === 'processing') {
    return (
      <Shell>
        <div className='flex flex-col items-center text-center'>
          <Loader2 className='size-10 animate-spin text-[#22B14C]' />
          <h2 className='mt-5 text-[22px] font-semibold text-[#1C1C1C]'>
            Preparing your download
          </h2>
          <p className='mt-3 max-w-[420px] text-[14px] leading-[22px] text-[#6C6C6C]'>
            Payment received. We&apos;re getting {name}&apos;s documents ready — this usually
            takes just a few seconds.
          </p>
          <p className='mt-4 text-[13px] text-[#6C6C6C]'>Please keep this window open.</p>
        </div>
      </Shell>
    );
  }

  // ------------------------------------------------------------------- success
  if (state === 'success') {
    return (
      <Shell>
        <div className='flex flex-col items-center text-center'>
          <span className='flex size-14 items-center justify-center rounded-full bg-[#046A22]'>
            <Check className='size-7 text-white' strokeWidth={3} />
          </span>
          <h2 className='mt-5 text-[22px] font-semibold text-[#1C1C1C]'>Payment successful</h2>
          <p className='mt-3 max-w-[430px] text-[14px] leading-[22px] text-[#6C6C6C]'>
            Your download is starting automatically. {firstName(name)}&apos;s documents are now
            unlocked — re-download anytime for free.
          </p>
        </div>

        <div className='mt-6 overflow-hidden rounded-xl bg-[#F4F6F5]'>
          <div className='flex items-center justify-between gap-3 px-4 py-3.5'>
            <div className='min-w-0'>
              <p className='text-[14px] font-semibold text-[#1C1C1C]'>Credential packet</p>
              <p className='truncate text-[12.5px] text-[#6C6C6C]'>
                {name}
                {packet?.fileCount ? ` · ${packet.fileCount} files` : ''}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <span className='text-[14px] font-semibold text-[#1C1C1C]'>
                {money(packet?.priceCents ?? price)}
              </span>
              <span className='rounded-full bg-[#DDF3E4] px-2.5 py-1 text-[11.5px] font-medium text-[#046A22]'>
                Paid
              </span>
            </div>
          </div>
          <div className='flex items-center justify-between gap-3 border-t border-[#E4E8E6] px-4 py-3.5'>
            <div className='flex items-center gap-2.5'>
              <p className='text-[14px] text-[#1C1C1C]'>E-signature tracking</p>
              <span className='inline-flex items-center gap-1.5 rounded-full bg-[#FDF4E3] px-2.5 py-1 text-[11.5px] font-medium text-[#8A5D06]'>
                <span className='size-1.5 rounded-full bg-[#C8901A]' />
                In progress
              </span>
            </div>
            <span className='rounded-full bg-[#DDF3E4] px-2.5 py-1 text-[11.5px] font-medium text-[#046A22]'>
              Included
            </span>
          </div>
        </div>

        <div className='mt-4 flex items-center justify-between gap-3 rounded-lg bg-[#F4F6F5] px-4 py-3'>
          <p className='truncate text-[13px] text-[#6C6C6C]'>
            Receipt sent to {email || 'your email'}
          </p>
          <span className='shrink-0 text-[13px] font-semibold text-[#046A22]'>View receipt</span>
        </div>

        <Button
          onClick={retryDownload}
          disabled={busy}
          variant='outline'
          className='mt-4 h-12 w-full rounded-xl border-[#DFE2E0] text-[15px] font-semibold text-[#1C1C1C]'
        >
          {busy ? 'Starting…' : 'Download again'}
        </Button>
      </Shell>
    );
  }

  // ------------------------------------------------------------ payment failed
  if (state === 'payment-failed') {
    return (
      <Shell>
        <div className='flex flex-col items-center text-center'>
          <span className='flex size-14 items-center justify-center rounded-full bg-[#FCEBEA]'>
            <X className='size-7 text-[#A72019]' strokeWidth={3} />
          </span>
          <h2 className='mt-5 text-[22px] font-semibold text-[#1C1C1C]'>
            Payment couldn&apos;t be completed
          </h2>
          <p className='mt-3 max-w-[430px] text-[14px] leading-[22px] text-[#6C6C6C]'>
            Your card was declined and you haven&apos;t been charged. Check your details and try
            again.
          </p>
          <div className='mt-4 flex w-full items-center gap-2 rounded-lg bg-[#FCEBEA] px-3.5 py-2.5'>
            <AlertCircle className='size-4 shrink-0 text-[#A72019]' />
            <p className='text-[13px] font-medium text-[#A72019]'>
              {failure || 'Card declined — insufficient funds (no charge made)'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setFailure('');
            start();
          }}
          disabled={busy}
          className='mt-5 h-12 w-full rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
        >
          Try again
        </Button>
        <Button
          onClick={() => {
            setFailure('');
            start();
          }}
          variant='outline'
          className='mt-3 h-12 w-full rounded-xl border-[#DFE2E0] text-[15px] font-semibold text-[#1C1C1C]'
        >
          Use a different card
        </Button>
      </Shell>
    );
  }

  // ----------------------------------------------------------- delivery failed
  if (state === 'delivery-failed') {
    return (
      <Shell>
        <div className='flex flex-col items-center text-center'>
          <span className='flex size-14 items-center justify-center rounded-full bg-[#FDF4E3]'>
            <Download className='size-7 text-[#C8901A]' />
          </span>
          <h2 className='mt-5 text-[22px] font-semibold text-[#1C1C1C]'>
            Payment received — download didn&apos;t start
          </h2>
          <p className='mt-3 max-w-[430px] text-[14px] leading-[22px] text-[#6C6C6C]'>
            We&apos;ve saved your purchase, so you won&apos;t be charged again. Retry the download
            or contact support.
          </p>
          <span className='mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#DDF3E4] px-3 py-1.5 text-[12.5px] font-semibold text-[#046A22]'>
            <span className='size-1.5 rounded-full bg-[#046A22]' />
            Paid · {money(packet?.priceCents ?? price)} · entitlement saved
          </span>
        </div>
        <Button
          onClick={retryDownload}
          disabled={busy}
          className='mt-5 h-12 w-full rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
        >
          {busy ? 'Retrying…' : 'Retry download'}
        </Button>
        <a
          href='mailto:support@wevoro.com?subject=Download%20did%20not%20start'
          className='mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-[#DFE2E0] text-[15px] font-semibold text-[#1C1C1C]'
        >
          Contact support
        </a>
      </Shell>
    );
  }

  // ---------------------------------------------------------------------- form
  return (
    <Shell wide>
      <div className='flex flex-col items-center text-center'>
        {caregiverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={caregiverImage}
            alt={name}
            className='size-[104px] rounded-full object-cover'
          />
        ) : (
          <div className='flex size-[104px] items-center justify-center rounded-full bg-[#F2F4F3] text-[30px] font-semibold text-[#6C6C6C]'>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className='mt-4 text-[26px] font-bold text-[#1C1C1C]'>{name}</h2>
        {caregiverRole && (
          <span className='mt-2 rounded-full bg-[#DDF3E4] px-3.5 py-1 text-[13px] font-medium text-[#046A22]'>
            {caregiverRole}
          </span>
        )}
        {caregiverLocation && (
          <p className='mt-2 text-[13.5px] text-[#6C6C6C]'>{caregiverLocation}</p>
        )}
      </div>

      <div className='mt-6 flex items-center justify-between gap-3 rounded-lg bg-[#F4F6F5] px-4 py-3.5'>
        <div className='min-w-0'>
          <p className='text-[15px] font-semibold text-[#1C1C1C]'>Credential packet</p>
          <p className='truncate text-[13px] text-[#6C6C6C]'>
            {name}
            {packet?.fileCount ? ` · ${packet.fileCount} files` : ''}
          </p>
        </div>
        <div className='shrink-0 text-right'>
          <p className='text-[20px] font-bold text-[#1C1C1C]'>{money(price)}</p>
          <p className='text-[12px] text-[#6C6C6C]'>one-time</p>
        </div>
      </div>

      <div className='mt-3'>
        <EsignRow subtitle='Runs in the background — no extra charge' />
      </div>

      <p className='mt-6 text-[15px] font-semibold text-[#1C1C1C]'>Pay with card</p>

      <label htmlFor='pay-email' className='mt-3 block text-[13.5px] text-[#1C1C1C]'>
        Email
      </label>
      <div className='mt-1.5 flex items-center gap-2.5 rounded-lg border border-[#DFE2E0] px-3.5 py-3'>
        <Mail className='size-4 shrink-0 text-[#6C6C6C]' />
        <input
          id='pay-email'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='you@agency.com'
          className='w-full bg-transparent text-[14px] text-[#1C1C1C] outline-none placeholder:text-[#9CA3A0]'
        />
      </div>

      <p className='mt-4 text-[13.5px] text-[#1C1C1C]'>Card information</p>

      {checkout?.clientSecret && checkout?.publishableKey ? (
        // Stripe's own iframe. Card numbers never enter this page's DOM.
        <div className='mt-1.5'>
          <StripeCardForm
            clientSecret={checkout.clientSecret}
            publishableKey={checkout.publishableKey}
            priceCents={price}
            onSubmitted={pay}
            onFailed={(m) => {
              setFailure(m);
              setState('payment-failed');
            }}
          />
        </div>
      ) : (
        <>
          {/* No Stripe credentials on this environment — the fields are inert
              placeholders so the layout still reads correctly, and the button
              drives the simulated path instead. */}
          <div className='mt-1.5 flex items-center gap-2.5 rounded-lg border border-[#DFE2E0] px-3.5 py-3'>
            <CreditCard className='size-4 shrink-0 text-[#6C6C6C]' />
            <input
              placeholder='1234 1234 1234 1234'
              disabled
              className='w-full bg-transparent text-[14px] outline-none placeholder:text-[#9CA3A0] disabled:cursor-not-allowed'
            />
          </div>
          <div className='mt-2.5 grid grid-cols-2 gap-2.5'>
            <input
              placeholder='MM / YY'
              disabled
              className='rounded-lg border border-[#DFE2E0] px-3.5 py-3 text-[14px] outline-none placeholder:text-[#9CA3A0] disabled:cursor-not-allowed'
            />
            <input
              placeholder='CVC'
              disabled
              className='rounded-lg border border-[#DFE2E0] px-3.5 py-3 text-[14px] outline-none placeholder:text-[#9CA3A0] disabled:cursor-not-allowed'
            />
          </div>

          <Button
            onClick={pay}
            disabled={busy || !checkout?.transactionId}
            className='mt-5 h-12 w-full gap-2 rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
          >
            <Lock className='size-4' />
            {busy ? 'Processing…' : `Pay ${money(price)} & download documents`}
          </Button>

          <p className='mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-[#6C6C6C]'>
            <Lock className='size-3' />
            Secure payment via Stripe · Charged once · Re-downloads are always free
          </p>
        </>
      )}

      {checkout?.testMode && (
        // Only rendered when the server reports it has no Stripe credentials.
        // Labelled plainly so it can never be mistaken for a real control.
        <div className='mt-4 rounded-lg border border-dashed border-[#DFE2E0] px-3.5 py-3'>
          <p className='text-[12px] font-medium text-[#8A5D06]'>
            Test mode — no card is charged. Stripe is not configured on this environment.
          </p>
          <button
            type='button'
            onClick={simulateDecline}
            disabled={busy}
            className='mt-1.5 text-[12.5px] font-medium text-[#A72019] underline underline-offset-2'
          >
            Simulate a declined card
          </button>
        </div>
      )}
    </Shell>
  );
};

export default PaymentGateModal;
