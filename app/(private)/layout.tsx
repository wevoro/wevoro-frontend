'use client';

import { useUserContext } from '@/lib/contexts';
import Loading from '../loading';

const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const { isUserLoading } = useUserContext();
  if (isUserLoading) {
    return <Loading />;
  }
  return <>{children}</>;
};

export default PrivateLayout;
