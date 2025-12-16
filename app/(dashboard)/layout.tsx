'use client';
import Account from '@/components/global/dashboard/account/account';
import DashboardNav from '@/components/global/dashboard/dashboard-nav';
import DashboardLayout from '@/components/global/dashboard/dashboard-layout';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { ReactNode, useEffect } from 'react';
import { useUserContext } from '@/lib/contexts';

interface DashboardProps {
  children: ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const isPartnerOnboarded = useSearchParams().get('onboarded') === 'true';
  // console.log('🚀 ~ Dashboard ~ isPartnerOnboarded:', isPartnerOnboarded);
  const router = useRouter();

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

  return (
    <main className='bg-[#F9F9FA]'>
      <DashboardNav />
      {isAccountPage ? (
        <Account>{children}</Account>
      ) : (
        <DashboardLayout>{children}</DashboardLayout>
      )}
    </main>
  );
};

export default Dashboard;
