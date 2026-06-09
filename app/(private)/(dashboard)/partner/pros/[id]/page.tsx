import Documents from '@/components/global/dashboard/documents';
import PersonalInformation from '@/components/global/dashboard/personal-information';
import ProfessionalInformation from '@/components/global/dashboard/professional-information';
import Skills from '@/components/global/dashboard/skills';
import AgencyCredentialStatus from '@/components/global/dashboard/agency-credential-status';
import GchexsSection from '@/components/global/dashboard/gchexs-section';
import DownloadPackageButton from '@/components/global/dashboard/download-package-button';
import React from 'react';
import { getUserById } from '@/app/actions';
import { redirect } from 'next/navigation';

const ProFromPartner = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const user = await getUserById(id);

  if (!user) {
    return redirect('/partner/pros');
  }

  const caregiverName = user?.personalInfo
    ? `${user.personalInfo.firstName || ''} ${user.personalInfo.lastName || ''}`.trim()
    : 'Caregiver';

  return (
    <div className='flex flex-col gap-8'>
      <PersonalInformation proUser={user} />
      {/* SCRUM-66: GCHEXS Flag (read-only for agencies) */}
      <GchexsSection isEditable={false} userData={user} />
      <AgencyCredentialStatus userId={user._id} />
      {/* SCRUM-67: Download Credential Package */}
      <div className='flex justify-end'>
        <DownloadPackageButton caregiverId={user._id} caregiverName={caregiverName} />
      </div>
      <ProfessionalInformation proUser={user} />
      <Skills proUser={user} />
      <Documents proUser={user} />
    </div>
  );
};

export default ProFromPartner;
