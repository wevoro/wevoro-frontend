'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CreditCard,
  Download,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

type GateState =
  | 'form'
  | 'redirecting'
  | 'processing'
  | 'success'
  | 'incomplete'
  | 'payment-failed'
  | 'delivery-failed';

const money = (cents?: number | null) =>
  cents === null || cents === undefined ? '—' : `$${(cents / 100).toFixed(2)}`;

const firstName = (full?: string) => (full || '').trim().split(/\s+/)[0] || 'this caregiver';

/** " · 3 files" / " · 1 file" / "" — a packet of one should not read "1 files". */
const fileLine = (n?: number | null) =>
  n ? ` · ${n} ${n === 1 ? 'file' : 'files'}` : '';

/**
 * SCRUM-124: what may be shown to the agency when something goes wrong. A
 * payment provider's internal error ("Invalid line_items[0]: the product tax
 * code is missing…", with a dashboard link and account id) reached this screen
 * verbatim. The server now sends a plain sentence; this is the second guard.
 */
const START_ERROR = "We couldn't open the secure checkout. Please try again in a moment.";
const customerMessage = (message?: string) =>
  !message ||
  message.length > 160 ||
  /stripe|line_items|tax code|acct_|https?:\/\//i.test(message)
    ? ''
    : message;

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
  /**
   * Set when the agency has just come back from Stripe's checkout page.
   * 'success' means Stripe reported the payment taken — the gate still confirms
   * that with our own server before unlocking anything. 'cancelled' means they
   * left the page without paying.
   */
  resume?: { transactionId: string; outcome: 'success' | 'cancelled' } | null;
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
  resume,
}) => {
  const [state, setState] = useState<GateState>('form');
  const [busy, setBusy] = useState(false);
  const [packet, setPacket] = useState<any>(null);
  const [checkout, setCheckout] = useState<any>(null);
  const [failure, setFailure] = useState('');
  // Checkout that never opened is not a declined card, and must not be told
  // to the agency as one.
  const [failureKind, setFailureKind] = useState<'start' | 'payment'>('payment');

  const name = packet?.caregiverName || caregiverName || 'This caregiver';
  const price = checkout?.priceCents ?? packet?.priceCents;
  // Prefer what the server knows; the props are only a fallback for callers
  // that already have the caregiver loaded.
  const avatar = packet?.caregiverImage || caregiverImage;
  const role = packet?.caregiverRole || caregiverRole;
  const location = packet?.caregiverLocation || caregiverLocation;
  const [avatarFailed, setAvatarFailed] = useState(false);

  /** Load the price and open (or resume) the purchase. */
  const start = useCallback(async (): Promise<any> => {
    setBusy(true);
    try {
      const p = await fetch(`/api/payment/packet/${caregiverId}`).then((r) => r.json());
      setPacket(p?.data ?? null);

      // Already owned — nothing to charge, go straight to the receipt.
      if (p?.data?.paid) {
        setState('success');
        return null;
      }

      const res = await fetch(`/api/payment/checkout/${caregiverId}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || json?.status !== 200) {
        setFailureKind('start');
        setFailure(customerMessage(json?.message) || START_ERROR);
        setState('payment-failed');
        return null;
      }
      setCheckout(json.data);
      setState(json.data?.alreadyPaid ? 'success' : 'form');
      return json.data;
    } catch {
      setFailureKind('start');
      setFailure(START_ERROR);
      setState('payment-failed');
      return null;
    } finally {
      setBusy(false);
    }
  }, [caregiverId]);

  /**
   * Ask our own server what Stripe says about this transaction, until it
   * settles. Stripe's redirect is a hint, not proof — only the webhook (or our
   * server asking Stripe directly) releases the packet.
   */
  const awaitConfirmation = useCallback(
    async (transactionId: string) => {
      const deadline = Date.now() + 40000;
      while (Date.now() < deadline) {
        const c = await fetch(`/api/payment/confirm/${transactionId}`, {
          method: 'POST',
        })
          .then((r) => r.json())
          .catch(() => null);

        if (c?.data?.status === 'paid') return 'paid' as const;
        if (c?.data?.status === 'failed') {
          setFailureKind('payment');
          setFailure(
            customerMessage(c.data.failureMessage) || 'The payment did not go through'
          );
          return 'failed' as const;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      return 'timeout' as const;
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    setFailure('');
    setCheckout(null);

    // Coming back from Stripe's checkout page.
    if (resume) {
      if (resume.outcome === 'cancelled') {
        setState('incomplete');
        // Still load the packet so the summary card has a name and a price.
        fetch(`/api/payment/packet/${caregiverId}`)
          .then((r) => r.json())
          .then((p) => setPacket(p?.data ?? null))
          .catch(() => {});
        return;
      }
      setState('processing');
      (async () => {
        const outcome = await awaitConfirmation(resume.transactionId);
        const p = await fetch(`/api/payment/packet/${caregiverId}`)
          .then((r) => r.json())
          .catch(() => null);
        setPacket(p?.data ?? null);
        if (outcome === 'paid') {
          await finishAsPaid();
        } else if (outcome === 'failed') {
          setState('payment-failed');
        } else {
          setFailure(
            'Stripe has not confirmed this payment yet. Nothing further is needed from you — refresh in a minute.'
          );
          setState('incomplete');
        }
      })();
      return;
    }

    setState('form');
    start();
    // finishAsPaid is stable enough for this effect; re-running on it would
    // restart checkout every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, start, resume, caregiverId, awaitConfirmation]);

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
          setFailureKind('payment');
          setFailure(customerMessage(json?.message) || 'Payment failed');
          setState('payment-failed');
          return;
        }
        await finishAsPaid();
        return;
      }

      // Live Stripe: hand the agency to Stripe's own checkout page rather than
      // asking for card details inside our modal. A stripe.com address is the
      // single strongest trust signal available at the moment of payment, and
      // it is where agencies were hesitating.
      if (!checkout.checkoutUrl) {
        setFailureKind('start');
        setFailure(START_ERROR);
        setState('payment-failed');
        return;
      }
      setState('redirecting');
      window.location.assign(checkout.checkoutUrl);
    } catch {
      setFailureKind('start');
      setFailure(START_ERROR);
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
      setFailureKind('payment');
      setFailure(
        json?.data?.failureMessage || 'Card declined — insufficient funds (no charge made)'
      );
      setState('payment-failed');
    } finally {
      setBusy(false);
    }
  };

  /**
   * SCRUM-124: start over from the failure screen. Both buttons used to restart
   * checkout while leaving that screen up with its message cleared, so it
   * flashed the placeholder "Card declined — insufficient funds" until the real
   * error came back — which looked like a loop — and "Use a different card" did
   * exactly what "Try again" did. Now both return to the loading form, and "Use
   * a different card" carries straight on to Stripe's page, where the card is
   * actually chosen.
   */
  const retry = async (toStripe: boolean) => {
    setFailure('');
    setCheckout(null);
    setState('form');
    const data = await start();
    if (toStripe && data?.checkoutUrl) {
      setState('redirecting');
      window.location.assign(data.checkoutUrl);
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
  // --------------------------------------------------------------- redirecting
  if (state === 'redirecting') {
    return (
      <Shell>
        <div className='flex flex-col items-center text-center'>
          <Loader2 className='size-10 animate-spin text-[#22B14C]' />
          <h2 className='mt-5 text-[22px] font-semibold text-[#1C1C1C]'>
            Taking you to secure checkout
          </h2>
          <p className='mt-3 max-w-[420px] text-[14px] leading-[22px] text-[#6C6C6C]'>
            Your card details are entered on Stripe, not on WeVoro. You&apos;ll come straight
            back here once the payment is done.
          </p>
        </div>
      </Shell>
    );
  }

  // ---------------------------------------------------------------- incomplete
  // Stripe's own word for a checkout that was started and not finished. It is
  // not a failure and nothing was charged, so it does not get the red screen —
  // but the agency must be told plainly why the packet is still locked.
  if (state === 'incomplete') {
    return (
      <Shell>
        <div className='flex flex-col items-center text-center'>
          <span className='flex size-14 items-center justify-center rounded-full bg-[#FDF4E3]'>
            <AlertCircle className='size-7 text-[#8A5D06]' />
          </span>
          <h2 className='mt-5 text-[22px] font-semibold text-[#1C1C1C]'>
            Payment not completed
          </h2>
          <p className='mt-3 max-w-[430px] text-[14px] leading-[22px] text-[#6C6C6C]'>
            You left the checkout before it finished, so <b>you have not been charged</b> and{' '}
            {firstName(name)}&apos;s documents are still locked. You can pick up where you
            left off whenever you&apos;re ready.
          </p>
          {failure && (
            <div className='mt-4 flex w-full items-center gap-2 rounded-lg bg-[#FDF4E3] px-3.5 py-2.5'>
              <AlertCircle className='size-4 shrink-0 text-[#8A5D06]' />
              <p className='text-left text-[13px] font-medium text-[#8A5D06]'>{failure}</p>
            </div>
          )}
        </div>
        <Button
          onClick={() => {
            setFailure('');
            setState('form');
            start();
          }}
          disabled={busy}
          className='mt-5 h-12 w-full rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
        >
          Resume payment
        </Button>
        <Button
          onClick={() => onOpenChange(false)}
          variant='outline'
          className='mt-3 h-12 w-full rounded-xl border-[#DFE2E0] text-[15px] font-semibold text-[#1C1C1C]'
        >
          Not now
        </Button>
      </Shell>
    );
  }

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
                {fileLine(packet?.fileCount)}
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
            Stripe has emailed your receipt
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
            {failureKind === 'start'
              ? 'Checkout couldn’t be opened'
              : 'Payment couldn’t be completed'}
          </h2>
          <p className='mt-3 max-w-[430px] text-[14px] leading-[22px] text-[#6C6C6C]'>
            {failureKind === 'start'
              ? 'Nothing was charged. Please try again in a moment.'
              : 'You haven’t been charged. Try again, or use a different card on the secure checkout page.'}
          </p>
          {failure && (
            <div className='mt-4 flex w-full items-center gap-2 rounded-lg bg-[#FCEBEA] px-3.5 py-2.5'>
              <AlertCircle className='size-4 shrink-0 text-[#A72019]' />
              <p className='text-left text-[13px] font-medium text-[#A72019]'>{failure}</p>
            </div>
          )}
        </div>
        <Button
          onClick={() => retry(false)}
          disabled={busy}
          className='mt-5 h-12 w-full rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
        >
          Try again
        </Button>
        {failureKind === 'start' ? (
          <Button
            onClick={() => onOpenChange(false)}
            variant='outline'
            className='mt-3 h-12 w-full rounded-xl border-[#DFE2E0] text-[15px] font-semibold text-[#1C1C1C]'
          >
            Close
          </Button>
        ) : (
          <Button
            onClick={() => retry(true)}
            disabled={busy}
            variant='outline'
            className='mt-3 h-12 w-full rounded-xl border-[#DFE2E0] text-[15px] font-semibold text-[#1C1C1C]'
          >
            Use a different card
          </Button>
        )}
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
        {/* The server supplies the photo, role and city, so the card is
            complete no matter which surface opened the gate. `alt=""` matters:
            a broken avatar URL was rendering the caregiver's name as alt text,
            so the name appeared twice. */}
        {avatar && !avatarFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=''
            onError={() => setAvatarFailed(true)}
            className='size-[104px] rounded-full object-cover ring-4 ring-white'
          />
        ) : (
          // The design has a photo here. When there is none, a flat grey disc
          // reads like a loading failure — this is tinted to the brand and
          // ringed like the photo would be, so it looks deliberate.
          <div className='flex size-[104px] items-center justify-center rounded-full bg-gradient-to-b from-[#EAF7EE] to-[#D9F0E1] text-[34px] font-semibold text-[#046A22] ring-4 ring-white'>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className='mt-4 text-[26px] font-bold text-[#1C1C1C]'>{name}</h2>
        {role && (
          <span className='mt-2 rounded-full bg-[#DDF3E4] px-3.5 py-1 text-[13px] font-medium text-[#046A22]'>
            {role}
          </span>
        )}
        {location && (
          <p className='mt-2 flex items-center gap-1.5 text-[13.5px] text-[#6C6C6C]'>
            <MapPin className='size-4' />
            {location}
          </p>
        )}
      </div>

      <div className='mt-6 flex items-center justify-between gap-3 rounded-lg bg-[#F4F6F5] px-4 py-3.5'>
        <div className='min-w-0'>
          <p className='text-[15px] font-semibold text-[#1C1C1C]'>Credential packet</p>
          <p className='truncate text-[13px] text-[#6C6C6C]'>
            {name}
            {fileLine(packet?.fileCount)}
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

      {/* Payment happens on Stripe's own hosted page rather than in this modal.
          A card form embedded in a supplier's dialog is exactly where agencies
          hesitate; a stripe.com address is the strongest trust signal available
          at the moment of payment. Stripe collects the card and the receipt
          email, so neither is asked for here. */}
      {!checkout ? (
        <div className='mt-3 animate-pulse space-y-2.5' aria-busy='true'>
          <div className='h-[68px] rounded-xl bg-[#F2F4F3]' />
          <div className='h-12 rounded-xl bg-[#E8EDEA]' />
        </div>
      ) : checkout.checkoutUrl ? (
        <>
          <div className='mt-3 flex items-start gap-3 rounded-xl border border-[#DFE2E0] bg-[#F9FBFA] px-4 py-3.5'>
            <ShieldCheck className='mt-0.5 size-5 shrink-0 text-[#046A22]' />
            <div>
              <p className='text-[14px] font-semibold text-[#1C1C1C]'>
                You&apos;ll finish on Stripe
              </p>
              <p className='mt-0.5 text-[13px] leading-[19px] text-[#6C6C6C]'>
                Card details are entered on Stripe&apos;s secure page, never on WeVoro. Your
                receipt is emailed by Stripe, and we bring you straight back here.
              </p>
            </div>
          </div>

          <Button
            onClick={pay}
            disabled={busy}
            className='mt-5 h-12 w-full gap-2 rounded-xl bg-[#008000] text-[15px] font-semibold text-white hover:bg-[#016b01]'
          >
            <Lock className='size-4' />
            {busy ? 'Opening secure checkout…' : `Pay ${money(price)} on Stripe`}
          </Button>

          <p className='mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-[#6C6C6C]'>
            <Lock className='size-3' />
            Charged once · Re-downloads are always free
          </p>
        </>
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
