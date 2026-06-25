'use client';

import { getUser } from '@/app/actions';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface User {
  _id: string;
  email: string;
  role: 'pro' | 'partner' | 'admin';
  status: string;
  completionPercentage?: number;
  coverImage?: string;
  // SCRUM-64: caregiver public share link id
  shareId?: string;
  offersSent?: number;
  jobConversionPercentage?: number;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    image?: string;
    dateOfBirth?: string;
    phone?: string;
    gender?: string;
    bio?: string;
    companyName?: string;
    updatedAt?: string;

    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  professionalInfo?: Record<string, any>;
  documents?: Record<string, any>;
}

interface UserContextValue {
  user: User | null;
  isUserLoading: boolean;
  refetchUser: () => void;
  isPersonalInfoCompleted: boolean;
  isProfessionalInfoCompleted: boolean;
  // isDocumentUploadCompleted: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const router = useRouter();

  const {
    refetch: refetchUser,
    data: user,
    isLoading: isUserLoading,
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      return await getUser();
    },
    refetchOnWindowFocus: false,
  });

  // Redirect blocked users
  useEffect(() => {
    if (user?.status === 'blocked') {
      router.push('/logout');
    }
  }, [user?.status, router]);

  const isPersonalInfoCompleted = useMemo(
    () => Object.keys(user?.personalInfo || {}).length > 0,
    [user?.personalInfo]
  );

  const isProfessionalInfoCompleted = useMemo(
    () => Object.keys(user?.professionalInfo || {}).length > 0,
    [user?.professionalInfo]
  );

  // const isDocumentUploadCompleted = useMemo(
  //   () => Object.keys(user?.documents || {}).length > 0,
  //   [user?.documents]
  // );

  const value = useMemo<UserContextValue>(
    () => ({
      user: user ?? null,
      isUserLoading,
      refetchUser,
      isPersonalInfoCompleted,
      isProfessionalInfoCompleted,
      // isDocumentUploadCompleted,
    }),
    [
      user,
      isUserLoading,
      refetchUser,
      isPersonalInfoCompleted,
      isProfessionalInfoCompleted,
      // isDocumentUploadCompleted,
    ]
  );
  // if (isUserLoading) {
  //   return <Loading />;
  // }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserProvider;
