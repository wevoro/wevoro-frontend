'use client';

import Feedbacks from '@/components/global/feedback/feedbacks';
import { useAppContext } from '@/lib/context';

const FeedbacksPage = () => {
  const {
    feedbacks,
    isFeedbacksLoading,
    isFeedbacksError,
    qaFeedbacks,
    isQaFeedbacksLoading,
    isQaFeedbacksError,
  } = useAppContext();

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
