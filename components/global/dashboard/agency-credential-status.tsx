'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCredentialStatus } from '@/app/actions';
import CredentialStatusCard, { getUrgencyPill, resolveCardStatus } from './credential-status-card';
import DocumentPreviewModal from './document-preview-modal';
import { OPEN_PACKET_EVENT } from './payment/packet-download-action';
import {
  byCredentialDisplayOrder,
  PCA_EXAM,
  PCA_SIGNOFF,
  type CredentialStatus,
} from '@/lib/credential-config';

interface AgencyCredentialStatusProps {
  userId: string;
  /**
   * SCRUM-110: the certification credential is role-driven — a PCA's card must
   * not be labelled "CNA Certificate". The caregiver's own section reads the
   * role off its user context; an agency is looking at somebody else, so the
   * page has to hand it down.
   */
  caregiverRole?: string;
}

/*
 * SCRUM-165: the PCA certification block's tint, copied verbatim from the
 * caregiver's own section (credential-status-section.tsx) so the two surfaces
 * are the same block, not two blocks that merely resemble each other. Weakest
 * shown part wins: red, then yellow, then neutral, and green only when every
 * part is confirmed. No new colours — changing either surface's tint means
 * changing both.
 */
const PCA_GROUP_TINTS = [
  'border-[#FCE8E8] bg-[#FEFCFC]',
  'border-[#FCFFDD] bg-[#FFFDF6]',
  'border-[#DFE2E0] bg-white',
  'border-[#BBF8DC] bg-[#F4FDF8]',
];

const pcaGroupTintRank = (c: CredentialStatus) => {
  const status = resolveCardStatus(c);
  // SCRUM-136: "expiring soon" is the urgency pill now, not a status, so the
  // group tint reads it from there.
  const urgency = getUrgencyPill(c);
  if (status === 'expired') return 0;
  if (urgency) return 1;
  return status === 'confirmed' ? 3 : 2;
};

/**
 * SCRUM-63: agency's view of a caregiver's Credentials Status.
 *
 * This is a subtraction-based variant of the caregiver-side section
 * (credential-status-section.tsx): identical container, header, badges, card
 * structure, status bands, expiration countdown and copy — it reuses the same
 * CredentialStatusCard in `readOnly` mode, which removes only the caregiver-only
 * elements (the "Confirmed by Wevoro on …" line, the three-dot menu, and the
 * edit/re-upload actions).
 */
const AgencyCredentialStatus: React.FC<AgencyCredentialStatusProps> = ({
  userId,
  caregiverRole,
}) => {
  const isPca = caregiverRole === 'PCA';
  const [collapsed, setCollapsed] = useState(false);
  const [credentials, setCredentials] = useState<CredentialStatus[]>([]);
  const [loading, setLoading] = useState(true);
  // SCRUM-130: paid agencies open a credential directly; unpaid ones read it in
  // the preview below, which carries no download control.
  const [packetPaid, setPacketPaid] = useState(false);
  const [preview, setPreview] = useState<{ documentId: string; title: string } | null>(
    null
  );

  useEffect(() => {
    if (!userId) return;
    getCredentialStatus(userId).then((data) => {
      if (data) setCredentials(data);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/payment/packet/${userId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setPacketPaid(!!j?.data?.paid);
      })
      // A failure here means the preview is shown rather than the direct link.
      // That is the safe side to fail to: nothing is given away.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // SCRUM-63 Scenario 1 and 4: the agency sees ALL five required credentials,
  // including the ones the caregiver has not uploaded — that is the deliberate
  // Model C difference from the caregiver's own section, which lists only what
  // has been uploaded. An agency deciding whether to hire needs to see that a
  // TB Test is missing, not just be shown the four that exist. The card itself
  // renders the not-uploaded state as a name plus a badge with no metadata and
  // no View Credential action.
  // SCRUM-137: this section rendered REQUIRED_CREDENTIALS order (Certificate,
  // Driver's License, Auto Insurance, CPR, TB) while the caregiver's own section
  // used the design order, so one caregiver's credentials appeared in two
  // different orders. Both now sort by the same shared display order.
  const shownCredentials = [...(credentials ?? [])].sort(byCredentialDisplayOrder);

  // SCRUM-123: a credential's file is withheld until the packet is bought, so
  // "View Credential" opens the locked documents list with its unlock action.
  // That list belongs to the download action further down the page — ask it to
  // open, and say something useful on a surface that has none.
  const openLockedPacket = () => {
    const handled = !window.dispatchEvent(
      new CustomEvent(OPEN_PACKET_EVENT, {
        detail: { caregiverId: userId },
        cancelable: true,
      })
    );
    if (!handled) {
      toast.error("Unlock this caregiver's packet to view their credentials");
    }
  };
  const verifiedCount = shownCredentials.filter((c) => c.state === 'verified').length;
  const pendingCount = shownCredentials.filter((c) => c.state === 'pending').length;
  const rejectedCount = shownCredentials.filter((c) => c.state === 'rejected').length;
  const missingCount = shownCredentials.filter((c) => c.state === 'not_uploaded').length;

  if (loading) {
    return (
      <div className='bg-white md:rounded-2xl px-4 p-6 md:p-8'>
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='w-6 h-6 text-gray-400 animate-spin' />
        </div>
      </div>
    );
  }

  // Only when the caregiver has no configured credentials at all (no role yet)
  // is there nothing to show. A caregiver who has uploaded none of the five
  // still renders five not-uploaded cards, per SCRUM-63 Scenario 1.
  if (shownCredentials.length === 0) return null;

  return (
    // White background container matching Personal/Professional Information sections
    <div className='bg-white md:rounded-2xl px-4 p-6 md:p-8'>
      <div className='flex flex-col gap-4'>
        {/* Section header — matches caregiver-side heading size, weight & badges */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className='flex items-center justify-between w-full group border-b pb-4'
        >
          <div className='flex items-center gap-2 flex-wrap'>
            <h2 className='text-lg md:text-2xl font-semibold text-tertiary'>
              Credentials Status
            </h2>
            <div className='flex items-center gap-1.5'>
              {verifiedCount > 0 && (
                <span className='text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium'>
                  {verifiedCount} confirmed
                </span>
              )}
              {pendingCount > 0 && (
                <span className='text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium'>
                  {pendingCount} pending
                </span>
              )}
              {rejectedCount > 0 && (
                <span className='text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium'>
                  {rejectedCount} rejected
                </span>
              )}
              {missingCount > 0 && (
                <span className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium'>
                  {missingCount} not uploaded
                </span>
              )}
            </div>
          </div>
          {collapsed ? (
            <ChevronDown className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          ) : (
            <ChevronUp className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          )}
        </button>

        {!collapsed && (
          <div className='grid gap-4'>
            {shownCredentials.map((cred: CredentialStatus, idx: number) => {
              // The same title overrides the caregiver's own section applies,
              // so the two views read identically (SCRUM-90 parity). The
              // certification is named for the caregiver's own track — without
              // this a PCA's card was labelled "CNA Certificate" to every
              // agency — and driver_license carries the design's wording.
              const titleOverride =
                cred.key === 'certifications'
                  ? isPca
                    ? cred.document?.part === 'written_exam'
                      ? PCA_EXAM.label
                      : 'PCA Certification'
                    : 'CNA Certification'
                  : cred.key === 'driver_license'
                    ? 'Driving License'
                    : undefined;

              const cardFor = (c: CredentialStatus, title?: string) => (
                <CredentialStatusCard
                  credential={c}
                  index={idx}
                  titleOverride={title}
                  readOnly
                  onLockedView={openLockedPacket}
                  packetPaid={packetPaid}
                  onPreview={setPreview}
                />
              );

              // SCRUM-165: a PCA's certificate is two documents. The written
              // exam is the item itself — it alone decides the header counts
              // and the share gate — and the RN/LPN practical sign-off follows
              // it as a second card built from its own row, so an agency sees
              // the sign-off's own status rather than the exam's. It is
              // read-only like the rest, opens under the same rule (confirmed
              // only), and ships in the paid packet once approved.
              //
              // The two cards used to sit flat in the list, side by side with
              // the other credentials, so an agency read them as two separate
              // requirements — the screenshot the client sent. They now share
              // one tinted block under a "PCA Certifications" heading, the same
              // block the caregiver sees on their own profile and the admin
              // sees in review, so the certification reads as ONE credential
              // made of two parts everywhere.
              //
              // The sign-off card still appears only once a sign-off exists:
              // existing PCA caregivers uploaded one certificate, and a blank
              // second card would read as something missing that was never
              // asked of them. The block itself is drawn either way, as it is
              // on the caregiver's section and in admin review — it names the
              // credential, so dropping it for a one-part PCA would make the
              // same caregiver look like a different kind of credential once
              // the sign-off landed.
              //
              // A CNA is untouched: one certificate card, no block, no heading
              // change (SCRUM-110 — the two tracks are exclusive).
              if (cred.key === 'certifications' && isPca) {
                const signoff: CredentialStatus | null = cred.signoff?.document
                  ? {
                      ...cred,
                      label: PCA_SIGNOFF.label,
                      state: cred.signoff.state ?? 'not_uploaded',
                      document: cred.signoff.document,
                    }
                  : null;
                const parts = [cred, signoff].filter((c): c is CredentialStatus => !!c);
                const tint =
                  PCA_GROUP_TINTS[Math.min(...parts.map(pcaGroupTintRank))] ?? PCA_GROUP_TINTS[2];
                return (
                  <div key={cred.key} className={`rounded-2xl border p-4 ${tint}`}>
                    <h3 className='mb-3 text-lg md:text-2xl font-semibold text-[#1C1C1C]'>
                      PCA Certifications
                    </h3>
                    <div className='grid gap-3'>
                      {cardFor(cred, titleOverride)}
                      {signoff && cardFor(signoff, PCA_SIGNOFF.label)}
                    </div>
                  </div>
                );
              }

              return <React.Fragment key={cred.key}>{cardFor(cred, titleOverride)}</React.Fragment>;
            })}
          </div>
        )}
      </div>

      {/* SCRUM-130: the free view. The file is readable, and nothing here hands
          over a copy — no download button, and the iframe suppresses the
          browser's own PDF toolbar, which is where the download used to be. */}
      <DocumentPreviewModal
        open={!!preview}
        onOpenChange={(next) => {
          if (!next) setPreview(null);
        }}
        fileName={preview?.title || 'Credential'}
        fileUrl={preview ? `/api/document/view/${preview.documentId}` : ''}
        allowDownload={false}
        forceFrame
        readOnly
        footerNote='Preview only — unlock this caregiver’s packet to download the file.'
      />
    </div>
  );
};

export default AgencyCredentialStatus;
