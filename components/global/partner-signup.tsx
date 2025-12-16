'use client';

import * as z from 'zod';

import Auth from '@/components/auth/auth';
import AuthForm from '@/components/auth/auth-form';
import { useAuthContext } from '@/lib/contexts';
const signupFields = [
  {
    name: 'email',
    label: 'Company Email',
    type: 'email',
    placeholder: 'Enter your company email...',
    validation: z
      .string()
      .min(1, { message: 'Company email has to be filled.' })
      .email({ message: 'Enter a valid company email address' }),
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
  {
    name: 'confirmPassword',
    label: 'Re-type Password',
    type: 'password',
    placeholder: 'Re-enter your password...',
    validation: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long' }),
  },
];
export default function PartnerSignup({
  rightTitle,
  rightDescription,
  leftTitle,
  leftDescription,
  alreadyHaveAccount,
}: any) {
  const { handleSignup } = useAuthContext();

  return (
    <Auth
      title={rightTitle}
      subtitle={rightDescription}
      source='partner'
      type='signup'
      image='/partner_signin.svg'
      descriptionTitle={leftTitle}
      description={leftDescription}
      alreadyHaveAccount={alreadyHaveAccount}
    >
      <AuthForm
        inputFields={signupFields}
        onSubmit={handleSignup}
        submitButtonText='Sign Up'
        type='signup'
        source='partner'
      />
    </Auth>
  );
}
