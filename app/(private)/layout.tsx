'use client';

import { useUserContext } from '@/lib/contexts';
import Loading from '../loading';
import FloatingFeedback from '@/components/global/feedback/floating-feedback';

const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isUserLoading } = useUserContext();
  if (isUserLoading) {
    return <Loading />;
  }

  // The Feedback button was built and documented but never had an import site,
  // so it has never rendered anywhere — it was not behind a feature flag. Beta
  // wants it on every logged-in caregiver/agency screen, and this layout is the
  // common ancestor of all of them. Allowlisting pro/partner (rather than
  // relying on the component's own `role === 'admin'` check) also keeps it off
  // super_admin screens and off /admin/login, where `user` is still undefined.
  const showFeedback = user?.role === 'pro' || user?.role === 'partner';

  return (
    <>
      {children}
      {showFeedback && <FloatingFeedback />}
    </>
  );
};

export default PrivateLayout;
