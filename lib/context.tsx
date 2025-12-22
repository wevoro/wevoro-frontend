/* eslint-disable react/prop-types */

import {
  getFeedbacks,
  getNotifications,
  getOffers,
  getQaFeedbacks,
  getQaUsers,
  getAuthStatus,
  getUser,
  getUsers,
  logout,
} from '@/app/actions';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import app from '@/app/firebase/firebase.init';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
export const UserContext = createContext<any>({});

export function useAppContext() {
  return useContext(UserContext);
}

const ContextProvider = ({ children }: any) => {
  const router = useRouter();
  const [isOpenAlert, setIsOpenAlert] = useState(false);
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [isRefreshed, setIsRefreshed] = useState(false);
  const [cookies, setCookies] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpResend, setIsOtpResend] = useState(false);
  const [isResendOTPLoading, setIsResendOTPLoading] = useState(false);
  const [offerData, setOfferData] = useState<any>(null);
  const [actionData, setActionData] = useState<any>(null);
  const [isOpenOfferAction, setIsOpenOfferAction] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [adminEditData, setAdminEditData] = useState<any>({
    data: null,
    source: null,
  });
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
  // refs
  const personalInfoRef = useRef<HTMLFormElement>(null);
  const professionalInfoRef = useRef<HTMLFormElement>(null);

  const documentUploadRef = useRef<HTMLFormElement>(null);

  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const env = searchParams.get('env');
  const shouldStorePro = searchParams.get('s') === 'true';
  const queryString = searchParams.toString();
  const querySuffix = queryString ? `?${queryString}` : '';

  const openEditModal = useCallback((data: any, source: string) => {
    setAdminEditData({ data, source });
    setIsOpenEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsOpenEditModal(false);
  }, []);

  const openOfferAction = useCallback(() => {
    setIsOpenOfferAction(true);
  }, []);

  const closeOfferAction = useCallback(() => {
    setIsOpenOfferAction(false);
  }, []);

  const openAlert = useCallback(() => {
    setIsOpenAlert(true);
  }, []);

  const openPartner = useCallback((data: any) => {
    setIsPartnerOpen(true);
    setOfferData(data);
  }, []);

  const closeAlert = useCallback(() => {
    setIsOpenAlert(false);
  }, []);

  const closePartner = useCallback(() => {
    setIsPartnerOpen(false);
  }, []);

  const {
    refetch: refetchUser,
    data: user,
    isLoading: isUserLoading,
  } = useQuery({
    queryKey: [`user`],
    queryFn: async () => {
      return await getUser();
    },
    refetchOnWindowFocus: false,
    // refetchOnMount: false,
  });

  const {
    refetch: refetchUsers,
    data: users,
    isLoading: isUsersLoading,
  } = useQuery({
    queryKey: [`users`],
    queryFn: async () => await getUsers(),
  });

  const {
    refetch: refetchQaUsers,
    data: qaUsers,
    isLoading: isQaUsersLoading,
  } = useQuery({
    queryKey: [`qaUsers`, env],
    queryFn: async () => {
      if (env === 'qa') {
        return await getQaUsers();
      } else {
        return [];
      }
    },
  });

  // console.log({ qaUsers });

  const { refetch: refetchNotifications, data: notifications } = useQuery({
    queryKey: [`notifications`, user?._id],
    queryFn: async () => await getNotifications(),
  });

  const {
    refetch: refetchOffers,
    data: offers,
    isLoading: isOffersLoading,
  } = useQuery({
    queryKey: [`offers`, user?._id],
    queryFn: async () => await getOffers(),
  });

  const {
    data: feedbacks,
    isLoading: isFeedbacksLoading,
    isError: isFeedbacksError,
    refetch: refetchFeedbacks,
  } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => await getFeedbacks(),
  });

  const {
    data: qaFeedbacks,
    isLoading: isQaFeedbacksLoading,
    isError: isQaFeedbacksError,
    refetch: refetchQaFeedbacks,
  } = useQuery({
    queryKey: ['qaFeedbacks', env],
    queryFn: async () => {
      if (env === 'qa') {
        return await getQaFeedbacks();
      } else {
        return [];
      }
    },
  });

  const pendingOffers = useMemo(
    () => offers?.filter((offer: any) => offer.status === 'pending') || [],
    [offers]
  );

  const pros = useMemo(
    () => users?.filter((user: any) => user.role === 'pro') || [],
    [users]
  );

  const partners = useMemo(
    () => users?.filter((user: any) => user.role === 'partner') || [],
    [users]
  );

  const jobOffers = useMemo(
    () => offers?.filter((offer: any) => offer.status !== 'pending') || [],
    [offers]
  );

  const qaPros = useMemo(
    () => qaUsers?.filter((user: any) => user.role === 'pro') || [],
    [qaUsers]
  );

  const qaPartners = useMemo(
    () => qaUsers?.filter((user: any) => user.role === 'partner') || [],
    [qaUsers]
  );

  useEffect(() => {
    const getAuthData = async () => {
      const authStatus = await getAuthStatus();
      setIsRefreshed(false);
      // Map new auth status to cookies shape for backward compatibility
      setCookies({
        isAuthenticated: authStatus.isAuthenticated,
        expiresAt: authStatus.expiresAt,
      });
    };

    getAuthData();
  }, [isRefreshed]);

  // if (user?.status === 'blocked') {
  //   return router.push('/');
  // }

  useEffect(() => {
    if (user?.status === 'blocked') {
      router.push('/logout');
    }
  }, [user?.status, router]);

  const logInWithGoogle = useCallback(async () => {
    let result = null,
      error = null;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (e) {
      error = e;
    }

    return { result, error };
  }, []);

  const logOut = useCallback(async () => {
    await logout();
    router.push('/');
  }, [router]);

  const deleteAccount = useCallback(async () => {
    await fetch('/api/user/delete-account', {
      method: 'DELETE',
    });

    router.push('/logout');
  }, [router]);

  const isPersonalInfoCompleted = useMemo(
    () => Object.keys(user?.personalInfo || {}).length > 0,
    [user?.personalInfo]
  );

  const isProfessionalInfoCompleted = useMemo(
    () => Object.keys(user?.professionalInfo || {}).length > 0,
    [user?.professionalInfo]
  );

  const isDocumentUploadCompleted = useMemo(
    () => Object.keys(user?.documents || {}).length > 0,
    [user?.documents]
  );

  const isUndreadNotification = useMemo(
    () => notifications?.filter((noti: any) => !noti.isRead) || [],
    [notifications]
  );

  const handleLogin = useCallback(
    async (data: any, source: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          source,
        }),
      });

      const responseData: any = await response.json();
      refetchUser();
      if (source === 'admin') refetchUsers();
      if (responseData.status === 200) {
        const completionPercentage = responseData.completionPercentage;
        if (source === 'admin') {
          window.location.href = '/admin';
        } else {
          const proPath =
            completionPercentage > 50
              ? '/pro/profile'
              : '/pro/onboard/personal-info';

          const partnerPath =
            completionPercentage > 50
              ? querySuffix
                ? `/partner/pros/${id}?s=true`
                : '/partner/profile'
              : `/partner/onboard/personal-info${querySuffix}`;

          if (source === 'pro') router.push(proPath);
          if (source === 'partner') router.push(partnerPath);
          toast.success(responseData.message || `Login successful`, {
            position: 'top-center',
          });
        }
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || `Login failed`, {
          position: 'top-center',
        });
      }
    },
    [router, refetchUser, refetchUsers, querySuffix, id]
  );

  const handleSignup = useCallback(
    async (data: any, source: string) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: source,
        }),
      });

      const responseData: any = await response.json();

      if (responseData.status === 200) {
        if (source === 'pro') {
          router.push('/pro/login');
        } else {
          router.push(`/partner/login${querySuffix}`);
        }
        toast.success(responseData.message || `Signup successful`, {
          position: 'top-center',
        });
        return;
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || `Signup failed`, {
          position: 'top-center',
        });
      }
    },
    [router, querySuffix]
  );

  const handleForgotPassword = useCallback(
    async (data: any, source: string) => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      const responseData: any = await response.json();

      if (responseData.status === 200) {
        const otpExpiry = responseData.otpExpiry;
        window.localStorage.setItem('otpExpiry', otpExpiry);

        if (source === 'pro') {
          window.location.href = `/pro/verify-otp?email=${data.email}`;
        } else {
          window.location.href = `/partner/verify-otp?email=${data.email}`;
        }
        toast.success(responseData.message || `OTP sent successfully`, {
          position: 'top-center',
        });
        return;
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || `OTP sending failed`, {
          position: 'top-center',
        });
      }
    },
    []
  );
  const handleResetPassword = useCallback(
    async (data: any, email: string, source: string) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: data.password,
        }),
      });

      const responseData: any = await response.json();

      if (responseData.status === 200) {
        if (source === 'pro') {
          window.location.href = `/pro/login`;
        } else {
          window.location.href = `/partner/login`;
        }
        toast.success(responseData.message || `Password reset successful`, {
          position: 'top-center',
        });
        return;
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || `Password reset failed`, {
          position: 'top-center',
        });
      }
    },
    []
  );

  const handleResendOTP = useCallback(async (email: string) => {
    setIsResendOTPLoading(true);
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const responseData: any = await response.json();

    if (responseData.status === 200) {
      setIsOtpResend(true);
      const otpExpiry = responseData.otpExpiry;
      window.localStorage.setItem('otpExpiry', otpExpiry);
      setIsResendOTPLoading(false);
      toast.success(responseData.message || `OTP resent successfully`, {
        position: 'top-center',
      });
      return;
    }

    if (responseData.status === 500) {
      setIsResendOTPLoading(false);
      toast.error(responseData.message || `OTP resending failed`, {
        position: 'top-center',
      });
    }
  }, []);

  const handleVerifyOTP = useCallback(
    async (otp: any, email: string, source: string) => {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const responseData: any = await response.json();

      if (responseData.status === 200) {
        if (source === 'pro') {
          window.location.href = `/pro/reset-password?email=${email}`;
        } else {
          window.location.href = `/partner/reset-password?email=${email}`;
        }
        toast.success(responseData.message || `OTP verified successfully`, {
          position: 'top-center',
        });
        return;
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || `OTP verification failed`, {
          position: 'top-center',
        });
      }
    },
    []
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

  const handleSavePersonalInfo = useCallback(
    async (source: string) => {
      try {
        if (personalInfoRef.current) {
          console.log('insidee', personalInfoRef.current);
          await personalInfoRef.current.submitForm();
        }

        if (source === 'pro' && professionalInfoRef.current) {
          await professionalInfoRef.current.submitForm();
        }
        if (source === 'pro' && documentUploadRef.current) {
          console.log('documentUploadRef.current', documentUploadRef.current);
          await documentUploadRef.current.submitForm();
        }
        closeEditModal();
      } catch (error) {
        console.error('Error submitting forms:', error);
      }
    },
    [closeEditModal]
  );

  // console.log({ user });

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      // User data
      user,
      isPersonalInfoCompleted,
      isProfessionalInfoCompleted,
      isDocumentUploadCompleted,
      refetchUser,
      isUserLoading,

      // Alert modal
      openAlert,
      closeAlert,
      isOpenAlert,

      // Partner modal
      openPartner,
      closePartner,
      isPartnerOpen,

      // Cookies
      cookies,
      isRefreshed,
      setIsRefreshed,

      // Auth
      logOut,
      logInWithGoogle,
      isLoading,
      setIsLoading,
      handleLogin,
      handleSignup,
      handleForgotPassword,
      handleVerifyOTP,
      handleResendOTP,
      isOtpResend,
      isResendOTPLoading,
      setIsResendOTPLoading,
      handleResetPassword,
      deleteAccount,

      // Offers
      offers,
      refetchOffers,
      isOffersLoading,
      offerData,
      setOfferData,
      pendingOffers,
      jobOffers,

      // Offer action modal
      actionData,
      setActionData,
      isOpenOfferAction,
      openOfferAction,
      closeOfferAction,

      // URL params
      querySuffix,
      shouldStorePro,
      id,

      // Notifications
      notifications,
      refetchNotifications,
      isUndreadNotification,
      sendNotification,

      // Admin: Users
      users,
      refetchUsers,
      isUsersLoading,
      pros,
      partners,

      // Admin: QA Users
      qaPros,
      qaPartners,
      refetchQaUsers,
      isQaUsersLoading,

      // Admin: Feedbacks
      feedbacks,
      isFeedbacksLoading,
      isFeedbacksError,
      refetchFeedbacks,
      qaFeedbacks,
      isQaFeedbacksLoading,
      isQaFeedbacksError,
      refetchQaFeedbacks,
      openFeedbackModal,
      setOpenFeedbackModal,

      // Onboarding refs
      personalInfoRef,
      professionalInfoRef,
      documentUploadRef,
      handleSavePersonalInfo,

      // Edit modal
      openEditModal,
      closeEditModal,
      isOpenEditModal,
      adminEditData,
      setAdminEditData,
    }),
    [
      // User data
      user,
      isPersonalInfoCompleted,
      isProfessionalInfoCompleted,
      isDocumentUploadCompleted,
      refetchUser,
      isUserLoading,

      // Alert modal
      openAlert,
      closeAlert,
      isOpenAlert,

      // Partner modal
      openPartner,
      closePartner,
      isPartnerOpen,

      // Cookies
      cookies,
      isRefreshed,

      // Auth
      logOut,
      logInWithGoogle,
      isLoading,
      handleLogin,
      handleSignup,
      handleForgotPassword,
      handleVerifyOTP,
      handleResendOTP,
      isOtpResend,
      isResendOTPLoading,
      handleResetPassword,
      deleteAccount,

      // Offers
      offers,
      refetchOffers,
      isOffersLoading,
      offerData,
      pendingOffers,
      jobOffers,

      // Offer action modal
      actionData,
      isOpenOfferAction,
      openOfferAction,
      closeOfferAction,

      // URL params
      querySuffix,
      shouldStorePro,
      id,

      // Notifications
      notifications,
      refetchNotifications,
      isUndreadNotification,
      sendNotification,

      // Admin: Users
      users,
      refetchUsers,
      isUsersLoading,
      pros,
      partners,

      // Admin: QA Users
      qaPros,
      qaPartners,
      refetchQaUsers,
      isQaUsersLoading,

      // Admin: Feedbacks
      feedbacks,
      isFeedbacksLoading,
      isFeedbacksError,
      refetchFeedbacks,
      qaFeedbacks,
      isQaFeedbacksLoading,
      isQaFeedbacksError,
      refetchQaFeedbacks,
      openFeedbackModal,

      // Onboarding refs (refs are stable, no need to include)
      handleSavePersonalInfo,

      // Edit modal
      openEditModal,
      closeEditModal,
      isOpenEditModal,
      adminEditData,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export default ContextProvider;
