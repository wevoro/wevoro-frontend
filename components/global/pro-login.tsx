'use client';

import * as z from 'zod';

import Auth from '@/components/auth/auth';
import AuthForm from '@/components/auth/auth-form';
import { useAuthContext } from '@/lib/contexts';

const loginFields = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email...',
    validation: z
      .string()
      .min(1, { message: 'Email has to be filled.' })
      .email({ message: 'Enter a valid email address' }),
  },

  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password...',
    validation: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long' }),
  },
];

export default function ProLogin({
  rightTitle,
  rightDescription,
  leftTitle,
  leftDescription,
  alreadyHaveAccount,
}: any) {
  const { handleLogin } = useAuthContext();

  return (
    <Auth
      title={rightTitle}
      subtitle={rightDescription}
      source='pro'
      type='login'
      image='/pro.jpg'
      descriptionTitle={leftTitle}
      description={leftDescription}
      alreadyHaveAccount={alreadyHaveAccount}
    >
      <AuthForm
        inputFields={loginFields}
        onSubmit={handleLogin}
        submitButtonText='Login'
        type='login'
        source='pro'
      />
    </Auth>
  );
}
