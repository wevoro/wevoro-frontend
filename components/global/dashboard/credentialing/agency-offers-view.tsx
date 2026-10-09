'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import moment from 'moment';
import { Loader2, Lock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgencyEngagements } from '@/app/apiHooks/useAgencyEngagements';
import { downloadCredentialPacket } from '@/components/global/dashboard/download-package-button';
import { SendMessageModal } from './send-message-modal';
import PacketDocumentsModal from '@/components/global/dashboard/payment/packet-documents-modal';
import PaymentGateModal from '@/components/global/dashboard/payment/payment-gate-modal';
import { EngagementEntry } from './engagement-card';
import {
  takeCheckoutOrigin,
  takeCheckoutResult,
  type CheckoutResult,
} from '@/lib/checkout-return';

type SubTab = 'awaiting' | 'completed';

/** "$25" for whole dollars, "$49.99" otherwise. */
const priceLabel = (cents?: number | null) =>
  cents === null || cents === undefined
    ? ''
    : `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;

/**
 * SCRUM-88 / SCRUM-141: the agency's Onboarding page (was "Offers").
 *
 * Faisal's agency flow re-keys the list from who acted to where the
 * onboarding stands (DevNote "Tab naming"):
 *
 *  - Awaiting signature: onboarded, the caregiver has not signed yet (A8a).
 *    Caregivers who reached the agency through a share link but have not been
 *    onboarded are listed below, with an Onboard action.
 *  - Completed: signed (A8b — "Download package · $25", payment is taken at
 *    download) or already paid (A8c — "Download again", free).
 *
 * SCRUM-141: the server counts Onboard offers only, so a pair whose only offer
 * is a scheduling-era job offer reads 'none' and gets the Onboard action like
 * anyone else. A packet bought that way stays under Completed with "Download
 * again" (the entitlement wins), but its pill says "Paid", not "Signed": the
 * caregiver never signed anything through Respond.
 */
const AgencyOffersView: React.FC = () => {
  const searchParams = useSearchParams();
  const { data, isLoading, refetch } = useAgencyEngagements();

  const toEntry = (e: any): EngagementEntry => ({
    partyId: e.caregiverId,
    name: e.name,
    image: e.image,
    role: e.role,
    onboardedAt: e.onboardedAt,
    downloadedAt: e.downloadedAt,
    onboard: e.onboard ?? null,
    paid: !!e.paid,
    paidAt: e.paidAt ?? null,
    priceCents: e.priceCents ?? null,
  });

  const all: EngagementEntry[] = useMemo(
    () => [...(data?.submitted ?? []), ...(data?.received ?? [])].map(toEntry),
    [data],
  );
  const stateOf = (e: EngagementEntry) => e.onboard?.state ?? 'none';
  const completed = useMemo(
    () =>
      all
        .filter((e) => e.paid || stateOf(e) === 'submitted')
        .sort(
          (a, b) =>
            +new Date(b.onboard?.submittedAt || b.paidAt || 0) -
            +new Date(a.onboard?.submittedAt || a.paidAt || 0)
        ),
    [all],
  );
  const awaiting = useMemo(
    () =>
      all
        .filter((e) => !e.paid && (stateOf(e) === 'awaiting' || stateOf(e) === 'signing'))
        .sort((a, b) => +new Date(b.onboardedAt || 0) - +new Date(a.onboardedAt || 0)),
    [all],
  );
  // Reached the agency (share link) but never onboarded, or declined.
  const notOnboarded = useMemo(
    () =>
      all.filter((e) => !e.paid && (stateOf(e) === 'none' || stateOf(e) === 'declined')),
    [all],
  );

  // SCRUM-119: the paywall. `docsFor` opens the documents modal (free to view,
  // urls withheld until paid); `payFor` opens the payment gate. `paidTick` is
  // bumped after a successful payment so the documents modal refetches and
  // flips from locked to unlocked without a page reload.
  const [docsFor, setDocsFor] = useState<EngagementEntry | null>(null);
  const [payFor, setPayFor] = useState<EngagementEntry | null>(null);
  const [paidTick, setPaidTick] = useState(0);
  // Held from the moment a payment clears until the gate has been swapped for
  // the unlocked documents modal.
  const [reopenFor, setReopenFor] = useState<EngagementEntry | null>(null);

  // SCRUM-134: a checkout started here returns to the caregiver's profile (the
  // only return URL Stripe has), which steps back past the Stripe entry to this
  // page and leaves the outcome waiting. Pick it up — on load, or on a restore
  // from the page cache — and reopen the gate on the matching screen, so Back
  // from here continues to wherever the agency came from.
  const [resume, setResume] = useState<
    { transactionId: string; outcome: 'success' | 'cancelled' } | null
  >(null);
  const [pendingReturn, setPendingReturn] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    const pickUp = (restoredFromCache: boolean) => {
      const result = takeCheckoutResult(window.location.pathname);
      if (result) {
        setPendingReturn(result);
        return;
      }
      if (!restoredFromCache) return;
      // Back from Stripe restored this page with the gate frozen mid-redirect.
      // Pressing Back there means they left without paying, so say so rather
      // than closing the card out from under them (20 Sep: "it comes and goes").
      if (takeCheckoutOrigin(window.location.pathname)) {
        setResume({ transactionId: '', outcome: 'cancelled' });
        return;
      }
      setPayFor(null);
    };
    pickUp(false);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) pickUp(true);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    if (!pendingReturn) return;
    const entry = all.find((e) => e.partyId === pendingReturn.caregiverId);
    if (!entry) return; // engagements still loading
    setResume({
      transactionId: pendingReturn.transactionId,
      outcome: pendingReturn.outcome,
    });
    setPayFor(entry);
    setPendingReturn(null);
  }, [pendingReturn, all]);


  // Old links used ?tab=received (downloaded) and ?tab=submitted.
  const tabFrom = (t: string | null): SubTab | null =>
    t === 'completed' || t === 'received'
      ? 'completed'
      : t === 'awaiting' || t === 'submitted'
        ? 'awaiting'
        : null;
  const [subTab, setSubTab] = useState<SubTab>(tabFrom(searchParams.get('tab')) ?? 'awaiting');
  useEffect(() => {
    const t = tabFrom(searchParams.get('tab'));
    if (t) setSubTab(t);
  }, [searchParams]);

  const pill = (text: string, tone: 'amber' | 'green' | 'grey', size: 'sm' | 'md' = 'md') => (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-[5px] font-medium ${
        size === 'sm' ? 'text-[12px]' : 'text-[13px]'
      } ${
        tone === 'amber'
          ? 'bg-[#FDFFDD] text-[#7A5600]'
          : tone === 'green'
            ? 'bg-[#BBF8DC] text-[#01400F]'
            : 'bg-[#F2F4F3] text-[#5E6864]'
      }`}
    >
      {text}
    </span>
  );

  /**
   * One row of Faisal's A8 frames: who, where it stands, what was sent to
   * sign, and the one action that exists in that state.
   */
  const renderRow = (e: EngagementEntry) => {
    const state = e.onboard?.state ?? 'none';
    const first = (e.name || '').split(/\s+/)[0] || 'the caregiver';
    const docs = e.onboard?.documents ?? [];
    const profileHref = `/agency/caregivers/${e.partyId}`;

    // A8b and A8c both read "Signed": paying does not change what the
    // caregiver did, and the footer says whether it is paid. A packet paid for
    // without an onboard signature (bought before SCRUM-141's gate, through an
    // old job offer) says "Paid" instead — "Signed" would claim a consent the
    // caregiver never gave.
    const statusPill =
      state === 'submitted'
        ? pill('Signed', 'green')
        : e.paid
          ? pill('Paid', 'green')
          : state === 'awaiting' || state === 'signing'
            ? pill('Awaiting signature', 'amber')
            : state === 'declined'
              ? pill('Declined', 'grey')
              : pill('Not onboarded', 'grey');

    const footerText = e.paid
      ? `Paid ${e.paidAt ? moment(e.paidAt).format('MMM D, YYYY') : ''} · re-downloads are free`
      : state === 'submitted'
        ? `Signed ${e.onboard?.submittedAt ? moment(e.onboard.submittedAt).format('MMM D, YYYY') : ''} · payment is taken at download`
        : state === 'awaiting' || state === 'signing'
          ? `Onboarding request sent ${e.onboardedAt ? moment(e.onboardedAt).format('MMM D, YYYY · h:mm A') : ''}${
              state === 'signing'
                ? ` · ${e.onboard?.signedCount ?? 0} of ${e.onboard?.totalToSign ?? 0} signed`
                : docs.length === 0
                  ? ` · nothing to sign, waiting for ${first} to respond`
                  : ''
            }`
          : state === 'declined'
            ? `${first} chose not to respond to your request`
            : `Opened ${first}’s profile link${e.onboardedAt ? ` · ${moment(e.onboardedAt).format('MMM D, YYYY')}` : ''}`;

    const action = e.paid ? (
      <Button
        variant='outline'
        onClick={() => setDocsFor(e)}
        className='h-11 rounded-xl border-[#6C6C6C] bg-white px-5 text-[15px] font-medium text-[#3A4742] hover:bg-[#F9F9FA]'
      >
        Download again
      </Button>
    ) : state === 'submitted' ? (
      <Button
        onClick={() => setDocsFor(e)}
        className='h-11 gap-2 rounded-xl bg-[#008000] px-5 text-[15px] font-medium text-white hover:bg-[#016b01]'
      >
        <Lock className='size-4' />
        Download package{e.priceCents != null ? ` · ${priceLabel(e.priceCents)}` : ''}
      </Button>
    ) : state === 'none' || state === 'declined' ? (
      /* A declined pair can be asked again, as often as the agency likes
         (Riad, 30 Sep), so this row keeps its Onboard button instead of going
         quiet after a decline. */
      <Link href={profileHref}>
        <Button className='h-11 rounded-xl bg-[#008000] px-5 text-[15px] font-medium text-white hover:bg-[#016b01]'>
          Onboard
        </Button>
      </Link>
    ) : null;

    return (
      <div
        key={e.partyId}
        data-testid='onboarding-row'
        data-state={e.paid ? 'paid' : state}
        className='flex flex-col gap-4 rounded-xl border border-[#DFE2E0] bg-white p-4 md:p-6'
      >
        <div className='flex flex-wrap items-center justify-between gap-3'>
          {/* A8: name and role, the name opens the caregiver's profile. */}
          <Link href={profileHref} className='group flex min-w-0 items-center gap-2.5'>
            <span className='truncate text-[17px] font-semibold text-[#1C1C1C] group-hover:underline md:text-[18px]'>
              {e.name}
            </span>
            {e.role && <span className='text-[15px] text-[#6C6C6C]'>{e.role}</span>}
          </Link>
          {statusPill}
        </div>

        {docs.length > 0 && (
          <div className='flex flex-col gap-2.5 rounded-xl border border-[#DFE2E0] p-4'>
            <p className='text-[14px] font-medium text-[#008000]'>Documents for signature</p>
            {docs.map((d, i) => (
              <div key={`${d.title}-${i}`} className='flex items-center justify-between gap-3'>
                <span title={d.title} className='min-w-0 truncate text-[15px] text-[#1C1C1C]'>
                  {d.title}
                </span>
                {/* Each document's own status. Paying does not sign anything,
                    so a paid pair still mid-signing shows what is left.
                    SCRUM-191: once the caregiver has declined, nothing here is
                    still "to sign" — the request is over, and an amber "To
                    sign" under a Declined card read as an open request the
                    caregiver was still working through. Anything they did sign
                    before declining keeps saying so. */}
                {d.signed || state === 'submitted'
                  ? pill('Signed', 'green', 'sm')
                  : state === 'declined'
                    ? pill('Declined', 'grey', 'sm')
                    : pill('To sign', 'amber', 'sm')}
              </div>
            ))}
          </div>
        )}

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-[13px] text-[#6C6C6C]'>{footerText}</p>
          <div className='flex items-center gap-2'>
            {/* The A8 rows carry one action. Message (SCRUM-88) stays only on
                the share-link rows below the design, which have no other way
                to reach the caregiver. */}
            {(state === 'none' || state === 'declined') && !e.paid && (
              <SendMessageModal recipientId={e.partyId} recipientName={e.name}>
                <Button
                  variant='outline'
                  className='h-11 gap-1.5 rounded-xl border-[#DFE2E0] px-4 text-[14px] font-medium'
                >
                  <MessageSquare className='size-4' />
                  Message
                </Button>
              </SendMessageModal>
            )}
            {action}
          </div>
        </div>
      </div>
    );
  };

  const renderSubTab = (tab: SubTab, label: string, count: number) => (
    <button
      role='tab'
      aria-selected={subTab === tab}
      data-testid={`subtab-${tab}`}
      onClick={() => setSubTab(tab)}
      className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-base transition-colors md:text-lg ${
        subTab === tab
          ? 'border-[#008000] font-semibold text-[#1C1C1C]'
          : 'border-transparent font-normal text-[#6C6C6C]'
      }`}
    >
      {label}
      <span
        className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-[18px] px-2 text-base md:text-lg font-normal ${
          subTab === tab ? 'bg-[#BBF8DC] text-[#01400F]' : 'bg-[#F9F9FA] text-[#6C6C6C]'
        }`}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div className='bg-white dark:bg-neutral-950 md:rounded-2xl p-4 md:p-8'>
      <h2 className='text-xl md:text-2xl font-semibold text-[#1C1C1C] dark:text-neutral-100 mb-6'>
        Onboarding
      </h2>

      {/* Sub-tabs */}
      <div role='tablist' className='mb-6 flex items-center gap-8 border-b border-[#DFE2E0]'>
        {renderSubTab('awaiting', 'Awaiting signature', awaiting.length)}
        {renderSubTab('completed', 'Completed', completed.length)}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      ) : subTab === 'awaiting' ? (
        <div className='flex flex-col gap-4'>
          {awaiting.length === 0 ? (
            <p className='py-8 text-center text-sm text-gray-500'>
              No one is waiting to sign. Open a caregiver&apos;s profile and click
              Onboard to send your documents.
            </p>
          ) : (
            awaiting.map(renderRow)
          )}
          {notOnboarded.length > 0 && (
            <>
              <h3 className='mt-4 text-base font-semibold text-[#1C1C1C]'>
                Not onboarded yet
                <span className='ml-2 text-sm font-normal text-[#6C6C6C]'>
                  Caregivers who shared their profile with you
                </span>
              </h3>
              {notOnboarded.map(renderRow)}
            </>
          )}
        </div>
      ) : completed.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto'>
            Caregivers who have signed appear here, ready to download.
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-4'>{completed.map(renderRow)}</div>
      )}

      {/* SCRUM-119: locked/unlocked file list. Free to open — the server
          withholds every url until the packet is paid for. */}
      {docsFor && (
        <PacketDocumentsModal
          open={!!docsFor}
          onOpenChange={(o) => !o && setDocsFor(null)}
          caregiverId={docsFor.partyId}
          caregiverName={docsFor.name}
          onboardedAt={docsFor.onboardedAt ?? undefined}
          refreshKey={paidTick}
          onUnlock={() => {
            // Hand off to the gate, keeping the caregiver in context so the
            // modal can reopen unlocked once payment clears.
            setPayFor(docsFor);
            setDocsFor(null);
          }}
        />
      )}

      {/* The payment gate. onPaid runs only after the SERVER confirms the
          charge, so nothing is released on a browser claim. */}
      {payFor && (
        <PaymentGateModal
          open={!!payFor}
          resume={resume}
          onOpenChange={(o) => {
            if (o) return;
            setPayFor(null);
            setResume(null);
            // Dismissing "Payment successful" reveals the unlocked list — the
            // handover this surface already promised but never carried out.
            if (reopenFor) {
              const entry = reopenFor;
              setReopenFor(null);
              requestAnimationFrame(() => setDocsFor(entry));
            }
          }}
          caregiverId={payFor.partyId}
          caregiverName={payFor.name}
          caregiverImage={payFor.image ?? undefined}
          caregiverRole={payFor.role ?? undefined}
          onPaid={async () => {
            // The success card says the download is starting automatically.
            // This surface never ran one, so that was simply untrue here.
            await downloadCredentialPacket(
              payFor.partyId,
              payFor.name || 'caregiver'
            );
            setPaidTick((t) => t + 1);
            await refetch();
            setReopenFor(payFor);
          }}
        />
      )}
    </div>
  );
};

export default AgencyOffersView;
