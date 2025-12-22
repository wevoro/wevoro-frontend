'use client';

import * as z from 'zod';

import Auth from '@/components/auth/auth';
import AuthForm from '@/components/auth/auth-form';
import { useAppContext } from '@/lib/context';

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

export default function AdminLogin({}: any) {
  const { handleLogin } = useAppContext();

  return (
    <Auth
      title={'Admin Login'}
      subtitle={'Login to your admin account'}
      source='admin'
      type='login'
      image='/pro.jpg'
      descriptionTitle={'Admin Login'}
      description={'Login to your admin account'}
    >
      <AuthForm
        inputFields={loginFields}
        onSubmit={handleLogin}
        submitButtonText='Login'
        type='login'
        source='admin'
      />
    </Auth>
  );
}
