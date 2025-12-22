'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuthContext } from '@/lib/contexts';

const Back: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const router = useRouter();

  const { shouldStorePro } = useAuthContext();

  const handleBack = () => {
    if (shouldStorePro) {
      router.push('/partner/pros');
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className='flex items-center text-base hover:underline disabled:opacity-20'
      disabled={disabled}
    >
      <ChevronLeft className='mr-2 w-4 h-4' />
      Back
    </button>
  );
};

export default Back;
