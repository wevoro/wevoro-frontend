import Documents from '@/components/global/dashboard/documents';
import PersonalInformation from '@/components/global/dashboard/personal-information';
import ProfessionalInformation from '@/components/global/dashboard/professional-information';
import Skills from '@/components/global/dashboard/skills';
import CredentialsPanel from '@/components/global/dashboard/credentials-panel';
import CredentialStatusSection from '@/components/global/dashboard/credential-status-section';
import GchexsSection from '@/components/global/dashboard/gchexs-section';

export default function Profile() {
  return (
    <>
      <div className='flex flex-col gap-8'>
        <PersonalInformation />
        {/* SCRUM-66: GCHEXS Background Check Self-Report Flag */}
        <GchexsSection isEditable={true} />
        <CredentialStatusSection />
        <ProfessionalInformation />
        <Skills />
        <Documents />
      </div>
      <CredentialsPanel />
    </>
  );
}
