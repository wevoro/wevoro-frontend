'use client';

import { getNotifications } from '@/app/actions';
import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserContext } from './user-context';

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  user: string;
  createdAt: string;
  [key: string]: any;
}

interface NotificationsContextValue {
  notifications: Notification[];
  isUnreadNotification: Notification[];
  refetchNotifications: () => void;
  isNotificationsLoading: boolean;
  sendNotification: (
    message: string,
    userId: string,
    email?: string
  ) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotificationsContext must be used within a NotificationsProvider'
    );
  }
  return context;
}

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const { user } = useUserContext();

  const {
    refetch: refetchNotifications,
    data: notifications = [],
    isLoading: isNotificationsLoading,
  } = useQuery({
    queryKey: ['notifications', user?._id],
    queryFn: async () => await getNotifications(),
    enabled: !!user?._id, // Only fetch when user is available
    refetchOnWindowFocus: false,
    // refetchOnMount: false, // Prevent duplicate fetches on Strict Mode
    staleTime: 60 * 1000, // Consider notifications fresh for 1 minute
  });

  const isUnreadNotification = useMemo(
    () => notifications?.filter((noti: Notification) => !noti.isRead) || [],
    [notifications]
  );

  const sendNotification = useCallback(
    async (message: string, userId: string, email?: string) => {
      await fetch('/api/user/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          user: userId,
          email,
        }),
      });
    },
    []
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: notifications || [],
      isUnreadNotification,
      refetchNotifications,
      sendNotification,
      isNotificationsLoading,
    }),
    [
      notifications,
      isUnreadNotification,
      refetchNotifications,
      sendNotification,
      isNotificationsLoading,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export default NotificationsProvider;
