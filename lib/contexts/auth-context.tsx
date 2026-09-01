'use client';

import { logout } from '@/app/actions';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import app from '@/app/firebase/firebase.init';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserContext } from './user-context';
import { EVENTS, resetAnalytics, track } from '../analytics';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

interface AuthContextValue {
  // Auth handlers
  handleLogin: (
    data: { email: string; password: string },
    source: string
  ) => Promise<void>;
  handleSignup: (
    data: { email: string; password: string },
    source: string
  ) => Promise<void>;
  handleForgotPassword: (
    data: { email: string },
    source: string
  ) => Promise<void>;
  handleVerifyOTP: (
    otp: string,
    email: string,
    source: string
  ) => Promise<void>;
  handleResendOTP: (email: string) => Promise<void>;
  handleResetPassword: (
    data: { password: string },
    email: string,
    source: string
  ) => Promise<void>;
  logInWithGoogle: () => Promise<{ result: any; error: any }>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  // SCRUM-99: passwordless agency login (email + emailed code)
  handleRequestCode: (
    email: string,
    source: string
  ) => Promise<boolean>;
  handleVerifyCode: (email: string, otp: string, source: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isOtpResend: boolean;
  isResendOTPLoading: boolean;
  setIsResendOTPLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // URL params
  querySuffix: string;
  shouldStorePro: boolean;
  id: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchUser } = useUserContext();

  const [isLoading, setIsLoading] = useState(false);
  const [isOtpResend, setIsOtpResend] = useState(false);
  const [isResendOTPLoading, setIsResendOTPLoading] = useState(false);

  const id = searchParams.get('id');
  // SCRUM-99: the caregiver share journey passes ?proId= (not ?id=). Treat either
  // as "the caregiver this agency came to view" so passwordless Flow 2 lands on
  // that caregiver's pack instead of the onboarding form.
  const proId = searchParams.get('proId');
  const shouldStorePro = searchParams.get('s') === 'true';
  // SCRUM-87/88: caregiver share-link attribution. Agencies arrive at signup via
  // /p/[shareId] -> /partner/signup?shareId=...; capture it so the backend can
  // attribute this agency to the caregiver who referred them.
  const shareId = searchParams.get('shareId');
  const queryString = searchParams.toString();
  const querySuffix = queryString ? `?${queryString}` : '';

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
    // Clear the PostHog distinct_id so the next person to sign in on this
    // device is not merged into the previous user's profile.
    resetAnalytics();
    await logout();
    router.push('/');
  }, [router]);

  const deleteAccount = useCallback(async () => {
    await fetch('/api/user/delete-account', {
      method: 'DELETE',
    });
    router.push('/logout');
  }, [router]);

  // SCRUM-99: passwordless agency login — step 1, request an emailed code.
  // Creates the account on first use (Flow 2 = email only), then the caregiver
  // can be told a code is on the way. Returns true on success.
  const handleRequestCode = useCallback(
    async (email: string, source: string): Promise<boolean> => {
      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role: source,
          sourceShareId:
            source === 'partner' ? shareId || undefined : undefined,
        }),
      });
      const responseData: any = await response.json();
      if (responseData.status === 200) {
        if (responseData.otpExpiry) {
          window.localStorage.setItem('otpExpiry', responseData.otpExpiry);
        }
        // Fire once, at the moment the account is actually created.
        if (responseData.isNewUser) {
          track(EVENTS.AGENCY_ACCOUNT_CREATED, {
            method: 'email_code',
            viaShareLink: !!shareId,
          });
        }
        toast.success('We sent a login code to your email.', {
          position: 'top-center',
        });
        return true;
      }
      toast.error(responseData.message || 'Could not send the code', {
        position: 'top-center',
      });
      return false;
    },
    [shareId]
  );

  // SCRUM-99: passwordless agency login — step 2, verify the code and land in a
  // session. Routes like a partner login (share-link -> caregiver pack).
  const handleVerifyCode = useCallback(
    async (email: string, otp: string, _source: string) => {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const responseData: any = await response.json();
      if (responseData.status === 200) {
        const completionPercentage = responseData.completionPercentage;
        toast.success('Logged in successfully', { position: 'top-center' });
        // Flow 2 (arrived via a caregiver's share link): land on that caregiver's
        // pack — a Non-confirmed agency can view general credentials there, no
        // completion form required. Flow 1 (direct /partner/access): a new agency
        // goes to the short "Complete your agency account" form; a returning,
        // already-completed agency goes straight to their dashboard.
        const caregiverTarget = id || proId;
        const partnerPath = caregiverTarget
          ? `/partner/pros/${caregiverTarget}?s=true`
          : completionPercentage > 50
            ? '/partner/profile'
            : `/partner/complete${querySuffix}`;
        window.location.href = partnerPath;
        return;
      }
      toast.error(responseData.message || 'Invalid or expired code', {
        position: 'top-center',
      });
    },
    [id, proId, querySuffix]
  );

  const handleLogin = useCallback(
    async (data: { email: string; password: string }, source: string) => {
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

      if (responseData.status === 200) {
        const completionPercentage = responseData.completionPercentage;

        toast.success(responseData.message || 'Login successful', {
          position: 'top-center',
        });

        // Use window.location.href to force full page reload
        // This ensures cookies are fresh and React Query cache is cleared
        if (source === 'admin') {
          window.location.href = '/admin';
        } else {
          const proPath =
            completionPercentage >= 50
              ? '/pro/profile'
              : '/pro/onboard/personal-info?autofill=true';

          // Same null-`id` guard as the onboarding redirect: the share-link
          // journey passes ?proId=, not ?id=, so `id` is null there.
          const partnerPath =
            completionPercentage > 50
              ? querySuffix && id
                ? `/partner/pros/${id}?s=true`
                : '/partner/profile'
              : `/partner/onboard/personal-info${querySuffix}`;

          // SCRUM-108: middleware parks the intended destination in ?redirect=
          // when a signed-out user opens a protected link (e.g. the CTA in a
          // credential alert email). Honour it, but only same-origin relative
          // paths, so the param can't be used as an open redirect.
          const requested =
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('redirect')
              : null;
          const safeRedirect =
            requested && /^\/(?!\/)/.test(requested) ? requested : null;

          if (source === 'pro') window.location.href = safeRedirect || proPath;
          if (source === 'partner')
            window.location.href = safeRedirect || partnerPath;
        }
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || 'Login failed', {
          position: 'top-center',
        });
      }
    },
    [querySuffix, id]
  );

  const handleSignup = useCallback(
    async (data: { email: string; password: string }, source: string) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: source,
          // SCRUM-87/88: pass share-link attribution for agency signups.
          sourceShareId: source === 'partner' ? shareId || undefined : undefined,
        }),
      });

      const responseData: any = await response.json();

      if (responseData.status === 200) {
        if (source === 'pro') {
          router.push('/pro/login');
        } else {
          // Fired before the redirect: signup routes to /partner/login, and a
          // full navigation would drop a queued event. `viaShareLink` tells us
          // whether a caregiver's link brought this agency in — the key number
          // for the share funnel.
          track(EVENTS.AGENCY_ACCOUNT_CREATED, {
            method: 'password',
            viaShareLink: !!shareId,
          });
          router.push(`/partner/login${querySuffix}`);
        }
        toast.success(responseData.message || 'Signup successful', {
          position: 'top-center',
        });
        return;
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || 'Signup failed', {
          position: 'top-center',
        });
      }
    },
    // shareId feeds the AGENCY_ACCOUNT_CREATED tracking event, so it must be in
    // the deps to avoid a stale closure dropping share-link attribution.
    [router, querySuffix, shareId]
  );

  const handleForgotPassword = useCallback(
    async (data: { email: string }, source: string) => {
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
        toast.success(responseData.message || 'OTP sent successfully', {
          position: 'top-center',
        });
        return;
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || 'OTP sending failed', {
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
      toast.success(responseData.message || 'OTP resent successfully', {
        position: 'top-center',
      });
      return;
    }

    if (responseData.status === 500) {
      setIsResendOTPLoading(false);
      toast.error(responseData.message || 'OTP resending failed', {
        position: 'top-center',
      });
    }
  }, []);

  const handleVerifyOTP = useCallback(
    async (otp: string, email: string, source: string) => {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const responseData: any = await response.json();

      if (responseData.status === 200) {
        source === 'pro'
          ? (window.location.href = `/pro/reset-password?email=${email}`)
          : (window.location.href = `/partner/reset-password?email=${email}`);
        toast.success(responseData.message || 'OTP verified successfully', {
          position: 'top-center',
        });
        return;
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || 'OTP verification failed', {
          position: 'top-center',
        });
        return;
      }
    },
    []
  );

  const handleResetPassword = useCallback(
    async (data: { password: string }, email: string, source: string) => {
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
          window.location.href = '/pro/login';
        } else {
          window.location.href = '/partner/login';
        }
        toast.success(responseData.message || 'Password reset successful', {
          position: 'top-center',
        });
        return;
      }

      if (responseData.status === 500) {
        toast.error(responseData.message || 'Password reset failed', {
          position: 'top-center',
        });
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      handleLogin,
      handleSignup,
      handleForgotPassword,
      handleVerifyOTP,
      handleResendOTP,
      handleResetPassword,
      logInWithGoogle,
      logOut,
      deleteAccount,
      handleRequestCode,
      handleVerifyCode,
      isLoading,
      setIsLoading,
      isOtpResend,
      isResendOTPLoading,
      setIsResendOTPLoading,
      querySuffix,
      shouldStorePro,
      id,
    }),
    [
      handleLogin,
      handleSignup,
      handleForgotPassword,
      handleVerifyOTP,
      handleResendOTP,
      handleResetPassword,
      logInWithGoogle,
      logOut,
      deleteAccount,
      handleRequestCode,
      handleVerifyCode,
      isLoading,
      isOtpResend,
      isResendOTPLoading,
      querySuffix,
      shouldStorePro,
      id,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
