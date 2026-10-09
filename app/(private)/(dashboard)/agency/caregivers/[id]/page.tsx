import Documents from '@/components/global/dashboard/documents';
import PersonalInformation from '@/components/global/dashboard/personal-information';
import ProfessionalInformation from '@/components/global/dashboard/professional-information';
import Skills from '@/components/global/dashboard/skills';
import AgencyCredentialStatus from '@/components/global/dashboard/agency-credential-status';
import GchexsSection from '@/components/global/dashboard/gchexs-section';
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
  // "Complete your profile" prompt that opens /agency/complete.
  const currentUser = await getUser();
  const showCompletePrompt =
    currentUser?.role === 'partner' && currentUser?.status === 'pending';

  if (!user) {
    return redirect('/agency/caregivers');
  }

  // SCRUM-180: the modal titles itself "Message <name>"; fall back to the
  // neutral "Send a message" when the caregiver has no personal info yet.
  const caregiverName = [
    user?.personalInfo?.firstName,
    user?.personalInfo?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className='flex flex-col gap-8'>
      {/*
        SCRUM-180 put a Message button here, so an agency looking at a caregiver
        had some way to reach them: at the time a declined request was a dead
        end, and Message was the only thing left on the page.
        Riad, 30 Sep: an agency may now send an onboarding request as often as
        it likes, a decline included, so the onboarding bar always carries an
        action and this second button is clutter. Message stays on the
        Onboarding list (agency-offers-view), which is where an agency writes to
        a caregiver it has not onboarded.
      */}
      {/* SCRUM-99 (AC6): deferred-form prompt for a Non-confirmed agency. */}
      {showCompletePrompt && (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4'>
          <p className='text-sm text-gray-700'>
            You&apos;re viewing general credentials. <b>Complete your agency account</b> to
            get verified and unlock sensitive documents (TB test, background check).
          </p>
          {/* SCRUM-179: carry the caregiver through the form so finishing it
              returns here instead of the generic /agency/profile. */}
          <Link href={`/agency/complete?proId=${id}`}>
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
      <AgencyCredentialStatus
        userId={user._id}
        caregiverRole={user?.professionalInfo?.role}
      />
      {/* SCRUM-141: the purple Download Credentials button is gone. Download
          is reached through Onboard → caregiver responds → pay, from the
          pinned action in the Back row (OnboardActionBar). */}
      <Documents proUser={user} />
    </div>
  );
};

export default ProFromPartner;
