'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DownloadPackageButton, {
  downloadCredentialPacket,
} from '@/components/global/dashboard/download-package-button';
import PacketDocumentsModal from './packet-documents-modal';
import PaymentGateModal from './payment-gate-modal';
import {
  markCheckoutHandled,
  onPadEntry,
  stepBackPastCheckout,
  takeCheckoutOrigin,
  takeCheckoutResult,
  wasCheckoutHandled,
} from '@/lib/checkout-return';

/**
 * SCRUM-119 — the download action plus its paywall, as one self-contained
 * client component.
 *
 * The caregiver profile page is a server component, so it cannot hold the modal
 * state itself. Bundling the button with its two modals here means every
 * surface that offers a download gets the paywall automatically, instead of
 * each one re-wiring it and one of them being forgotten.
 */
/**
 * SCRUM-123: "View Credential" on a credential whose file is still locked asks
 * this component to open the documents list. Cancelled by the listener, so the
 * sender can tell whether anything on the page answered.
 */
export const OPEN_PACKET_EVENT = 'wevoro:open-packet';

interface PacketDownloadActionProps {
  caregiverId: string;
  caregiverName: string;
  caregiverImage?: string;
  caregiverRole?: string;
  className?: string;
  onDownloaded?: () => void;
  /**
   * SCRUM-141: draw a different button (or none) in place of the default one.
   * The profile's action bar uses it to show Onboard / waiting / Download,
   * while this component stays mounted for the modals and the Stripe return.
   */
  renderTrigger?: (openList: () => void) => React.ReactNode;
}

const PacketDownloadAction: React.FC<PacketDownloadActionProps> = ({
  caregiverId,
  caregiverName,
  caregiverImage,
  caregiverRole,
  className,
  onDownloaded,
  renderTrigger,
}) => {
  const [docsOpen, setDocsOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paidTick, setPaidTick] = useState(0);
  // Set the moment a payment clears; the effect below swaps the gate for the
  // unlocked documents modal once the gate has finished with its own state.
  const [showUnlocked, setShowUnlocked] = useState(false);
  const [resume, setResume] = useState<
    { transactionId: string; outcome: 'success' | 'cancelled' } | null
  >(null);

  const params = useSearchParams();

  useEffect(() => {
    const openDocs = (e: Event) => {
      const detail = (e as CustomEvent<{ caregiverId?: string }>).detail;
      if (detail?.caregiverId !== caregiverId) return;
      e.preventDefault();
      setDocsOpen(true);
    };
    window.addEventListener(OPEN_PACKET_EVENT, openDocs);
    return () => window.removeEventListener(OPEN_PACKET_EVENT, openDocs);
  }, [caregiverId]);

  /**
   * Stripe's hosted checkout sends the agency back to this profile with
   * ?payment=success|cancelled&tx=<id>. Reopen the gate on the matching screen.
   *
   * The parameters stay in the address bar while the gate is open. Stripping
   * them here — first with router.replace, then with history.replaceState —
   * changes the page's search params, and the App Router keys the page segment
   * on those, so this component was remounted a few seconds later and the gate
   * vanished mid-confirmation: the agency was charged and the file downloaded,
   * but "Payment successful" never appeared. They are cleared when the gate
   * closes instead, where a remount no longer loses anything.
   */
  useEffect(() => {
    const outcome = params.get('payment');
    const tx = params.get('tx');
    if (!outcome || !tx) return;
    if (outcome !== 'success' && outcome !== 'cancelled') return;
    // SCRUM-161: already shown once; a refresh of this address does nothing.
    if (wasCheckoutHandled(tx)) return;

    // SCRUM-134: this return URL was pushed on top of the Stripe page, so Back
    // from here would land on Stripe again. When the history has the expected
    // shape, step back to where checkout started and show the outcome there;
    // the page is about to change, so nothing else happens here.
    if (stepBackPastCheckout(tx, outcome)) return;

    setResume({ transactionId: tx, outcome });
    setPayOpen(true);
  }, [params]);

  /**
   * SCRUM-134: the other half of the step back. The agency arrives on the page
   * checkout started from — reloaded, or restored from the browser's page cache
   * with the gate frozen on "Taking you to secure checkout". Pick up the outcome
   * if one is waiting.
   *
   * 20 Sep: pressing the browser's own Back button on Stripe's page leaves no
   * outcome to pick up, because our return URL is never loaded. That case used
   * to close the gate, so the card the agency was looking at flashed away by
   * itself a moment after the page came back — "it comes and goes". Leaving
   * Stripe without paying IS the cancelled outcome, so show it: the card stays
   * until the agency dismisses it, with Resume payment still one click away.
   */
  useEffect(() => {
    const pickUp = (restoredFromCache: boolean) => {
      // The Stripe return page has the same path as the profile it steps back
      // to. It must not take its own result, or the result is gone by the time
      // the original entry loads and the outcome is never shown.
      if (window.location.search.includes('payment=')) return;
      const result = takeCheckoutResult(window.location.pathname);
      if (result && result.caregiverId === caregiverId) {
        setResume({ transactionId: result.transactionId, outcome: result.outcome });
        setPayOpen(true);
        return;
      }
      // No transaction id: nothing was paid, so there is nothing to confirm.
      // Checked whether the page was restored or reloaded, because which of the
      // two the browser does after Back is not ours to decide — and the agency
      // must see the same thing either way.
      const origin = takeCheckoutOrigin(window.location.pathname, caregiverId);
      if (origin) {
        setResume({ transactionId: '', outcome: 'cancelled' });
        setPayOpen(true);
        return;
      }
      if (restoredFromCache) setPayOpen(false);
    };
    pickUp(false);
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      // SCRUM-161: back from Stripe by the browser's Back button lands on the
      // spare entry pushed before leaving (same page, same document). Step
      // back once more so the tab sits on the real entry — nothing is loading
      // on a restored page, so this is safe — then show the outcome.
      if (onPadEntry()) window.history.back();
      pickUp(true);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [caregiverId]);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setDocsOpen(true))
      ) : (
      <DownloadPackageButton
        caregiverId={caregiverId}
        caregiverName={caregiverName}
        className={className}
        onDownloaded={onDownloaded}
        // Always open the list — locked for an agency that has not paid, so
        // they can see what the packet holds before buying, and unlocked for
        // one that has, so they can see what they own and re-download it.
        onOpenList={() => setDocsOpen(true)}
        // Kept for the download path this button still has when no list is
        // wired up: a 402 is the paywall working, not an error.
        onPaymentRequired={() => setDocsOpen(true)}
      />
      )}

      {/* Only one dialog is mounted at a time. Keeping both mounted meant the
          documents modal was still playing its exit animation while the gate
          played its entrance, so the payment card appeared to flash in and out
          before settling. */}
      {docsOpen && (
        <PacketDocumentsModal
          open
          onOpenChange={setDocsOpen}
          caregiverId={caregiverId}
          caregiverName={caregiverName}
          refreshKey={paidTick}
          onUnlock={() => {
            // Close first, then open the gate on the next frame, so the two
            // dialogs never overlap.
            setDocsOpen(false);
            requestAnimationFrame(() => setPayOpen(true));
          }}
        />
      )}

      {payOpen && (
        <PaymentGateModal
          open
          onOpenChange={(v) => {
            setPayOpen(v);
            if (!v) {
              setResume(null);
              // SCRUM-161: remember that this return has been dealt with, so a
              // refresh does not replay it. The address bar is left as it is:
              // rewriting it with history.replaceState made Next restore the
              // router and cancel the profile's data loads mid-flight, which
              // is what left the avatar and cover blank.
              const tx = params.get('tx');
              if (params.get('payment') && tx) markCheckoutHandled(tx);
              // Dismissing "Payment successful" reveals what was bought. Next
              // frame, so the closing dialog and the opening one never overlap.
              if (showUnlocked) {
                setShowUnlocked(false);
                requestAnimationFrame(() => setDocsOpen(true));
              }
            }
          }}
          resume={resume}
          caregiverId={caregiverId}
          caregiverName={caregiverName}
          caregiverImage={caregiverImage}
          caregiverRole={caregiverRole}
          onPaid={async (nameFromPacket) => {
            // Two designed screens follow a payment, in this order:
            //   1. the gate's "Payment successful" card, which promises the
            //      download is starting and offers "Download again", so the
            //      download really does have to run here;
            //   2. the unlocked documents list, once that card is dismissed.
            //
            // Only the second was missing: the gate unmounts this modal during
            // checkout and nothing brought it back, so the agency's purchase
            // ended with a ZIP in the downloads tray and no sight of what they
            // had bought. The flag below is read when the gate closes rather
            // than acted on here, because the gate awaits this callback before
            // setting its own success state — closing it mid-await would strand
            // that and skip screen 1 entirely.
            await downloadCredentialPacket(
              caregiverId,
              caregiverName || nameFromPacket || ''
            );
            setPaidTick((t) => t + 1);
            onDownloaded?.();
            setShowUnlocked(true);
          }}
        />
      )}
    </>
  );
};

export default PacketDownloadAction;
