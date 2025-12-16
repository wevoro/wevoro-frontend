'use client';

import * as z from 'zod';

import Auth from '@/components/auth/auth';
import AuthForm from '@/components/auth/auth-form';

import { useAuthContext } from '@/lib/contexts';

const loginFields = [
  {
    name: 'email',
    label: 'Registered Email',
    type: 'email',
    placeholder: 'Enter your email...',
    validation: z
      .string()
      .min(1, { message: 'Email has to be filled.' })
      .email({ message: 'Enter a valid email address' }),
  },
];

export default function ForgotPassword({
  rightTitle,
  rightDescription,
  leftTitle,
  leftDescription,
  alreadyHaveAccount,
  source,
  image,
}: any) {
  const { handleForgotPassword } = useAuthContext();

  return (
    <Auth
      title={'Forgot Password'}
      subtitle={'Recover your account'}
      source={source}
      type='forgot-password'
      image={image}
      descriptionTitle={leftTitle}
      description={leftDescription}
      alreadyHaveAccount={alreadyHaveAccount}
    >
      <AuthForm
        inputFields={loginFields}
        onSubmit={handleForgotPassword}
        submitButtonText='Submit'
        type='forgot-password'
        source={source}
      />
    </Auth>
  );
}
