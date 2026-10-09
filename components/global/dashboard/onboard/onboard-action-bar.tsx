'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PacketDownloadAction from '@/components/global/dashboard/payment/packet-download-action';
import OnboardConfirmModal from './onboard-confirm-modal';
import SetupDocumentsPrompt from '@/components/global/dashboard/esign/setup-documents-prompt';

export type OnboardState = 'none' | 'awaiting' | 'signing' | 'submitted' | 'declined';

export interface OnboardSummary {
  state: OnboardState;
  offerId: string | null;
  onboardedAt: string | null;
  submittedAt: string | null;
  signedCount: number;
  totalToSign: number;
  caregiverRole: string;
  signingDocuments: number;
  paid: boolean;
  paidAt?: string | null;
  priceCents: number;
  /** B5: an agency cannot onboard before its own account is complete. */
  agencyAccountComplete?: boolean;
}

/** "$25" for whole dollars, "$49.99" otherwise — as on the design's button. */
export const priceLabel = (cents?: number | null) =>
  cents === null || cents === undefined
    ? ''
    : `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;

// Faisal's B1–B5: one 300×75 slot in the Back row, five states, so the bar
// never reflows as the onboarding moves on.
const SLOT = 'h-12 md:h-[75px] w-full sm:w-auto md:w-[300px] rounded-[12px] px-6';
const BUTTON = `${SLOT} text-sm md:text-lg gap-2 font-medium`;

interface OnboardActionBarProps {
  caregiverId: string;
  caregiver?: any;
}

/**
 * SCRUM-141 — the one primary action on a caregiver's profile, for an agency.
 *
 *   not onboarded     → Onboard (B1), or Complete your account (B5) when the
 *                       agency's own account is not complete yet
 *   waiting / signing → an "Awaiting signature" status, not a button (B2)
 *   submitted         → Download package · $price, behind the paywall (B3)
 *   paid              → Download again, free (B4)
 *
 * It replaces the purple Download Credentials button, which let an agency buy a
 * caregiver's credentials before the caregiver had agreed to anything. Sits in
 * the profile's Back row, which stays pinned while the page scrolls.
 */
const OnboardActionBar: React.FC<OnboardActionBarProps> = ({ caregiverId, caregiver }) => {
  const [status, setStatus] = useState<OnboardSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // SCRUM-117 Scenario 7: no signing documents for this caregiver's role yet.
  const [setupOpen, setSetupOpen] = useState(false);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const info = caregiver?.personalInfo;
  // Empty until the profile answers. Everything below decides for itself what
  // to say in that moment, instead of passing a placeholder down to be
  // first-named into "This".
  const realName = `${info?.firstName || ''} ${info?.lastName || ''}`.trim();
  const name = realName || 'this caregiver';
  const first = info?.firstName?.trim() || realName;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/offer/onboard-status/${caregiverId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || json?.status !== 200) throw new Error(json?.message);
      setStatus(json.data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [caregiverId]);

  useEffect(() => {
    load();
  }, [load]);

  // The caregiver may respond while this page is open in a background tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const queryClient = useQueryClient();
  const onboard = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/offer/onboard/${caregiverId}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || json?.status !== 200) {
        toast.error(json?.message || 'Could not onboard this caregiver. Try again.');
        return;
      }
      setStatus(json.data);
      // SCRUM-171: the Onboarding list counts this request the next time it is
      // shown, instead of serving the copy it cached before the click.
      // Refetch at once (not just mark stale), so the Onboarding list and the
      // header counts already hold this request when the agency opens them.
      queryClient.invalidateQueries({ queryKey: ['agency-engagements'], refetchType: 'all' });
      setConfirmOpen(false);
      toast.success(`Onboarding request sent to ${name}.`);
    } catch {
      toast.error('Could not onboard this caregiver. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // B2 — "Request sent shows a status, not a disabled button": there is
  // nothing for the agency to do while it waits.
  const statusBox = (title: string, detail: string, tone: 'amber' | 'grey' = 'amber') => (
    <div
      data-testid='onboard-status'
      role='status'
      className={cn(
        SLOT,
        'flex flex-col items-start justify-center gap-0.5 border',
        tone === 'amber' ? 'border-[#F4DFAE] bg-[#FDFFDD]' : 'border-[#DFE2E0] bg-[#F2F4F3]'
      )}
    >
      <span
        className={cn(
          'text-sm font-medium md:text-base',
          tone === 'amber' ? 'text-[#7A5600]' : 'text-[#3A4742]'
        )}
      >
        {title}
      </span>
      <span className={cn('text-xs', tone === 'amber' ? 'text-[#8A7340]' : 'text-[#5E6864]')}>
        {detail}
      </span>
    </div>
  );

  const sent = status?.onboardedAt
    ? `Sent ${moment(status.onboardedAt).format('MMM D, YYYY · h:mm A')}`
    : 'Sent';

  const trigger = (openList: () => void) => {
    if (!status) {
      return failed ? (
        <Button variant='outline' onClick={load} className={cn(BUTTON, 'border-[#DFE2E0]')}>
          Retry
        </Button>
      ) : (
        <div className={cn(SLOT, 'animate-pulse bg-[#EEF0EF]')} aria-hidden />
      );
    }

    // B4 — already paid: re-downloads are free, so no lock and no price.
    if (status.paid) {
      return (
        <Button
          onClick={openList}
          variant='outline'
          className={cn(BUTTON, 'border-[#6C6C6C] bg-white text-[#3A4742] hover:bg-[#F9F9FA]')}
        >
          Download again
        </Button>
      );
    }

    // B3 — signed: the lock says money is involved, the price says how much.
    if (status.state === 'submitted') {
      return (
        <Button
          onClick={openList}
          className={cn(BUTTON, 'bg-[#008000] text-white hover:bg-[#016b01]')}
        >
          <Lock className='size-4 md:size-5' />
          Download package · {priceLabel(status.priceCents)}
        </Button>
      );
    }

    if (status.state === 'awaiting') {
      return statusBox('Awaiting signature', sent);
    }

    if (status.state === 'signing') {
      return statusBox(
        'Awaiting signature',
        `${status.signedCount} of ${status.totalToSign} signed · ${sent}`
      );
    }

    /*
     * A decline used to end here, in a grey "This caregiver declined" box with
     * no action on it: the agency could never ask again, and the caregiver's
     * own copy of the request is removed on decline (SCRUM-55), so neither side
     * could undo it. Riad, 30 Sep: an agency may ask again, as often as it
     * likes. So a declined pair falls through to the Onboard button below, the
     * same as a pair that has never been asked.
     */

    // B5 — the agency's own account is not complete yet.
    // SCRUM-179: the form carries the caregiver, so finishing it returns to
    // this caregiver rather than the generic /agency/profile.
    if (status.agencyAccountComplete === false) {
      return (
        <Button
          onClick={() => router.push(`/agency/complete?proId=${caregiverId}`)}
          className={cn(BUTTON, 'bg-[#008000] text-white hover:bg-[#016b01]')}
        >
          Complete your account
        </Button>
      );
    }

    // B1
    return (
      <Button
        onClick={() =>
          status.signingDocuments === 0 ? setSetupOpen(true) : setConfirmOpen(true)
        }
        className={cn(BUTTON, 'bg-[#008000] text-white hover:bg-[#016b01]')}
      >
        Onboard
      </Button>
    );
  };

  return (
    <>
      <PacketDownloadAction
        caregiverId={caregiverId}
        caregiverName={realName}
        caregiverImage={info?.image}
        caregiverRole={caregiver?.professionalInfo?.role}
        onDownloaded={load}
        renderTrigger={trigger}
      />
      {status && (
        <SetupDocumentsPrompt
          open={setupOpen}
          onOpenChange={setSetupOpen}
          role={(status.caregiverRole === 'PCA' ? 'PCA' : 'CNA') as 'CNA' | 'PCA'}
          caregiverName={realName}
          onUpload={() => router.push('/agency/documents')}
          onContinueAnyway={() => {
            setSetupOpen(false);
            // Next frame, so the two dialogs never overlap.
            requestAnimationFrame(() => setConfirmOpen(true));
          }}
        />
      )}
      {status && (
        <OnboardConfirmModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          caregiverName={realName}
          caregiverRole={status.caregiverRole}
          signingDocuments={status.signingDocuments}
          submitting={submitting}
          onConfirm={onboard}
        />
      )}
    </>
  );
};

export default OnboardActionBar;
