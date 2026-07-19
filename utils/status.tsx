import { Check, X, Clock, Hourglass } from 'lucide-react';

export const statusColors = {
  pending: '#FF9500',
  responded: '#FF9500',
  accepted: '#33B55B',
  onboarded: '#33B55B',
  rejected: '#FF5652',
} as Record<string, string>;

export const statusTexts = {
  pending: 'PENDING',
  responded: 'PENDING CONFIRMATION',
  accepted: 'ACCEPTED',
  onboarded: 'ONBOARDED',
  rejected: 'REJECTED',
} as Record<string, string>;

export const statusIcons = {
  pending: <Hourglass className='size-4' />,
  onboarded: <Check className='size-4' />,
  rejected: <X className='size-4' />,
  responded: <Clock className='size-4' />,
  accepted: <Check className='size-4' />,
} as Record<string, React.ReactNode>;

export const adminStatusMap = {
  block: 'blocked',
  // 'unblocked' is an intent, not a stored status — the API resolves it back to
  // whatever the user's status was before they were blocked.
  unblock: 'unblocked',
  reject: 'rejected',
  approve: 'approved',
  remove: 'removed',
};
export const adminStatusTexts = {
  blocked: 'Blocked',
  rejected: 'Unverified',
  approved: 'Verified',
  removed: 'Removed',
  pending: 'Pending',
  'in-review': 'In Review',
};

export const adminStatusColors = {
  blocked: '#FF5652',
  rejected: '#9CA3AF',
  approved: '#33B55B',
  removed: '#FF5652',
  pending: '#FF9500',
  'in-review': '#FF9500',
};
