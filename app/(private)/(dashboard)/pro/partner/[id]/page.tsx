import PersonalInformation from '@/components/global/dashboard/personal-information';
import React from 'react';
import { getUserById } from '@/app/actions';
import { redirect } from 'next/navigation';

const PartnerFromPro = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const user = await getUserById(id);
  console.log('useruseruseruser', user);

  if (!user) {
    return redirect('/pro/offers');
  }
  return (
    <div className='flex flex-col gap-8'>
      <PersonalInformation proUser={user} />
    </div>
  );
};

export default PartnerFromPro;
