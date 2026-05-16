import Documents from '@/components/global/dashboard/documents';
import PersonalInformation from '@/components/global/dashboard/personal-information';
import ProfessionalInformation from '@/components/global/dashboard/professional-information';
import Skills from '@/components/global/dashboard/skills';
import CredentialsPanel from '@/components/global/dashboard/credentials-panel';

export default function Profile() {
  return (
    <div className='grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start'>
      <div className='flex flex-col gap-8'>
        <PersonalInformation />
        <ProfessionalInformation />
        <Skills />
        <Documents />
      </div>
      <CredentialsPanel />
    </div>
  );
}
