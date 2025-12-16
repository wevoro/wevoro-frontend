'use client';

import * as z from 'zod';

import Auth from '@/components/auth/auth';
import AuthForm from '@/components/auth/auth-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthContext } from '@/lib/contexts';

const loginFields = [
  {
    name: 'otp',
    label: 'Verification Code',
    type: 'otp',
    placeholder: 'Enter your OTP...',
    validation: z
      .string()
      .min(6, { message: 'OTP has to be 6 digits/characters.' }),
  },
];

export default function VerifyOTP({
  leftTitle,
  leftDescription,
  alreadyHaveAccount,
  source,
  image,
}: any) {
  const { handleVerifyOTP, handleResendOTP, isResendOTPLoading } =
    useAuthContext();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const router = useRouter();

  useEffect(() => {
    if (!email) {
      return router.push('/');
    }
  }, [email, router]);

  const verifyOtp = async (data: any) => {
    await handleVerifyOTP(data.otp, email!, source);
  };

  const resendOTP = async () => {
    await handleResendOTP(email!);
  };

  return (
    <Auth
      title={'Verification Code Is Sent!'}
      subtitle={`A verification code has been sent to your registered email [${email}]. Please enter the code in the below field to verify your account.`}
      source={source}
      type='verify-otp'
      image={image}
      descriptionTitle={leftTitle}
      description={leftDescription}
      alreadyHaveAccount={alreadyHaveAccount}
      resendOTP={resendOTP}
      isResendOTPLoading={isResendOTPLoading}
    >
      <AuthForm
        inputFields={loginFields}
        onSubmit={verifyOtp}
        submitButtonText='Submit'
        type='verify-otp'
        source={source}
      />
    </Auth>
  );
}
