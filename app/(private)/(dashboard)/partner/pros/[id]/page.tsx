import Documents from '@/components/global/dashboard/documents';
import PersonalInformation from '@/components/global/dashboard/personal-information';
import ProfessionalInformation from '@/components/global/dashboard/professional-information';
import Skills from '@/components/global/dashboard/skills';
import AgencyCredentialStatus from '@/components/global/dashboard/agency-credential-status';
import GchexsSection from '@/components/global/dashboard/gchexs-section';
import DownloadPackageButton from '@/components/global/dashboard/download-package-button';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUserById, getUser } from '@/app/actions';
import { redirect } from 'next/navigation';

const ProFromPartner = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const user = await getUserById(id);
  // SCRUM-99 (AC6): a Non-confirmed agency (arrived via a share link, business
  // email only, status still "pending") can view general credentials here but
  // must be offered the deferred 4-field form to get verified. Show a
  // "Complete your profile" prompt that opens /partner/complete.
  const currentUser = await getUser();
  const showCompletePrompt =
    currentUser?.role === 'partner' && currentUser?.status === 'pending';

  if (!user) {
    return redirect('/partner/pros');
  }

  const caregiverName = user?.personalInfo
    ? `${user.personalInfo.firstName || ''} ${user.personalInfo.lastName || ''}`.trim()
    : 'Caregiver';

  return (
    <div className='flex flex-col gap-8'>
      {/* SCRUM-99 (AC6): deferred-form prompt for a Non-confirmed agency. */}
      {showCompletePrompt && (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4'>
          <p className='text-sm text-gray-700'>
            You&apos;re viewing general credentials. <b>Complete your agency account</b> to
            get verified and unlock sensitive documents (TB test, background check).
          </p>
          <Link href='/partner/complete'>
            <Button className='rounded-xl whitespace-nowrap h-11 px-6'>
              Complete your profile
            </Button>
          </Link>
        </div>
      )}
      {/* SCRUM-63/82: section order mirrors the caregiver profile —
          Personal → Professional → Skills → GCHEXS → Credentials Status → Documents */}
      <PersonalInformation proUser={user} />
      <ProfessionalInformation proUser={user} />
      <Skills proUser={user} />
      {/* SCRUM-66: GCHEXS Flag (read-only for agencies) */}
      <GchexsSection isEditable={false} userData={user} />
      <AgencyCredentialStatus userId={user._id} />
      {/* SCRUM-67: Download Credential Package */}
      <div className='flex justify-end'>
        <DownloadPackageButton caregiverId={user._id} caregiverName={caregiverName} />
      </div>
      <Documents proUser={user} />
    </div>
  );
};

export default ProFromPartner;
