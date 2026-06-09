'use client';

import React, { useMemo } from 'react';
import { useOffers } from '@/app/apiHooks/useOffers';
import { useUserContext } from '@/lib/contexts';
import MatchingShiftCard from './matching-shift-card';
import { Loader2 } from 'lucide-react';

/**
 * SCRUM-46: Matching Shifts section on caregiver Shift Schedule page.
 * Verification-gated: only Verified caregivers see matching shift cards.
 */
const MatchingShifts: React.FC = () => {
  const { user } = useUserContext();
  const { data: offers = [], isLoading } = useOffers();

  // Verification gate per SCRUM-51 taxonomy.
  // Verified = user.status === 'approved' (legacy term) per current backend.
  const isVerified = user?.status === 'approved';

  // Matching shifts = system-generated offers in 'pending' state (not yet applied).
  // Private offers also land in pending but are owned by the Offers tab — here we
  // surface only shifts marked as matching/public per SCRUM-46.
  const matchingShifts = useMemo(
    () =>
      offers?.filter(
        (offer: any) => offer.status === 'pending' && offer.shiftType !== 'private',
      ) ?? [],
    [offers],
  );

  return (
    <div className='bg-white md:rounded-2xl p-4 md:p-8'>
      <h2 className='text-xl md:text-2xl font-bold text-gray-900 mb-6'>
        Matching Shifts
      </h2>

      {!isVerified ? (
        <p className='text-sm md:text-base text-muted-foreground'>
          You need to be verified to receive matching shifts.
        </p>
      ) : isLoading ? (
        <div className='flex items-center justify-center py-10'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      ) : matchingShifts.length === 0 ? (
        <p className='text-sm md:text-base text-muted-foreground'>
          No matching shifts available right now. Check back soon.
        </p>
      ) : (
        <div className='flex flex-col gap-6'>
          {matchingShifts.map((shift: any) => (
            <MatchingShiftCard key={shift._id} shift={shift} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchingShifts;
