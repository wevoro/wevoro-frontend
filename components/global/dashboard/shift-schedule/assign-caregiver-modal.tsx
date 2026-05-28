'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  MapPin,
  Shield,
  Sun,
  Users,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchingCaregiver {
  id: string;
  name: string;
  avatar: string;
  distance: string;
  responseTime: string;
  certifiedPercentage: number;
}

interface AssignCaregiverModalProps {
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

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_MATCHING_CAREGIVERS: MatchingCaregiver[] = [
  {
    id: '1',
    name: 'Jessica Williams',
    avatar: '',
    distance: '1.2mil away',
    responseTime: '2 hrs',
    certifiedPercentage: 100,
  },
  {
    id: '2',
    name: 'David Martinez',
    avatar: '',
    distance: '0.5mil away',
    responseTime: '1 hr',
    certifiedPercentage: 100,
  },
  {
    id: '3',
    name: 'Amanda Foster',
    avatar: '',
    distance: '1.8mil away',
    responseTime: '3 hrs',
    certifiedPercentage: 95,
  },
  {
    id: '4',
    name: 'Robert Kim',
    avatar: '',
    distance: '2.1mil away',
    responseTime: '4 hrs',
    certifiedPercentage: 100,
  },
  {
    id: '5',
    name: 'Linda Thompson',
    avatar: '',
    distance: '3.0mil away',
    responseTime: '2 hrs',
    certifiedPercentage: 90,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const AssignCaregiverModal = ({
  open,
  onOpenChange,
  submission,
}: AssignCaregiverModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const total = submission.rate * submission.hours;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[560px] p-0 gap-0 rounded-2xl overflow-hidden'>
        <DialogHeader className='px-6 pt-6 pb-4'>
          <DialogTitle className='text-lg font-semibold text-tertiary'>
            Assign a Caregiver
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className='max-h-[80vh]'>
          <div className='px-6 pb-6'>
            {/* Shift Summary (compact) */}
            <div className='border border-[#DFE2E0] rounded-xl p-3 mb-5'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-tertiary'>
                  <Calendar className='size-3.5 text-[#6C6C6C]' />
                  <span className='font-semibold text-xs'>
                    {submission.date}
                  </span>
                </div>
                <div className='text-right'>
                  <p className='text-tertiary font-bold text-sm'>
                    ${submission.rate}/hr
                  </p>
                  <p className='text-[#6C6C6C] text-[10px]'>
                    {submission.hours} hrs shift (Total ${total})
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3 mt-2 text-[#6C6C6C] text-xs'>
                <span className='flex items-center gap-1'>
                  <Sun className='size-3.5' />
                  {submission.shiftType}
                </span>
                <span className='flex items-center gap-1'>
                  <MapPin className='size-3.5' />
                  {submission.distance}
                </span>
              </div>

              <div className='grid grid-cols-3 gap-2 mt-3'>
                <div>
                  <p className='text-[#6C6C6C] text-[9px] uppercase tracking-wider font-medium mb-0.5'>
                    Time Range
                  </p>
                  <p className='text-tertiary text-[11px] font-medium'>
                    {submission.timeRange}
                  </p>
                </div>
                <div>
                  <p className='text-[#6C6C6C] text-[9px] uppercase tracking-wider font-medium mb-0.5'>
                    Location
                  </p>
                  <p className='text-tertiary text-[11px] font-medium'>
                    {submission.location}
                  </p>
                </div>
                <div>
                  <p className='text-[#6C6C6C] text-[9px] uppercase tracking-wider font-medium mb-0.5'>
                    Position
                  </p>
                  <p className='text-tertiary text-[11px] font-medium'>
                    {submission.position}
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className='relative mb-5'>
              <Users className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6C6C6C]' />
              <Input
                placeholder='Search by name, city, title'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 pr-4 h-10 rounded-full border-[#DFE2E0] bg-white text-sm'
              />
            </div>

            {/* Matching Caregivers header */}
            <p className='text-sm font-medium text-[#6C6C6C] italic mb-4'>
              Matching Caregivers
            </p>

            {/* Caregiver rows */}
            <div className='flex flex-col gap-3'>
              {MOCK_MATCHING_CAREGIVERS.map((caregiver) => (
                <div
                  key={caregiver.id}
                  className='flex items-center justify-between gap-3 border border-[#DFE2E0] rounded-xl p-3'
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    {/* Avatar */}
                    <div className='w-10 h-10 shrink-0 rounded-full bg-[#DFE2E0] flex items-center justify-center text-tertiary font-semibold text-sm'>
                      {caregiver.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className='min-w-0'>
                      <p className='text-tertiary font-semibold text-sm truncate'>
                        {caregiver.name}
                      </p>
                      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-1'>
                        <span className='flex items-center gap-1 text-[#6C6C6C] text-[11px]'>
                          <MapPin className='size-3' />
                          {caregiver.distance}
                        </span>
                        <span className='flex items-center gap-1 text-[#6C6C6C] text-[11px]'>
                          <Clock className='size-3' />
                          Response time: {caregiver.responseTime}
                        </span>
                        <span className='flex items-center gap-1 text-[#6C6C6C] text-[11px]'>
                          <Shield className='size-3' />
                          Certified {caregiver.certifiedPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assign button */}
                  <Button
                    variant='outline'
                    className='h-8 rounded-lg text-xs text-[#008000] border-[#008000] hover:bg-[#008000]/5 shrink-0 px-4'
                  >
                    Assign
                  </Button>
                </div>
              ))}
            </div>

            {/* Load more */}
            <div className='text-center mt-5'>
              <button className='text-[#008000] text-sm font-medium hover:underline'>
                Load more
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
