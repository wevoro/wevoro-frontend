'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Navigation, Users, ArrowUpRight } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface CaregiverData {
  id: string;
  name: string;
  avatar: string;
  distance: string;
  bio: string;
  tags: string[];
  moreTagsCount: number;
  isOnline: boolean;
}

// ── Mock Data ──────────────────────────────────────────────────────────
const MOCK_CAREGIVERS: CaregiverData[] = [
  {
    id: '1',
    name: 'Leslie Alexander',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    distance: '1.2mil away',
    bio: 'Floyd Miles is a magna cum laude Biomedical Engineering graduate from Gotham University. With experience as a Registered Nurse and a current role as a Health Educator, he brings expertise in patient care and health education. Certified in Patient Service Fundamentals by Johns Hopkins, he is based in Springfield, Illinois.',
    tags: ['PPE', 'VACCINE'],
    moreTagsCount: 12,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Leslie Alexander',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    distance: '1.2mil away',
    bio: 'Floyd Miles is a magna cum laude Biomedical Engineering graduate from Gotham University. With experience as a Registered Nurse and a current role as a Health Educator, he brings expertise in patient care and health education. Certified in Patient Service Fundamentals by Johns Hopkins, he is based in Springfield, Illinois.',
    tags: ['PPE', 'VACCINE'],
    moreTagsCount: 12,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Losi Diamond',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    distance: '1.2mil away',
    bio: 'Floyd Miles is a magna cum laude Biomedical Engineering graduate from Gotham University. With experience as a Registered Nurse and a current role as a Health Educator, he brings expertise in patient care and health education. Certified in Patient Service Fundamentals by Johns Hopkins, he is based in Springfield, Illinois.',
    tags: ['PPE', 'VACCINE'],
    moreTagsCount: 12,
    isOnline: true,
  },
];

// ── Component ──────────────────────────────────────────────────────────
const AvailableCaregivers = () => {
  return (
    <div className='pt-2'>
      {/* Header */}
      <h2 className='text-[20px] md:text-[22px] font-bold text-[#1C1C1C] mb-5'>
        Available Caregivers
      </h2>

      {/* Caregiver Cards */}
      <div className='flex flex-col gap-4'>
        {MOCK_CAREGIVERS.map((caregiver) => (
          <CaregiverCard key={caregiver.id} caregiver={caregiver} />
        ))}
      </div>

      {/* Load more */}
      <div className='flex justify-center mt-6'>
        <button className='text-[14px] font-semibold text-[#008000] hover:underline'>
          Load more
        </button>
      </div>
    </div>
  );
};

// ── Caregiver Card ─────────────────────────────────────────────────────
function CaregiverCard({ caregiver }: { caregiver: CaregiverData }) {
  return (
    <div className='border border-[#E8E8E8] rounded-[12px] bg-white p-5 md:p-6'>
      {/* Top row: Avatar + Name + Buttons */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          {/* Avatar with online dot */}
          <div className='relative shrink-0'>
            <div className='w-[48px] h-[48px] rounded-full overflow-hidden'>
              <Image
                src={caregiver.avatar}
                alt={caregiver.name}
                width={48}
                height={48}
                className='w-full h-full object-cover'
              />
            </div>
            {caregiver.isOnline && (
              <div className='absolute bottom-[1px] left-[1px] w-[10px] h-[10px] rounded-full bg-[#008000] border-[1.5px] border-white' />
            )}
          </div>

          {/* Name + distance */}
          <div className='flex flex-col gap-[2px]'>
            <h3 className='text-[15px] font-semibold text-[#1C1C1C]'>
              {caregiver.name}
            </h3>
            <div className='flex items-center gap-[4px] text-[12px] text-[#999]'>
              <Navigation className='size-[11px]' />
              <span>{caregiver.distance}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className='flex items-center gap-[8px] shrink-0'>
          <Button
            variant='outline'
            className='h-[36px] rounded-[8px] px-[14px] text-[12px] font-semibold gap-[6px] border-[#008000] text-[#008000] hover:bg-[#008000]/5 shadow-none'
          >
            <Users className='size-[14px]' />
            Assign
          </Button>
          <Button
            variant='outline'
            className='h-[36px] rounded-[8px] px-[14px] text-[12px] font-semibold gap-[6px] border-[#E0E0E0] text-[#1C1C1C] hover:bg-[#F5F5F5] shadow-none'
          >
            View Profile
            <ArrowUpRight className='size-[14px]' />
          </Button>
        </div>
      </div>

      {/* Bio */}
      <p className='text-[13px] text-[#666] leading-[1.6] mt-4'>
        {caregiver.bio}
      </p>

      {/* Tags */}
      <div className='flex items-center gap-[8px] mt-4'>
        {caregiver.tags.map((tag) => (
          <span
            key={tag}
            className='text-[11px] font-medium text-[#1C1C1C] border border-[#E0E0E0] rounded-[4px] px-[8px] py-[3px] uppercase tracking-[0.04em]'
          >
            {tag}
          </span>
        ))}
        {caregiver.moreTagsCount > 0 && (
          <span className='text-[11px] font-medium text-[#666]'>
            +{caregiver.moreTagsCount} more
          </span>
        )}
      </div>
    </div>
  );
}

export default AvailableCaregivers;
