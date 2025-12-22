import Documents from '@/components/global/dashboard/documents';
import PersonalInformation from '@/components/global/dashboard/personal-information';
import ProfessionalInformation from '@/components/global/dashboard/professional-information';
import Skills from '@/components/global/dashboard/skills';
import React from 'react';
import { getUserById } from '@/app/actions';
import { redirect } from 'next/navigation';

const ProFromPartner = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const user = await getUserById(id);
  console.log('useruseruseruser', user);

  if (!user) {
    return redirect('/partner/pros');
  }
  return (
    <div className='flex flex-col gap-8'>
      <PersonalInformation proUser={user} />
      <ProfessionalInformation proUser={user} />
      <Skills proUser={user} />
      <Documents proUser={user} />
    </div>
  );
};

export default ProFromPartner;
