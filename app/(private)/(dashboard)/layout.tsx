'use client';
import Account from '@/components/global/dashboard/account/account';
import DashboardNav from '@/components/global/dashboard/dashboard-nav';
import DashboardLayout from '@/components/global/dashboard/dashboard-layout';
import CompleteProfileModal from '@/components/global/dashboard/complete-profile-modal';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { ReactNode, useEffect, useState, useMemo } from 'react';
import { useUserContext } from '@/lib/contexts';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { REQUIRED_CREDENTIALS } from '@/lib/credential-config';

interface DashboardProps {
  children: ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const isPartnerOnboarded = useSearchParams().get('onboarded') === 'true';
  const router = useRouter();
  const [profileModalDismissed, setProfileModalDismissed] = useState(false);
  const { data: documents, isPending: documentsLoading } = useDocuments();

  // Agency onboarding streamlining: an agency arriving from a caregiver share
  // link must reach the credential pack without being pushed through the
  // onboarding wizard first. Its own profile details are deferred to the point
  // of hire rather than gating first view.
  const isViewingCaregiver = pathname.startsWith('/partner/pros/');

  useEffect(() => {
    if (!user?.completionPercentage && user?.role === 'pro') {
      return router.push('/pro/onboard/personal-info');
    } else if (
      !user?.completionPercentage &&
      user?.role === 'partner' &&
      !isPartnerOnboarded &&
      !isViewingCaregiver
    ) {
      return router.push('/partner/onboard/personal-info');
    }
  }, [user, isViewingCaregiver]);

  const isAccountPage =
    pathname.includes('notifications') || pathname.includes('settings');

  // BUG-03: Only show modal if there are actionable credentials (not_uploaded or rejected)
  const hasActionableCredentials = useMemo(() => {
    if (!documents) return false; // Unknown until loaded — see SCRUM-94 below.
    return REQUIRED_CREDENTIALS.some((c) => {
      const doc = (documents ?? []).find((d: any) => d.documentType === c.documentType);
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
        <DashboardLayout>{children}</DashboardLayout>
      )}
      <CompleteProfileModal
        open={showCompleteProfileModal}
        onClose={() => setProfileModalDismissed(true)}
      />
    </main>
  );
};

export default Dashboard;
