'use client';

import Feedbacks from '@/components/global/feedback/feedbacks';
import { useAdminContext } from '@/lib/contexts';

const FeedbacksPage = () => {
  const {
    feedbacks,
    isFeedbacksLoading,
    isFeedbacksError,
    qaFeedbacks,
    isQaFeedbacksError,
    isQaFeedbacksLoading,
  } = useAdminContext();

  if (isFeedbacksLoading || isQaFeedbacksLoading) {
    return <div>Loading feedbacks...</div>;
  }

  if (isFeedbacksError || isQaFeedbacksError) {
    return <div>Failed to load feedbacks.</div>;
  }

  return (
    <Feedbacks feedbacks={feedbacks || []} qaFeedbacks={qaFeedbacks || []} />
  );
};

export default FeedbacksPage;
