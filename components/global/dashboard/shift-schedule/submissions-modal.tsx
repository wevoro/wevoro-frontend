'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, MapPin, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubmissionCaregiverDoc {
  name: string;
}

interface SubmissionCaregiver {
  id: string;
  name: string;
  avatar: string;
  distance: string;
  bio: string;
  isOnline: boolean;
  documents: SubmissionCaregiverDoc[];
}

interface SubmissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    date: string;
    rate: number;
    hours: number;
    shiftType: string;
    distance: string;
    timeRange: string;
    location: string;
    position: string;
  };
}

// ─── Mock Caregiver Data ─────────────────────────────────────────────────────

const MOCK_CAREGIVERS: SubmissionCaregiver[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: '',
    distance: '1.2mil away',
    bio: 'Experienced CNA with 5+ years in homecare. Certified in CPR/BLS and specialized in elderly care. Available for day and evening shifts.',
    isOnline: true,
    documents: [
      { name: 'CPR/BLS Certification' },
      { name: 'TB Test Results' },
      { name: 'Driver License' },
      { name: 'Background Check' },
    ],
  },
  {
    id: '2',
    name: 'Michael Chen',
    avatar: '',
    distance: '2.4mil away',
    bio: 'Licensed RN with expertise in post-operative care. Strong background in patient education and wound management.',
    isOnline: true,
    documents: [
      { name: 'RN License' },
      { name: 'CPR/BLS Certification' },
      { name: 'COVID-19 Vaccination' },
    ],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    avatar: '',
    distance: '0.8mil away',
    bio: 'Compassionate caregiver with 3 years experience. Bilingual (English/Spanish). Specialized in memory care and daily living assistance.',
    isOnline: false,
    documents: [
      { name: 'CNA Certification' },
      { name: 'Background Check' },
      { name: 'TB Test Results' },
      { name: 'Physical Exam Report' },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const SubmissionsModal = ({
  open,
  onOpenChange,
  submission,
}: SubmissionsModalProps) => {
  const total = submission.rate * submission.hours;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[560px] p-0 gap-0 rounded-2xl overflow-hidden'>
        <DialogHeader className='px-6 pt-6 pb-4'>
          <DialogTitle className='text-lg font-semibold text-tertiary'>
            Submissions
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className='max-h-[80vh]'>
          <div className='px-6 pb-6'>
            {/* Shift Summary Card */}
            <div className='border border-[#DFE2E0] rounded-xl p-4 mb-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-tertiary'>
                  <Calendar className='size-4 text-[#6C6C6C]' />
                  <span className='font-semibold text-sm'>
                    {submission.date}
                  </span>
                </div>
                <div className='text-right'>
                  <p className='text-tertiary font-bold text-base'>
                    ${submission.rate}/hr
                  </p>
                  <p className='text-[#6C6C6C] text-xs'>
                    {submission.hours} hrs shift (Total ${total})
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-4 mt-3 text-[#6C6C6C] text-sm'>
                <span className='flex items-center gap-1.5'>
                  <Sun className='size-4' />
                  {submission.shiftType}
                </span>
                <span className='flex items-center gap-1.5'>
                  <MapPin className='size-4' />
                  {submission.distance}
                </span>
              </div>

              <div className='grid grid-cols-3 gap-3 mt-4'>
                <div>
                  <p className='text-[#6C6C6C] text-[10px] uppercase tracking-wider font-medium mb-0.5'>
                    Time Range
                  </p>
                  <p className='text-tertiary text-xs font-medium'>
                    {submission.timeRange}
                  </p>
                </div>
                <div>
                  <p className='text-[#6C6C6C] text-[10px] uppercase tracking-wider font-medium mb-0.5'>
                    Location
                  </p>
                  <p className='text-tertiary text-xs font-medium'>
                    {submission.location}
                  </p>
                </div>
                <div>
                  <p className='text-[#6C6C6C] text-[10px] uppercase tracking-wider font-medium mb-0.5'>
                    Position
                  </p>
                  <p className='text-tertiary text-xs font-medium'>
                    {submission.position}
                  </p>
                </div>
              </div>
            </div>

            {/* Submissions heading */}
            <h3 className='text-sm font-semibold text-tertiary mb-4'>
              Submissions
            </h3>

            {/* Caregiver Cards */}
            <div className='flex flex-col gap-4'>
              {MOCK_CAREGIVERS.map((caregiver) => (
                <div
                  key={caregiver.id}
                  className='border border-[#DFE2E0] rounded-xl p-4'
                >
                  {/* Avatar + Name */}
                  <div className='flex items-start gap-3'>
                    <div className='relative shrink-0'>
                      <div className='w-14 h-14 rounded-full bg-[#DFE2E0] flex items-center justify-center text-tertiary font-semibold text-xl'>
                        {caregiver.name.charAt(0)}
                      </div>
                      {caregiver.isOnline && (
                        <div className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#008000] rounded-full border-2 border-white' />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-tertiary font-semibold text-sm'>
                        {caregiver.name}
                      </p>
                      <p className='text-[#6C6C6C] text-xs flex items-center gap-1 mt-0.5'>
                        <MapPin className='size-3' />
                        {caregiver.distance}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className='text-[#6C6C6C] text-xs leading-relaxed mt-3'>
                    {caregiver.bio}
                  </p>

                  {/* Document tags */}
                  <div className='flex flex-wrap gap-2 mt-3'>
                    {caregiver.documents.map((doc, idx) => (
                      <span
                        key={idx}
                        className='text-[10px] text-[#6C6C6C] border border-[#DFE2E0] rounded-full px-2.5 py-1 font-medium'
                      >
                        {doc.name}
                      </span>
                    ))}
                  </div>

                  {/* View Documents button */}
                  <Button className='h-9 rounded-xl text-xs w-full mt-4'>
                    View Documents
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
