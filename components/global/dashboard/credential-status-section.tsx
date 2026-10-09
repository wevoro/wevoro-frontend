'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useCredentialStatus } from '@/app/apiHooks/useCredentialStatus';
import { useUserContext } from '@/lib/contexts';
import CredentialStatusCard, { getUrgencyPill, resolveCardStatus } from './credential-status-card';
import RemoveCredentialDialog from './remove-credential-dialog';
import UploadDocumentModal from './upload-document-modal';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  byCredentialDisplayOrder,
  PCA_EXAM,
  PCA_SIGNOFF,
  type CertificatePart,
  type CredentialStatus,
} from '@/lib/credential-config';

const CredentialStatusSection: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; credential: CredentialStatus | null }>({ open: false, credential: null });
  const [removeLoading, setRemoveLoading] = useState(false);
  // SCRUM-165: `part` tells the upload which half of a PCA certificate the
  // Update Verification replaces; unset for every other credential.
  const [uploadModal, setUploadModal] = useState<{ open: boolean; credential: CredentialStatus | null; part?: CertificatePart }>({ open: false, credential: null });
  const { user } = useUserContext();
  const { data: credentials } = useCredentialStatus(user?._id);
  const queryClient = useQueryClient();
  const sectionRef = useRef<HTMLDivElement>(null);
  const jumped = useRef(false);

  /**
   * SCRUM-181: the expiry email's button links to /pro/profile#credentials,
   * the one address both the live site and this build answer. The browser
   * looks for #credentials as soon as the document arrives, long before this
   * section has its cards, finds nothing that tall yet and gives up at the top
   * of the page — so the caregiver lands on their profile but not on their
   * credentials. Once the cards are really on screen, jump to them; once only,
   * so a later upload does not drag the page back up.
   */
  useEffect(() => {
    if (jumped.current || !credentials) return;
    if (typeof window === 'undefined' || window.location.hash !== '#credentials') return;
    jumped.current = true;
    const t = setTimeout(
      () => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      250
    );
    return () => clearTimeout(t);
  }, [credentials]);

  /**
   * SCRUM-178: what has to re-read after an Update Verification or a Remove.
   *
   * The cards here are the obvious one, but the share-link banner is the one
   * the ticket is really about: share-profile-gate reads its Locked / In review
   * / Unlocked state from this same 'credentialStatus' query (under the
   * caregiver's own id, in the profile header and in the Settings sidebar), and
   * the backend recomputes it — re-uploading drops the credential back to
   * pending (document.service.ts) and removing it drops it to Not Uploaded, so
   * the banner has to move without a manual reload. Invalidating the whole
   * 'credentialStatus' key refetches every mounted reader of it at once, which
   * is how the onboarding rows and the GCHEXS section already do this.
   */
  const refreshCredentialViews = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['credentialStatus'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
      queryClient.invalidateQueries({ queryKey: ['user'] }),
    ]);
  // SCRUM-110: CNA and PCA are mutually exclusive tracks — a PCA profile shows
  // the two-document PCA group, a CNA profile the single certificate card.
  const isPca = (user as any)?.professionalInfo?.role === 'PCA';

  // Show ALL uploaded credentials (verified, pending, rejected) — not just verified.
  // SCRUM-165: a PCA who has uploaded only the RN/LPN sign-off (onboarding asks
  // for it first) still gets the certificate group, or that upload would be
  // invisible here. The item's own state is still the written exam's, so the
  // counts below are unchanged.
  const uploadedCredentials = (credentials ?? []).filter(
    (c: CredentialStatus) =>
      c.state !== 'not_uploaded' ||
      (isPca && !!c.signoff && c.signoff.state !== 'not_uploaded')
  );
  const verifiedCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'verified').length;
  const pendingCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'pending').length;
  const rejectedCount = uploadedCredentials.filter((c: CredentialStatus) => c.state === 'rejected').length;
  // SCRUM-137: shared with the agency view so both show the same order.
  const orderedCredentials = [...uploadedCredentials].sort(byCredentialDisplayOrder);

  if (uploadedCredentials.length === 0) return null;

  // SCRUM-178: Remove goes through the same /api/user/document-delete the
  // caregiver's supporting Documents section uses (documents.tsx) — one delete
  // endpoint, so the credential disappears exactly as a supporting document
  // does and comes back as Not Uploaded. The confirmation dialog runs first;
  // this only fires from its "Yes, Remove".
  const handleRemove = async () => {
    if (!removeDialog.credential?.document?._id) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/user/document-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: removeDialog.credential.document._id }),
      });
      const data = await res.json();
      if (data.status === 200 || res.ok) {
        toast.success('Credential removed successfully');
        await refreshCredentialViews();
      } else {
        toast.error(data.message || 'Failed to remove credential');
      }
    } catch {
      toast.error('Failed to remove credential');
    } finally {
      setRemoveLoading(false);
      setRemoveDialog({ open: false, credential: null });
    }
  };

  // SCRUM-108: every credential alert email deep-links to #credentials;
  // nothing carried that id, so the CTA dropped the caregiver at the top of
  // the profile instead of on their credentials.
  return (
    // BUG-05: White background container matching Personal/Professional Information sections
    <div ref={sectionRef} id='credentials' className='bg-white md:rounded-2xl px-4 p-6 md:p-8'>
      <div className='flex flex-col gap-4'>
        {/* BUG-06: Section header — font size matches other section headings */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className='flex items-center justify-between w-full group border-b pb-4'
        >
          <div className='flex items-center gap-2 flex-wrap'>
            <h2 className='text-lg md:text-2xl font-semibold text-tertiary'>
              Credentials Status
            </h2>
            {/* Design: the heading stands alone — each card carries its own
                status, so the confirmed/pending/rejected tally is gone. */}
          </div>
          {collapsed ? (
            <ChevronDown className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          ) : (
            <ChevronUp className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          )}
        </button>

        {!collapsed && (
          <div className='grid gap-4'>
            {orderedCredentials.map((cred: CredentialStatus, idx: number) => {
              const card = (
                c: CredentialStatus,
                titleOverride?: string,
                part?: CertificatePart
              ) => (
                <CredentialStatusCard
                  credential={c}
                  index={idx}
                  titleOverride={titleOverride}
                  onUpdateVerification={() => setUploadModal({ open: true, credential: c, part })}
                  onRemove={() => setRemoveDialog({ open: true, credential: c })}
                />
              );

              // SCRUM-110: the certification credential renders inside a titled
              // group whose tint follows the weakest status. PCA carries two
              // documents, CNA one.
              if (cred.key === 'certifications') {
                // SCRUM-165: the PCA certificate is two documents. The second
                // card used to be cut because only one 'certifications' document
                // existed, and drawing it under both labels showed a sign-off
                // the caregiver never submitted. The sign-off is now its own
                // row (part 'practical_signoff'), so each card is built from its
                // own document: the written exam is the item itself — the only
                // one the share gate and completion read — and the sign-off
                // rides on it as `signoff`. Each card carries its own status,
                // Update and Remove, and its label names the part, so removing
                // one never reads as removing the whole certificate. As with
                // every card in this section, a part shows once it is uploaded;
                // the floating Credentials box and the Completing Profile window
                // list a missing one with its Upload button.
                const primary: CredentialStatus | null =
                  cred.state === 'not_uploaded'
                    ? null
                    : isPca
                      ? { ...cred, label: cred.document?.part === 'written_exam' ? PCA_EXAM.label : 'PCA Certification' }
                      : cred;
                const signoff: CredentialStatus | null =
                  isPca && cred.signoff && cred.signoff.state !== 'not_uploaded'
                    ? {
                        ...cred,
                        label: PCA_SIGNOFF.label,
                        state: cred.signoff.state,
                        document: cred.signoff.document,
                      }
                    : null;
                const parts = [primary, signoff].filter((c): c is CredentialStatus => !!c);

                // Weakest shown part wins: red, then yellow, then neutral, and
                // green only when every part is confirmed.
                const TINTS = [
                  'border-[#FCE8E8] bg-[#FEFCFC]',
                  'border-[#FCFFDD] bg-[#FFFDF6]',
                  'border-[#DFE2E0] bg-white',
                  'border-[#BBF8DC] bg-[#F4FDF8]',
                ];
                const tintRank = (c: CredentialStatus) => {
                  const status = resolveCardStatus(c);
                  // SCRUM-136: "expiring soon" is the urgency pill now, not a
                  // status, so the group tint reads it from there.
                  const urgency = getUrgencyPill(c);
                  if (status === 'expired') return 0;
                  if (urgency) return 1;
                  return status === 'confirmed' ? 3 : 2;
                };
                const tint = TINTS[Math.min(...parts.map(tintRank))] ?? TINTS[2];
                return (
                  <div key={cred.key} className={`rounded-2xl border p-4 ${tint}`}>
                    <h3 className='mb-3 text-lg md:text-2xl font-semibold text-[#1C1C1C]'>
                      {isPca ? 'PCA Certifications' : 'CNA Certification'}
                    </h3>
                    <div className='grid gap-3'>
                      {primary && card(primary, isPca ? primary.label : 'CNA Certification')}
                      {signoff && card(signoff, PCA_SIGNOFF.label, PCA_SIGNOFF.part)}
                    </div>
                  </div>
                );
              }

              return (
                <React.Fragment key={cred.key}>
                  {card(cred, cred.key === 'driver_license' ? 'Driving License' : undefined)}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Remove confirmation dialog */}
        <RemoveCredentialDialog
          open={removeDialog.open}
          onOpenChange={(open) => setRemoveDialog({ open, credential: removeDialog.credential })}
          credentialName={removeDialog.credential?.label || ''}
          onConfirm={handleRemove}
          loading={removeLoading}
        />

        {/* SCRUM-178 / SCRUM-44: Update Verification opens the Upload Document
            modal pre-filled from the credential and locked to it — passing
            `documentType` with no `addMore` is what disables the Category and
            Document Type selects in the modal, and passing the existing
            `document` puts it in edit mode, so the re-upload replaces this
            credential's file instead of creating a second row. SCRUM-165: the
            part travels too, so a PCA sign-off is never replaced by the written
            exam, or the other way round.
            SCRUM-178 Scenario 2: `updateVerification` marks this as the row
            menu's action rather than a plain metadata edit, so the modal
            REQUIRES a new file. Every row in this section opens it that way —
            Confirmed rows say "Update Verification", the rest say "Re-upload
            Document", and both mean "here is a newer file". The backend only
            moves the credential back to Pending review when a file arrives, so
            without this the caregiver got a success toast on an empty form and
            the credential stayed Confirmed. The Documents section keeps editing
            a title without the flag, and without a file, exactly as before.
            The modal has no success callback of its own, so the refresh hangs
            off its close — a cancel costs one refetch, an upload gets the one
            it needs. */}
        {uploadModal.open && uploadModal.credential && (
          <UploadDocumentModal
            category={uploadModal.credential.category}
            documentType={uploadModal.credential.key}
            part={uploadModal.part}
            defaultTitle={uploadModal.credential.label}
            document={uploadModal.credential.document as any}
            updateVerification
            open={uploadModal.open}
            onOpenChange={(open) => {
              if (!open) {
                setUploadModal({ open: false, credential: null });
                refreshCredentialViews();
              }
            }}
          >
            <span />
          </UploadDocumentModal>
        )}
      </div>
    </div>
  );
};

export default CredentialStatusSection;
