'use client';
import React from 'react';
import Title from '../title';
import EditBtn from './edit-btn';
import { cn } from '@/lib/utils';

import moment from 'moment';
import NoData from '../no-data';
import { useParams, usePathname } from 'next/navigation';
import SectionDescription from '../section-description';
import { useUserContext } from '@/lib/contexts';

const PersonalInformation = ({
  proUser,
  from: from,
}: {
  proUser?: any;
  from?: string;
}) => {
  const { user } = useUserContext();
  // console.log('🚀 ~ PersonalInformation ~ user:', user);
  const { id } = useParams();
  const pathname = usePathname();
  const isPublicProPage = pathname.includes('pro/') && id ? true : false;
  const isFromPartnerPage =
    pathname.includes('partner/pros') && id ? true : false;

  const userData = proUser ? proUser : user;
  const isPartnerApproved = user?.status === 'approved';

  const firstName = userData?.personalInfo?.firstName;
  const lastName = userData?.personalInfo?.lastName;
  const dateOfBirth = userData?.personalInfo?.dateOfBirth;
  const phone = userData?.personalInfo?.phone;
  const gender = userData?.personalInfo?.gender;
  const address = userData?.personalInfo?.address;
  // A section heading must never render on its own — hide the block when it
  // has no fields to show (sparse profiles used to leave a bare "ADDRESS").
  const hasAddress = !!(
    address?.street ||
    address?.city ||
    address?.state ||
    address?.zipCode ||
    address?.country
  );
  const hasContactDetails = !!(userData?.email || phone);
  const bio = userData?.personalInfo?.bio;

  const noData = !userData?.personalInfo;

  return (
    <div
      className={cn(
        'bg-white md:rounded-[16px]',
        from === 'admin' ? 'p-0' : 'px-4 p-6 md:p-8 ',
      )}
    >
      <div className='flex items-center justify-between border-b pb-4 mb-8'>
        <Title
          text='Personal information'
          className='mb-0 !text-lg md:!text-2xl'
        />
        {from !== 'admin' && (
          <EditBtn href={`/pro/edit/personal-information?edit=true`} />
        )}
      </div>
      {!noData ? (
        <div className='space-y-6'>
          <div className='border-b pb-6 flex flex-col gap-1.5 md:gap-2.5'>
            <SectionTitle text='Bio' />
            <SectionDescription
              text={bio || 'N/A'}
              from={from}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6'>
            {(firstName || lastName) && (
              <div className='flex flex-col gap-1.5 md:gap-2.5'>
                <SectionTitle text='Name' />
                <SectionDescription
                  text={`${firstName} ${lastName}`}
                  from={from}
                />
              </div>
            )}
            {dateOfBirth && (
              <div className='flex flex-col gap-1.5 md:gap-2.5'>
                <SectionTitle text='Date of Birth' />
                <SectionDescription
                  // SCRUM-96: dateOfBirth is a date-only value stored at UTC
                  // midnight, so it must be read back in UTC. moment()'s default
                  // local mode renders the previous day in UTC-negative zones.
                  text={moment.utc(dateOfBirth).format('MMM. D, YYYY')}
                  from={from}
                />
              </div>
            )}
            {gender && (
              <div className='flex flex-col gap-1.5 md:gap-2.5'>
                <SectionTitle text='Gender' />
                <SectionDescription text={gender} from={from} />
              </div>
            )}
          </div>
          {hasContactDetails &&
            ((!proUser && !id) || (isFromPartnerPage && isPartnerApproved)) && (
            <div
              className={cn(
                'border-b pb-6 flex flex-col gap-5',
                isPublicProPage && !user && 'blur-sm',
              )}
            >
              <SectionTitle
                text='Contact Details'
                className='uppercase text-[#9E9E9E]'
              />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {userData?.email && (
                  <div className='flex flex-col gap-1.5 md:gap-2.5'>
                    <SectionTitle text='Email address' />
                    <SectionDescription
                      text={
                        isPublicProPage && !user
                          ? '**********'
                          : userData?.email
                      }
                      from={from}
                    />
                  </div>
                )}
                {phone && (
                  <div className='flex flex-col gap-1.5 md:gap-2.5'>
                    <SectionTitle text='Phone Number' />
                    <SectionDescription
                      text={
                        isPublicProPage && !user ? '**********' : phone || 'N/A'
                      }
                      from={from}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {hasAddress && (
            <div
              className={cn(
                'flex flex-col gap-5',
                isPublicProPage && !user && 'blur-sm',
              )}
            >
              <SectionTitle text='Address' className='uppercase text-[#9E9E9E]' />
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {address?.street && (
                <div className='flex flex-col gap-1.5 md:gap-2.5'>
                  <SectionTitle text='Street' />
                  <SectionDescription
                    text={
                      isPublicProPage && !user ? '**********' : address?.street
                    }
                    from={from}
                  />
                </div>
              )}
              {address?.city && (
                <div className='flex flex-col gap-1.5 md:gap-2.5'>
                  <SectionTitle text='City' />
                  <SectionDescription
                    text={
                      isPublicProPage && !user ? '**********' : address?.city
                    }
                    from={from}
                  />
                </div>
              )}
              {address?.state && (
                <div className='flex flex-col gap-1.5 md:gap-2.5'>
                  <SectionTitle text='State/Province' />
                  <SectionDescription
                    text={
                      isPublicProPage && !user ? '**********' : address?.state
                    }
                    from={from}
                  />
                </div>
              )}
              {address?.zipCode && (
                <div className='flex flex-col gap-1.5 md:gap-2.5'>
                  <SectionTitle text='Postal/ZIP Code' />
                  <SectionDescription
                    text={
                      isPublicProPage && !user ? '**********' : address?.zipCode
                    }
                    from={from}
                  />
                </div>
              )}
              {address?.country && (
                <div className='flex flex-col gap-1.5 md:gap-2.5'>
                  <SectionTitle text='Country' />
                  <SectionDescription
                    text={
                      isPublicProPage && !user ? '**********' : address?.country
                    }
                    from={from}
                  />
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      ) : (
        <NoData />
      )}
    </div>
  );
};

export default PersonalInformation;

const SectionTitle = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        'text-sm md:text-base font-medium text-muted-foreground',
        className,
      )}
    >
      {text}
    </h3>
  );
};
