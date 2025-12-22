'use client';

import * as z from 'zod';

import Auth from '@/components/auth/auth';
import AuthForm from '@/components/auth/auth-form';
import { useAuthContext } from '@/lib/contexts';

const signupFields = [
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
  // {
  //   name: 'phone',
  //   label: 'Phone Number',
  //   type: 'number',
  //   placeholder: 'Enter your phone number...',
  //   validation: z
  //     .string()
  //     .min(10, { message: 'Phone number must be at least 10 digits long' })
  //     .regex(/^\d+$/, { message: 'Enter a valid phone number' }),
  // },
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

export default function ProSignup({
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
      source='pro'
      type='signup'
      image='/pro.jpg'
      descriptionTitle={leftTitle}
      description={leftDescription}
      alreadyHaveAccount={alreadyHaveAccount}
    >
      <AuthForm
        inputFields={signupFields}
        onSubmit={handleSignup}
        submitButtonText='Sign up'
        type='signup'
        source='pro'
      />
    </Auth>
  );
}
