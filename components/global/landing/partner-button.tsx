'use client';
import { Button } from '@/components/ui/button';
import { scrollToSection } from '@/lib/utils';
import React from 'react';

const PartnerButton = ({
  environmentType,
  buttonText,
}: {
  environmentType: string;
  buttonText: string;
}) => {
  return (
    <Button
      href={environmentType === 'waitlist' ? undefined : '/agency/signup'}
      onClick={() =>
        environmentType === 'waitlist' && scrollToSection('joinwaitlist')
      }
      className='px-9 h-14 rounded-[12px] w-fit text-base md:text-lg font-semibold mx-auto md:mx-0'
    >
      {buttonText}
    </Button>
  );
};

export default PartnerButton;
