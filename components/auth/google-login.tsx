import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { useAuthContext } from '@/lib/contexts';
import { EVENTS, track } from '@/lib/analytics';

interface GoogleLoginProps {
  source: string;
}

export default function GoogleLogin({ source }: GoogleLoginProps) {
  const { logInWithGoogle, isLoading, setIsLoading, querySuffix, id } =
    useAuthContext();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { result, error } = await logInWithGoogle();
    if (error?.message) {
      setIsLoading(false);
      return toast.error(error.message, {
        position: 'top-center',
      });
    }

    console.log({ result });

    if (result?.user?.email) {
      const payload = {
        name: result.user.displayName,
        email: result.user.email,
        image: result.user.photoURL,
        role: source,
        source,
      };

      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData: any = await response.json();
      console.log('responseData', responseData);

      if (responseData.status === 200) {
        const completionPercentage = responseData.completionPercentage;

        console.log({ completionPercentage });

        // Google sign-in doubles as signup, so only count it when the backend
        // says this call created the account. Without this the event would
        // also fire on every subsequent Google login.
        if (source === 'partner' && responseData.isNewUser) {
          track(EVENTS.AGENCY_ACCOUNT_CREATED, {
            method: 'google',
            viaShareLink: !!querySuffix,
          });
        }

        const proPath =
          completionPercentage > 0
            ? '/pro/profile'
            : '/pro/onboard/personal-info';

        // Mirrors handleLogin in auth-context. `id` now resolves ?proId= too,
        // and is null-checked here — previously a share-link Google signup
        // routed to the literal path /partner/pros/null.
        const partnerPath = id
          ? `/partner/pros/${id}?s=true`
          : completionPercentage > 0
            ? '/partner/profile'
            : `/partner/onboard/personal-info${querySuffix}`;

        source === 'pro'
          ? (window.location.href = proPath)
          : (window.location.href = partnerPath);
        return toast.success(responseData.message || `Login successful`, {
          position: 'top-center',
        });
      }

      if (responseData.status === 500) {
        setIsLoading(false);
        return toast.error(responseData.message || `Login failed`, {
          position: 'top-center',
        });
      }
    }
  };

  return (
    <Button
      className='w-full h-[75px] rounded-[12px] text-lg font-medium text-muted-foreground bg-[#f9f9f9]'
      variant='outline'
      type='button'
      disabled={isLoading}
      onClick={handleGoogleSignIn}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        x='0px'
        y='0px'
        width='24'
        height='24'
        viewBox='0 0 48 48'
        className='mr-2'
      >
        <path
          fill='#FFC107'
          d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'
        ></path>
        <path
          fill='#FF3D00'
          d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'
        ></path>
        <path
          fill='#4CAF50'
          d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'
        ></path>
        <path
          fill='#1976D2'
          d='M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z'
        ></path>
      </svg>
      Login with Google
    </Button>
  );
}
