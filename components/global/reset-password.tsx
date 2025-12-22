'use client';

import * as z from 'zod';

import Auth from '@/components/auth/auth';
import AuthForm from '@/components/auth/auth-form';
import { useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts';

const loginFields = [
  {
    name: 'password',
    label: 'New Password',
    type: 'password',
    placeholder: 'Enter your password...',
    validation: z.string().min(1, { message: 'Password has to be filled.' }),
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

export default function ResetPassword({
  leftTitle,
  leftDescription,
  alreadyHaveAccount,
  source,
  image,
}: any) {
  // const { handleResetPassword } = useAppContext();
  const { handleResetPassword } = useAuthContext();
  const params = useSearchParams();
  const email = params.get('email');
  const handleSubmit = async (data: any) => {
    await handleResetPassword(data, email!, source);
  };

  return (
    <Auth
      title={'Create A New Password'}
      subtitle={'Recover your account'}
      source={source}
      type='reset-password'
      image={image}
      descriptionTitle={leftTitle}
      description={leftDescription}
      alreadyHaveAccount={alreadyHaveAccount}
    >
      <AuthForm
        inputFields={loginFields}
        onSubmit={handleSubmit}
        submitButtonText='Submit'
        type='reset-password'
        source={source}
      />
    </Auth>
  );
}
