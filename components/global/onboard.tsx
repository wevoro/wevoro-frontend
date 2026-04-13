'use client';
import React, { useEffect } from 'react';
import Logo from './logo';
import Steps from './steps';
import { useSearchParams } from 'next/navigation';
import AutoFillModal from './dashboard/autofill-modal';
import { useUIContext } from '@/lib/contexts';

const Onboard = ({ source }: { source: 'partner' | 'pro' }) => {
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const autofill = searchParams.get('autofill') === 'true';
  const { setOpenAutoFillModal, openAutoFillModal } = useUIContext();

  useEffect(() => {
    if (autofill) {
      setOpenAutoFillModal(true);
    }
  }, [autofill]);

  return (
    <>
      <aside className='px-6 2xl:px-10 py-10 2xl:py-20 bg-white flex flex-col gap-[52px] overflow-y-auto scrollbar-hide'>
        <Logo />
        <div className='flex flex-col gap-8'>
          <div className='flex flex-col gap-4'>
            <h2 className='text-2xl font-semibold'>
              {isEdit ? 'Edit your profile' : 'Onboarding Page'}
            </h2>
            {!isEdit && (
              <p className='text-base'>
                Welcome to healthcare! Let&apos;s get started with setting up
                your profile to make managing your employment documents easier.
              </p>
            )}
          </div>
          <Steps source={source} isEdit={isEdit} />
        </div>
      </aside>
      {source === 'pro' && (autofill || openAutoFillModal) && <AutoFillModal />}
    </>
  );
};

export default Onboard;
