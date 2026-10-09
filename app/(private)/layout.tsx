'use client';

import { useUserContext } from '@/lib/contexts';
import Loading from '../loading';
import FeedbackMount from '@/components/global/feedback/feedback-mount';

const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const { isUserLoading } = useUserContext();
  if (isUserLoading) {
    return <Loading />;
  }

  return (
    <>
      {children}
      {/* SCRUM-98: the Feedback button on every logged-in caregiver/agency
          screen — this layout is the common ancestor of all of them. Who sees
          it is decided in FeedbackMount, which SCRUM-200 also mounts on the
          public Privacy and Terms pages, so one rule covers both. */}
      <FeedbackMount />
    </>
  );
};

export default PrivateLayout;
