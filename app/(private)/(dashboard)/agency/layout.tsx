'use client';

import { useUserContext } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (user && user?.role !== 'partner') {
      return router.push('/');
    }
  }, [user]);

  return <div>{children}</div>;
}
