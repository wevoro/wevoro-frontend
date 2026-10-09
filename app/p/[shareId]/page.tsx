import React from 'react';
import { getUserByShareId, getUser, recordShareVisit } from '@/app/actions';
import { redirect } from 'next/navigation';
import { isSharingEnabled } from '@/lib/credentialing';
import { Button } from '@/components/ui/button';
import { MapPin, User, ArrowRight, Clock } from 'lucide-react';
import SharePreviewCredentials from '@/components/global/dashboard/share-preview-credentials';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Caregiver Profile | Wevoro',
  description: 'View this verified caregiver profile on Wevoro',
};

const SharePreviewPage = async ({ params }: { params: { shareId: string } }) => {
  const { shareId } = params;

  // Staged rollout: while sharing is disabled the public preview is offline.
  if (!isSharingEnabled()) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md px-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Profile sharing is coming soon
          </h1>
          <p className='text-gray-500'>
            Caregiver profile sharing is not open yet. Please check back soon.
          </p>
        </div>
      </div>
    );
  }

  const proUser = await getUserByShareId(shareId);

  if (!proUser) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Profile Not Found</h1>
          <p className='text-gray-500'>This profile link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  // SCRUM-133: the link opens only once all 5 required credentials are
  // verified. The server already withholds the profile ({ shareable: false });
  // the count is checked here too so a partial profile can never render, even
  // against an older API. Everyone gets this screen — a signed-in agency is not
  // sent on to the profile, and no visit is recorded, because nothing was
  // shared yet. No name, photo or sign-up buttons: there is nothing to act on.
  const summary = proUser.credentialsSummary;
  const isShareable =
    proUser.shareable !== false &&
    !!summary &&
    summary.total > 0 &&
    summary.verified >= summary.total;
  if (!isShareable) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <div className='flex items-center justify-center mb-8'>
            <div className='relative w-10 h-10 mr-2'>
              <Image src='/wevoro.png' alt='Wevoro' fill className='object-contain' />
            </div>
            <span className='text-xl font-bold text-gray-900'>Wevoro</span>
          </div>
          <div
            data-testid='share-not-ready'
            className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center'
          >
            <div className='mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#F9F9FA]'>
              <Clock className='size-6 text-[#6C6C6C]' />
            </div>
            <h1 className='text-xl font-bold text-[#1C1C1C] mb-2'>
              This profile isn&rsquo;t ready to share yet
            </h1>
            <p className='text-sm leading-relaxed text-[#6C6C6C]'>
              This caregiver is still completing their credential verification with WeVoro.
              Their profile opens here once every required credential is verified, so please
              check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = await getUser();

  // If logged-in partner, redirect to full profile view
  if (currentUser?.role === 'partner') {
    // SCRUM-122: a signed-in agency opening the link has come in through this
    // caregiver just as much as one signing up with it, so the caregiver must
    // appear in their Offers › Submitted tab. Best-effort; the redirect happens
    // either way.
    await recordShareVisit(shareId);
    return redirect(`/agency/caregivers/${proUser._id}?s=true`);
  }

  // If logged-in pro, redirect to the pro profile view
  if (currentUser?.role === 'pro') {
    return redirect(`/caregiver/${proUser._id}`);
  }

  // If admin, redirect to admin panel
  if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
    return redirect(`/admin/caregivers`);
  }

  const personalInfo = proUser.personalInfo;
  const firstName = personalInfo?.firstName || 'Caregiver';
  const lastInitial = personalInfo?.lastName || '';
  const displayName = `${firstName} ${lastInitial}`;
  const city = personalInfo?.address?.city;
  const state = personalInfo?.address?.state;
  const location = city && state ? `${city}, ${state}` : city || state || '';
  const avatarUrl = personalInfo?.image;
  const role = proUser.professionalInfo?.role || (proUser.role === 'pro' ? 'CNA' : proUser.role);
  const verifiedCount = proUser.credentialsSummary?.verified || 0;
  const totalCount = proUser.credentialsSummary?.total || 5;

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Wevoro branding */}
        <div className='flex items-center justify-center mb-8'>
          <div className='relative w-10 h-10 mr-2'>
            <Image src='/wevoro.png' alt='Wevoro' fill className='object-contain' />
          </div>
          <span className='text-xl font-bold text-gray-900'>Wevoro</span>
        </div>

        {/* Profile card */}
        <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center'>
          {/* Avatar */}
          <div className='relative w-24 h-24 mx-auto mb-4'>
            {avatarUrl && avatarUrl !== 'https://i.imgur.com/HeIi0wU.png' ? (
              // Plain <img> (not next/image): avatar URLs come from arbitrary hosts
              // and unconfigured hostnames crash next/image during SSR.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className='w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg'
              />
            ) : (
              <div className='w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-white shadow-lg'>
                <User className='w-10 h-10 text-primary/60' />
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className='text-2xl font-bold text-gray-900 mb-1'>{displayName}</h1>

          {/* Role badge */}
          <div className='flex items-center justify-center gap-2 mb-2'>
            <span className='inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold'>
              {role?.toUpperCase()}
            </span>
          </div>

          {/* Location */}
          {location && (
            <div className='flex items-center justify-center gap-1.5 text-gray-500 mb-6'>
              <MapPin className='w-4 h-4' />
              <span className='text-sm'>{location}</span>
            </div>
          )}

          {/* Credentials summary — SCRUM-133: only a fully verified profile
              reaches this point, so it always reads "All 5 credentials
              verified"; no partial count or bar. */}
          <div className='mb-6'>
            <SharePreviewCredentials
              verified={verifiedCount}
              total={totalCount}
              items={proUser.credentialsSummary?.items}
            />
          </div>

          {/* CTA buttons */}
          {/* SCRUM-99: both options are passwordless per Faisal's design — a new
              agency uses "Continue with company email", a returning one uses
              "Already have an account? Sign in". Both go to the email + code flow
              (create-or-sign-in); no password path from the share preview. */}
          <div className='flex flex-col gap-3'>
            <Link href={`/agency/access?shareId=${shareId}&proId=${proUser._id}&s=true`}>
              <Button
                className='w-full h-12 rounded-xl text-base font-semibold gap-2'
              >
                Continue with company email
                <ArrowRight className='w-4 h-4' />
              </Button>
            </Link>
            <Link href={`/agency/access?shareId=${shareId}&proId=${proUser._id}&s=true&mode=signin`}>
              <Button
                variant='outline'
                className='w-full h-12 rounded-xl text-base font-semibold'
              >
                Already have an account? Sign in
              </Button>
            </Link>
          </div>

          {/* Footer text */}
          <p className='text-xs text-gray-400 mt-4 leading-relaxed'>
            Use your company email now — no password needed. Complete your agency account only when you need full access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharePreviewPage;
