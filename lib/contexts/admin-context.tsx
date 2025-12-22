'use client';

import {
  getFeedbacks,
  getQaFeedbacks,
  getQaUsers,
  getUsers,
} from '@/app/actions';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, usePathname } from 'next/navigation';

interface User {
  _id: string;
  email: string;
  role: 'pro' | 'partner' | 'admin';
  [key: string]: any;
}

interface Feedback {
  _id: string;
  [key: string]: any;
}

interface AdminContextValue {
  // Users data
  users: User[];
  refetchUsers: () => void;
  isUsersLoading: boolean;
  pros: User[];
  partners: User[];

  // QA Users (conditional based on env)
  qaUsers: User[];
  qaPros: User[];
  qaPartners: User[];
  refetchQaUsers: () => void;
  isQaUsersLoading: boolean;

  // Feedbacks
  feedbacks: Feedback[];
  isFeedbacksLoading: boolean;
  isFeedbacksError: boolean;
  refetchFeedbacks: () => void;

  // QA Feedbacks
  qaFeedbacks: Feedback[];
  isQaFeedbacksLoading: boolean;
  isQaFeedbacksError: boolean;
  refetchQaFeedbacks: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const env = searchParams.get('env');
  const isQaEnv = env === 'qa';
  const isAdminPage = pathname?.startsWith('/admin');

  // Users - only fetch on admin pages
  const {
    refetch: refetchUsers,
    data: users = [],
    isLoading: isUsersLoading,
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => await getUsers(),
    enabled: isAdminPage, // Only fetch when on admin routes
    refetchOnWindowFocus: false,
    // refetchOnMount: false,
    staleTime: 60 * 1000,
  });

  // QA Users (only fetched when env=qa)
  const {
    refetch: refetchQaUsers,
    data: qaUsers = [],
    isLoading: isQaUsersLoading,
  } = useQuery({
    queryKey: ['qaUsers', env],
    queryFn: async () => {
      if (isQaEnv) {
        return await getQaUsers();
      }
      return [];
    },
    enabled: isAdminPage && isQaEnv, // Only fetch when on admin routes AND in QA env
  });

  // Feedbacks - only fetch on admin pages
  const {
    data: feedbacks = [],
    isLoading: isFeedbacksLoading,
    isError: isFeedbacksError,
    refetch: refetchFeedbacks,
  } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => await getFeedbacks(),
    enabled: isAdminPage, // Only fetch when on admin routes
    refetchOnWindowFocus: false,
    // refetchOnMount: false,
    staleTime: 60 * 1000,
  });

  // QA Feedbacks (only fetched when env=qa)
  const {
    data: qaFeedbacks = [],
    isLoading: isQaFeedbacksLoading,
    isError: isQaFeedbacksError,
    refetch: refetchQaFeedbacks,
  } = useQuery({
    queryKey: ['qaFeedbacks', env],
    queryFn: async () => {
      if (isQaEnv) {
        return await getQaFeedbacks();
      }
      return [];
    },
    enabled: isAdminPage && isQaEnv, // Only fetch when on admin routes AND in QA env
  });

  // Derived data - memoized
  const pros = useMemo(
    () => users?.filter((user: User) => user.role === 'pro') || [],
    [users]
  );

  const partners = useMemo(
    () => users?.filter((user: User) => user.role === 'partner') || [],
    [users]
  );

  const qaPros = useMemo(
    () => qaUsers?.filter((user: User) => user.role === 'pro') || [],
    [qaUsers]
  );

  const qaPartners = useMemo(
    () => qaUsers?.filter((user: User) => user.role === 'partner') || [],
    [qaUsers]
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      // Users
      users,
      refetchUsers,
      isUsersLoading,
      pros,
      partners,

      // QA Users
      qaUsers,
      qaPros,
      qaPartners,
      refetchQaUsers,
      isQaUsersLoading,

      // Feedbacks
      feedbacks,
      isFeedbacksLoading,
      isFeedbacksError,
      refetchFeedbacks,

      // QA Feedbacks
      qaFeedbacks,
      isQaFeedbacksLoading,
      isQaFeedbacksError,
      refetchQaFeedbacks,
    }),
    [
      users,
      refetchUsers,
      isUsersLoading,
      pros,
      partners,
      qaUsers,
      qaPros,
      qaPartners,
      refetchQaUsers,
      isQaUsersLoading,
      feedbacks,
      isFeedbacksLoading,
      isFeedbacksError,
      refetchFeedbacks,
      qaFeedbacks,
      isQaFeedbacksLoading,
      isQaFeedbacksError,
      refetchQaFeedbacks,
    ]
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export default AdminProvider;
