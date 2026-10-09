'use client';
import Account from '@/components/global/dashboard/account/account';
import DashboardNav from '@/components/global/dashboard/dashboard-nav';
import DashboardLayout from '@/components/global/dashboard/dashboard-layout';
import CompleteProfileModal from '@/components/global/dashboard/complete-profile-modal';
import CheckoutReturnScreen from '@/components/global/dashboard/payment/checkout-return-screen';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { ReactNode, useEffect, useState, useMemo } from 'react';
import { useUIContext, useUserContext } from '@/lib/contexts';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { REQUIRED_CREDENTIALS, isPrimaryCredentialRow } from '@/lib/credential-config';

interface DashboardProps {
  children: ReactNode;
}

// SCRUM-176: last wins, the way app/actions.ts#getCredentialStatus and the
// cards resolve a credential — keyed by type in a forEach, so the LAST
// matching row stands for it. A first-match lookup here judged the caregiver's
// OLDEST duplicate, so a re-uploaded credential could keep this modal opening
// on the row it replaced (or stop it opening for a rejection the caregiver
// still has to fix), while the modal itself listed the newer row. The
// predicate keeps isPrimaryCredentialRow, so SCRUM-165 still keeps the PCA
// sign-off from standing in for the certificate.
const lastPrimaryRow = (docs: any[], documentType: string) => {
  for (let i = docs.length - 1; i >= 0; i -= 1) {
    const d = docs[i];
    if (d?.documentType === documentType && isPrimaryCredentialRow(d)) return d;
  }
  return undefined;
};

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const isPartnerOnboarded = useSearchParams().get('onboarded') === 'true';
  const router = useRouter();
  const [profileModalDismissed, setProfileModalDismissed] = useState(false);
  const { data: documents, isPending: documentsLoading } = useDocuments();

  // SCRUM-99: an agency arriving from a caregiver share link must reach the
  // caregiver's credential pack without being pushed through the onboarding
  // wizard first. Its own profile details are deferred to the point of hire
  // rather than gating the first view (Flow 2 — no completion form to view).
  const isViewingCaregiver = pathname.startsWith('/agency/caregivers/');
  // SCRUM-122: the Offers tab is how that same agency gets back to the
  // caregiver once it has navigated away from the profile. Pushing it into the
  // wizard here left the caregiver it had just onboarded through unreachable
  // except by opening the original share link again.
  const isAgencyOffers = pathname.startsWith('/agency/onboardings');

  useEffect(() => {
    if (!user?.completionPercentage && user?.role === 'pro') {
      // SCRUM-173: same prompt as a fresh sign-up — this is a caregiver who has
      // not started onboarding at all.
      return router.push('/caregiver/onboard/personal-info?autofill=true');
    } else if (
      !user?.completionPercentage &&
      user?.role === 'partner' &&
      !isPartnerOnboarded &&
      !isViewingCaregiver &&
      !isAgencyOffers
    ) {
      return router.push('/agency/onboard/personal-info');
    }
  }, [user, isViewingCaregiver, isAgencyOffers]);

  const isAccountPage =
    pathname.includes('notifications') || pathname.includes('settings');
  // SCRUM-154: "Complete credentials" reopens the modal after it was dismissed.
  const { openCompleteProfile, setOpenCompleteProfile } = useUIContext();

  // BUG-03: Only show modal if there are actionable credentials (not_uploaded or rejected)
  const hasActionableCredentials = useMemo(() => {
    if (!documents) return false; // Unknown until loaded — see SCRUM-94 below.
    return REQUIRED_CREDENTIALS.some((c) => {
      // SCRUM-165: the PCA sign-off is also a 'certifications' row. Taken as the
      // certificate, a pending sign-off hid a missing or rejected exam and a
      // rejected one reopened the modal over a verified exam. It is not a
      // trigger here — the completion rule is unchanged.
      const doc = lastPrimaryRow(documents ?? [], c.documentType);
      if (!doc) return true; // not_uploaded → actionable
      if (doc.reviewStatus === 'rejected') return true; // rejected → actionable
      return false; // pending or approved → not actionable
    });
  }, [documents]);

  // SCRUM-94 (Symptom B): wait for the credential query before the modal's first
  // paint. It used to open while `documents` was still undefined, and the modal
  // reads that same undefined list — so every credential looked not-uploaded and
  // it flashed all 5 for ~1-2s before resolving to the real subset.
  const showCompleteProfileModal =
    user?.role === 'pro' &&
    (user?.completionPercentage ?? 0) < 100 &&
    !documentsLoading &&
    hasActionableCredentials &&
    !profileModalDismissed;

  return (
    <main className='bg-[#F9F9FA]'>
      <DashboardNav />
      {isAccountPage ? (
        <Account>{children}</Account>
      ) : (
        <CheckoutReturnScreen>
          <DashboardLayout>{children}</DashboardLayout>
        </CheckoutReturnScreen>
      )}
      <CompleteProfileModal
        open={showCompleteProfileModal || (user?.role === 'pro' && openCompleteProfile)}
        onClose={() => {
          setProfileModalDismissed(true);
          setOpenCompleteProfile(false);
        }}
      />
    </main>
  );
};

export default Dashboard;
