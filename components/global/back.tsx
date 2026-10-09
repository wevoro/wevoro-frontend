'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuthContext } from '@/lib/contexts';

const Back: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { shouldStorePro } = useAuthContext();

  const handleBack = () => {
    if (shouldStorePro) {
      router.push('/agency/caregivers');
    } else {
      router.back();
    }
  };

  // Figma "9. Onboarding Page - Completed" has no Back.
  if (pathname?.endsWith('/onboard/completed')) return null;

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
