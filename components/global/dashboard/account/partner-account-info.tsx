import { CircleHelp, Star } from 'lucide-react';
import React from 'react';
import { useUserContext } from '@/lib/contexts';
import { isCredentialingMode } from '@/lib/credentialing';

const PartnerAccountInfo = () => {
  const { user } = useUserContext();

  // SCRUM-88: the same scheduling-era counters as the agency profile header.
  // Hidden for the credentialing beta; restored when the flag goes off.
  if (isCredentialingMode()) return null;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
      <div className='flex flex-col gap-1'>
        <p className='text-muted-foreground text-sm md:text-base flex items-center gap-2'>
          Offers Sent{' '}
          <Star className='size-5 fill-[#FAB607] stroke-[#FAB607]' />
        </p>
        <p className='text-tertiary font-medium text-lg md:text-2xl'>
          {user?.offersSent}
        </p>
      </div>
      <div className='flex flex-col gap-1'>
        <p className='text-muted-foreground text-sm md:text-base flex items-center gap-2'>
          Jobs Conversion <CircleHelp className='size-5' />
        </p>
        <p className='text-tertiary font-medium text-lg md:text-2xl'>
          {user?.jobConversionPercentage}%
        </p>
      </div>
    </div>
  );
};

export default PartnerAccountInfo;
