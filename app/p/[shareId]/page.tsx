import React from 'react';
import { getUserByShareId, getUser } from '@/app/actions';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, MapPin, User, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Caregiver Profile | Wevoro',
  description: 'View this verified caregiver profile on Wevoro',
};

const SharePreviewPage = async ({ params }: { params: { shareId: string } }) => {
  const { shareId } = params;
  const proUser = await getUserByShareId(shareId);
  const currentUser = await getUser();

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

  // If logged-in partner, redirect to full profile view
  if (currentUser?.role === 'partner') {
    return redirect(`/partner/pros/${proUser._id}?s=true`);
  }

  // If logged-in pro, redirect to the pro profile view
  if (currentUser?.role === 'pro') {
    return redirect(`/pro/${proUser._id}`);
  }

  // If admin, redirect to admin panel
  if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
    return redirect(`/admin/pros`);
  }

  const personalInfo = proUser.personalInfo;
  const firstName = personalInfo?.firstName || 'Caregiver';
  const lastInitial = personalInfo?.lastName || '';
  const displayName = `${firstName} ${lastInitial}`;
  const city = personalInfo?.address?.city;
  const state = personalInfo?.address?.state;
  const location = city && state ? `${city}, ${state}` : city || state || '';
  const avatarUrl = personalInfo?.image;
  const role = proUser.role === 'pro' ? 'CNA' : proUser.role;
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
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className='rounded-full object-cover border-4 border-white shadow-lg'
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

          {/* Credentials summary */}
          <div className='bg-gray-50 rounded-2xl p-4 mb-6'>
            <div className='flex items-center justify-center gap-2'>
              <ShieldCheck className='w-5 h-5 text-emerald-500' />
              <span className='text-sm font-semibold text-gray-700'>
                {verifiedCount} of {totalCount} credentials verified
              </span>
            </div>
            {/* Progress bar */}
            <div className='w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden'>
              <div
                className='h-full rounded-full transition-all duration-500'
                style={{
                  width: `${(verifiedCount / totalCount) * 100}%`,
                  background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                }}
              />
            </div>
          </div>

          {/* CTA buttons */}
          <div className='flex flex-col gap-3'>
            <Link href={`/partner/signup?shareId=${shareId}&proId=${proUser._id}&s=true`}>
              <Button
                className='w-full h-12 rounded-xl text-base font-semibold gap-2'
              >
                Sign up to view full profile
                <ArrowRight className='w-4 h-4' />
              </Button>
            </Link>
            <Link href={`/partner/login?shareId=${shareId}&proId=${proUser._id}&s=true`}>
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
            Sign up on Wevoro to view full credentials, documents, and connect directly with verified caregivers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharePreviewPage;
