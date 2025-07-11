'use client';

import { useQuery } from '@tanstack/react-query';
import { getFeedbacks } from '@/app/actions';
import Feedbacks from '@/components/global/feedback/feedbacks';
import { useAppContext } from '@/lib/context';

const FeedbacksPage = () => {
  const { feedbacks, isFeedbacksLoading, isFeedbacksError, refetchFeedbacks } =
    useAppContext();

  if (isFeedbacksLoading) {
    return <div>Loading feedbacks...</div>;
  }

  if (isFeedbacksError) {
    return <div>Failed to load feedbacks.</div>;
  }

  return <Feedbacks feedbacks={feedbacks || []} />;
};

export default FeedbacksPage;
