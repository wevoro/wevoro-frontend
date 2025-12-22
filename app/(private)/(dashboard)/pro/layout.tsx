'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserContext } from '@/lib/contexts';

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const { user } = useUserContext();
  const router = useRouter();

  // if (user && user?.role !== 'pro' && !id) {
  //   return router.push('/');
  // }

  useEffect(() => {
    if (user && user?.role !== 'pro' && !id) {
      return router.push('/');
    }
  }, [user]);

  return <div>{children}</div>;
}
