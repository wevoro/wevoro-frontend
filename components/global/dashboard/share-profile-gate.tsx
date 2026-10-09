'use client';

import React from 'react';
import { Clock, Lock, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ShareProfileModal from './share-profile-modal';
import { resolveCardStatus } from './credential-status-card';
import { useCredentialStatus } from '@/app/apiHooks/useCredentialStatus';
import { useUIContext } from '@/lib/contexts';
import type { CredentialStatus } from '@/lib/credential-config';

/**
 * SCRUM-133 (final, 9/17) — the share link unlocks only at full verification.
 *
 * Reverses SCRUM-64's "share at any state": an agency opening a caregiver's link
 * must only ever see a fully confirmed profile, so the link is withheld until
 * all 5 required credentials are Confirmed. Three states, not two:
 *
 *  - Locked     fewer than 5 confirmed. Shows progress ("3 of 5 verified").
 *               Neutral/dark — a locked state must never read as complete, and
 *               the old design's green here said "basically done" when it wasn't.
 *  - In review  all 5 uploaded, WeVoro still reviewing. Yellow.
 *  - Unlocked   all 5 confirmed. The link is live. Green, and only here.
 *
 * "Confirmed" is the same state the credential cards show (SCRUM-136): an
 * expired credential is not confirmed, and a rejected one needs a new upload,
 * so either keeps the link locked.
 */
export type ShareGateState = 'locked' | 'inReview' | 'unlocked';

export function getShareGate(credentials?: CredentialStatus[] | null): {
  state: ShareGateState;
  confirmed: number;
  total: number;
} {
  const list = credentials ?? [];
  const total = list.length || 5;
  const confirmed = list.filter((c) => resolveCardStatus(c) === 'confirmed').length;
  const uploaded = list.filter((c) => c.state !== 'not_uploaded').length;
  const blocked = list.filter((c) => {
    const s = resolveCardStatus(c);
    return s === 'notConfirmed' || s === 'expired';
  }).length;

  if (list.length > 0 && confirmed === total) return { state: 'unlocked', confirmed, total };
  if (list.length > 0 && uploaded === total && blocked === 0) {
    return { state: 'inReview', confirmed, total };
  }
  return { state: 'locked', confirmed, total };
}

/**
 * SCRUM-133 (Faisal, state 3 — Unlocked): the status a caregiver's own header
 * chip shows. Once all 5 credentials are verified the chip reads Verified
 * instead of In Review (or Pending), because the share card beside it is
 * Unlocked. Shared by the Profile header (pro-info) and the Settings /
 * Notifications sidebar (account-sidebar): the sidebar used to pass the raw
 * account status, so it said "In Review" right above an Unlocked share box.
 *
 * `enabled` is false where the chip is not the caregiver's own (an agency or a
 * visitor viewing the profile): they keep seeing the account status.
 */
export function useCaregiverChipStatus(
  user?: { _id?: string; role?: string; status?: string } | null,
  enabled = true
): string | undefined {
  const isOwnCaregiverChip = enabled && user?.role === 'pro';
  const { data } = useCredentialStatus(isOwnCaregiverChip ? user?._id : undefined);
  const unlocked =
    isOwnCaregiverChip &&
    !!data &&
    getShareGate(data as CredentialStatus[]).state === 'unlocked';
  return unlocked && (user?.status === 'in-review' || user?.status === 'pending')
    ? 'approved'
    : user?.status;
}

interface ShareProfileGateProps {
  userId?: string;
  /** The caregiver's /p/<shareId> link. Empty until the profile has loaded. */
  shareLink: string;
  className?: string;
  /**
   * What to show once the link is unlocked. Defaults to the SCRUM-64 Share
   * Profile button + modal; the Settings sidebar passes its own link-and-Copy
   * row so both surfaces share the same three states (SCRUM-133).
   */
  unlockedContent?: React.ReactNode;
}

const ShareProfileGate: React.FC<ShareProfileGateProps> = ({
  userId,
  shareLink,
  className,
  unlockedContent,
}) => {
  const { data, isLoading } = useCredentialStatus(userId);
  const { setOpenCompleteProfile } = useUIContext();

  if (isLoading || !userId) {
    return (
      <div className={cn('h-11 w-40 animate-pulse rounded-xl bg-[#EEF0EF]', className)} aria-hidden />
    );
  }

  const gate = getShareGate(data as CredentialStatus[] | null);

  if (gate.state === 'unlocked') {
    // SCRUM-133: never hand out a link without a shareId. The /p/ address no
    // longer accepts the database id the old fallback used.
    if (!shareLink) {
      return (
        <div className={cn('h-11 w-40 animate-pulse rounded-xl bg-[#EEF0EF]', className)} aria-hidden />
      );
    }
    return (
      <div className={className} data-testid='share-gate' data-state='unlocked'>
        {unlockedContent ?? (
          <ShareProfileModal shareLink={shareLink}>
            <Button className='h-11 rounded-xl gap-2 font-semibold px-5'>
              <Share2 className='size-4' />
              Share Profile
            </Button>
          </ShareProfileModal>
        )}
      </div>
    );
  }

  // SCRUM-133 (Faisal, Figma 10987:3955 / 10987:9969): the share slot is
  // replaced by a card, not greyed out. A disabled button with no explanation
  // was the inactivity risk the ticket names.
  //   Locked    — the caregiver still owes us something: progress + CTA.
  //   In review — the caregiver owes us nothing: amber, no primary CTA, and
  //               when it should clear.
  const inReview = gate.state === 'inReview';
  const uploaded = inReview ? gate.total : gate.confirmed;
  const pct = Math.round((uploaded / (gate.total || 5)) * 100);
  // SCRUM-154: the Credentials Status section only exists once something has
  // been uploaded, so for a brand-new caregiver this button scrolled to
  // nothing — and the fallback only changed the hash of the page it was
  // already on. With nothing to scroll to it reopens the Completing Profile
  // modal, which lists the five credentials with an Upload button on each.
  const goToCredentials = () => {
    const el = document.getElementById('credentials');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else setOpenCompleteProfile(true);
  };

  return (
    <div
      data-testid='share-gate'
      data-state={gate.state}
      className={cn(
        'flex w-full max-w-[561px] flex-col items-start gap-3 rounded-[12px] border border-[#DFE2E0] bg-[#FAFAFA] p-4 text-left',
        className
      )}
    >
      <div className='flex w-full items-center justify-between gap-3'>
        <p className='flex items-center gap-2 text-[14px] font-semibold text-[#1C1C1C]'>
          {inReview ? (
            <Clock className='size-[18px] text-[#FAB607]' />
          ) : (
            <Lock className='size-[18px] text-[#1C1C1C]' />
          )}
          {inReview ? 'Unlocks after review' : 'Profile link locked'}
        </p>
        <p className='whitespace-nowrap text-[12px] font-medium text-[#6C6C6C]'>
          {inReview
            ? `${gate.total} of ${gate.total} uploaded`
            : `${gate.confirmed} of ${gate.total} verified`}
        </p>
      </div>
      <div
        className='h-1.5 w-full overflow-hidden rounded-[3px] bg-[#DFE2E0]'
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={gate.total}
        aria-valuenow={uploaded}
        aria-label={inReview ? 'Credentials uploaded' : 'Credentials verified'}
      >
        <div
          className={cn('h-full rounded-[3px]', inReview ? 'bg-[#FAB607]' : 'bg-[#1C1C1C]')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p id='share-gate-note' className='text-[13px] leading-[19px] text-[#6C6C6C]'>
        {inReview
          ? 'Everything is in. Our team is reviewing your credentials — usually within 2 business days. We’ll email you the moment your link is ready.'
          : `Agencies can see your profile only after all ${gate.total} credentials are verified.`}
      </p>
      {inReview ? (
        <button
          type='button'
          onClick={goToCredentials}
          className='text-[14px] font-medium text-[#008000] hover:underline'
        >
          View credential status
        </button>
      ) : (
        <Button
          type='button'
          onClick={goToCredentials}
          className='h-auto rounded-[12px] bg-[#008000] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[#016b01]'
        >
          Complete credentials
        </Button>
      )}
    </div>
  );
};

export default ShareProfileGate;
