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
  const { data: documents } = useDocuments();

  useEffect(() => {
    if (!user?.completionPercentage && user?.role === 'pro') {
      return router.push('/pro/onboard/personal-info');
    } else if (
      !user?.completionPercentage &&
      user?.role === 'partner' &&
      !isPartnerOnboarded
    ) {
      return router.push('/partner/onboard/personal-info');
    }
  }, [user]);

  const isAccountPage =
    pathname.includes('notifications') || pathname.includes('settings');

  // BUG-03: Only show modal if there are actionable credentials (not_uploaded or rejected)
  const hasActionableCredentials = useMemo(() => {
    if (!documents) return true; // Still loading, show modal as fallback
    return REQUIRED_CREDENTIALS.some((c) => {
      const doc = (documents ?? []).find((d: any) => d.documentType === c.documentType);
      if (!doc) return true; // not_uploaded → actionable
      if (doc.reviewStatus === 'rejected') return true; // rejected → actionable
      return false; // pending or approved → not actionable
    });
  }, [documents]);

  const showCompleteProfileModal =
    user?.role === 'pro' &&
    (user?.completionPercentage ?? 0) < 100 &&
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
