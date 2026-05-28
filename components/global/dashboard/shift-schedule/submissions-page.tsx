'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Check,
  ChevronDown,
  FileText,
  Globe,
  MapPin,
  MoreHorizontal,
  MoveUpRight,
  RefreshCw,
  Search,
  Sun,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SubmissionsModal } from './submissions-modal';
import { AssignCaregiverModal } from './assign-caregiver-modal';

// ─── Types ───────────────────────────────────────────────────────────────────

type SubmissionStatus = 'PENDING' | 'DECLINED' | 'ACTIVE' | 'UPCOMING';
type ShiftStatus = 'OPEN' | 'CLOSED';

interface RequestedFile {
  name: string;
  uploaded: boolean;
}

interface Caregiver {
  name: string;
  avatar: string;
  distance: string;
}

interface Submission {
  id: string;
  createdAt: string;
  isUrgent: boolean;
  shiftStatus: ShiftStatus;
  submissionStatus: SubmissionStatus;
  date: string;
  rate: number;
  hours: number;
  shiftType: string;
  distance: string;
  shiftDays: string[];
  timeRange: string;
  location: string;
  position: string;
  slotsAvailable: number;
  requestedFiles: RequestedFile[];
  additionalNotes: boolean;
  caregiver?: Caregiver;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: '1',
    createdAt: '05 Aug, 2024 - 11:15AM',
    isUrgent: true,
    shiftStatus: 'OPEN',
    submissionStatus: 'PENDING',
    date: 'Tuesday, Oct 31',
    rate: 40,
    hours: 6,
    shiftType: 'Day Shift',
    distance: '1.2mil away',
    shiftDays: ['Sun', 'Tue', 'Fri'],
    timeRange: '10:00AM - 04:00PM',
    location: '18 Lord St, Springfield, Illinois',
    position: 'CNA Homecare',
    slotsAvailable: 5,
    requestedFiles: [
      { name: 'CPR/BLS Certification', uploaded: true },
      { name: 'TB Test Results', uploaded: true },
      { name: 'Driver License', uploaded: true },
      { name: 'Background Check', uploaded: true },
      { name: 'Physical Exam Report', uploaded: true },
      { name: 'COVID-19 Vaccination', uploaded: true },
    ],
    additionalNotes: true,
  },
  {
    id: '2',
    createdAt: '03 Aug, 2024 - 09:30AM',
    isUrgent: false,
    shiftStatus: 'OPEN',
    submissionStatus: 'DECLINED',
    date: 'Sunday, Oct 29',
    rate: 40,
    hours: 6,
    shiftType: 'Day Shift',
    distance: '1.2mil away',
    shiftDays: ['Mon', 'Wed', 'Thu'],
    timeRange: '08:00AM - 02:00PM',
    location: '24 Maple Ave, Chicago, Illinois',
    position: 'RN Homecare',
    slotsAvailable: 3,
    requestedFiles: [
      { name: 'CPR/BLS Certification', uploaded: true },
      { name: 'TB Test Results', uploaded: true },
      { name: 'Driver License', uploaded: false },
      { name: 'Background Check', uploaded: true },
    ],
    additionalNotes: false,
    caregiver: {
      name: 'Sarah Johnson',
      avatar: '/placeholder-avatar.png',
      distance: '1.2mil away',
    },
  },
  {
    id: '3',
    createdAt: '01 Aug, 2024 - 02:45PM',
    isUrgent: true,
    shiftStatus: 'CLOSED',
    submissionStatus: 'PENDING',
    date: 'Thursday, Nov 02',
    rate: 45,
    hours: 8,
    shiftType: 'Day Shift',
    distance: '2.5mil away',
    shiftDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    timeRange: '07:00AM - 03:00PM',
    location: '55 Oak Blvd, Peoria, Illinois',
    position: 'LPN Homecare',
    slotsAvailable: 5,
    requestedFiles: [
      { name: 'CPR/BLS Certification', uploaded: true },
      { name: 'TB Test Results', uploaded: true },
      { name: 'Driver License', uploaded: true },
      { name: 'Background Check', uploaded: true },
      { name: 'Physical Exam Report', uploaded: true },
      { name: 'COVID-19 Vaccination', uploaded: true },
    ],
    additionalNotes: true,
  },
];

// ─── Badge Components ────────────────────────────────────────────────────────

const UrgentBadge = () => (
  <span className='bg-red-500 text-white text-xs px-2 py-0.5 rounded-md font-medium'>
    URGENT
  </span>
);

const ShiftStatusBadge = ({ status }: { status: ShiftStatus }) => {
  const styles: Record<ShiftStatus, string> = {
    OPEN: 'bg-[#008000] text-white',
    CLOSED: 'bg-[#1C1C1C] text-white',
  };
  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded-md font-medium',
        styles[status],
      )}
    >
      {status}
    </span>
  );
};

const SubmissionStatusBadge = ({ status }: { status: SubmissionStatus }) => {
  const config: Record<
    SubmissionStatus,
    { bg: string; icon: React.ReactNode }
  > = {
    PENDING: {
      bg: 'bg-[#FFA500]',
      icon: <RefreshCw className='size-3' />,
    },
    DECLINED: {
      bg: 'bg-red-500',
      icon: <X className='size-3' />,
    },
    ACTIVE: {
      bg: 'bg-[#008000]',
      icon: <Check className='size-3' />,
    },
    UPCOMING: {
      bg: 'bg-[#FFA500]',
      icon: <RefreshCw className='size-3' />,
    },
  };

  const { bg, icon } = config[status];

  return (
    <span
      className={cn(
        'text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1',
        bg,
      )}
    >
      {icon}
      {status}
    </span>
  );
};

// ─── Submission Card ─────────────────────────────────────────────────────────

const SubmissionCard = ({ submission }: { submission: Submission }) => {
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const total = submission.rate * submission.hours;
  const allFilesUploaded = submission.requestedFiles.every((f) => f.uploaded);

  return (
    <>
      <div className='bg-white border border-[#DFE2E0] rounded-xl p-5 md:p-6'>
        {/* Top row: created date + menu */}
        <div className='flex justify-between items-start'>
          <p className='text-[#6C6C6C] text-xs'>
            Created on {submission.createdAt}
          </p>
          <button className='text-[#6C6C6C] hover:text-tertiary transition-colors p-1'>
            <MoreHorizontal className='size-5' />
          </button>
        </div>

        {/* Status badges */}
        <div className='flex items-center gap-2 mt-3'>
          {submission.isUrgent && <UrgentBadge />}
          <ShiftStatusBadge status={submission.shiftStatus} />
        </div>

        {/* Date + Status + Rate */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2 text-tertiary'>
              <Calendar className='size-4 text-[#6C6C6C]' />
              <span className='font-semibold text-sm md:text-base'>
                {submission.date}
              </span>
            </div>
            <SubmissionStatusBadge status={submission.submissionStatus} />
          </div>
          <div className='text-right sm:text-right'>
            <p className='text-tertiary font-bold text-lg md:text-xl'>
              ${submission.rate}/hr
            </p>
            <p className='text-[#6C6C6C] text-xs'>
              {submission.hours} hrs shift (Total ${total})
            </p>
          </div>
        </div>

        {/* Shift type + distance */}
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

        {/* Details grid */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-5'>
          <div>
            <p className='text-[#6C6C6C] text-[10px] uppercase tracking-wider font-medium mb-1'>
              Shift Days
            </p>
            <p className='text-tertiary text-sm font-medium'>
              {submission.shiftDays.join(', ')}
            </p>
          </div>
          <div>
            <p className='text-[#6C6C6C] text-[10px] uppercase tracking-wider font-medium mb-1'>
              Time Range
            </p>
            <p className='text-tertiary text-sm font-medium'>
              {submission.timeRange}
            </p>
          </div>
          <div>
            <p className='text-[#6C6C6C] text-[10px] uppercase tracking-wider font-medium mb-1'>
              Location
            </p>
            <p className='text-tertiary text-sm font-medium'>
              {submission.location}
            </p>
          </div>
          <div>
            <p className='text-[#6C6C6C] text-[10px] uppercase tracking-wider font-medium mb-1'>
              Position
            </p>
            <p className='text-tertiary text-sm font-medium'>
              {submission.position}
            </p>
          </div>
        </div>

        {/* Slots */}
        <p className='text-[#008000] text-sm font-medium mt-4'>
          {submission.slotsAvailable} Slots available
        </p>

        {/* Caregiver info (for declined variant) */}
        {submission.caregiver && (
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 p-4 bg-[#F9F9FA] rounded-xl'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <div className='w-12 h-12 rounded-full bg-[#DFE2E0] flex items-center justify-center text-tertiary font-semibold text-lg'>
                  {submission.caregiver.name.charAt(0)}
                </div>
              </div>
              <div>
                <p className='text-tertiary font-semibold text-sm'>
                  {submission.caregiver.name}
                </p>
                <p className='text-[#6C6C6C] text-xs flex items-center gap-1'>
                  <MapPin className='size-3' />
                  {submission.caregiver.distance}
                </p>
              </div>
            </div>
            <Button
              variant='outline'
              className='h-9 rounded-xl text-xs w-fit'
            >
              View Profile
              <MoveUpRight className='size-3.5 ml-1.5' />
            </Button>
          </div>
        )}

        {/* Requested Files */}
        <div className='mt-4 border border-[#DFE2E0] rounded-xl p-4'>
          <p
            className={cn(
              'text-sm font-semibold mb-3',
              allFilesUploaded ? 'text-[#008000]' : 'text-red-500',
            )}
          >
            Requested Files
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            {submission.requestedFiles.map((file, idx) => (
              <div
                key={idx}
                className='flex items-center gap-2 text-sm text-tertiary'
              >
                <Check
                  className={cn(
                    'size-4 shrink-0',
                    file.uploaded ? 'text-[#008000]' : 'text-[#DFE2E0]',
                  )}
                />
                {file.name}
              </div>
            ))}
          </div>
        </div>

        {/* Additional notes */}
        {submission.additionalNotes && (
          <div className='flex items-center gap-2 mt-4 text-sm'>
            <FileText className='size-4 text-[#6C6C6C]' />
            <span className='text-tertiary'>Additional notes</span>
            <button className='text-[#008000] font-medium hover:underline'>
              View Notes
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5'>
          {submission.submissionStatus === 'DECLINED' &&
          submission.caregiver ? (
            <>
              <Button
                variant='outline'
                className='h-10 md:h-11 rounded-xl text-sm border-[#DFE2E0]'
              >
                <Globe className='size-4 mr-2' />
                Convert to Public
              </Button>
              <Button
                className='h-10 md:h-11 rounded-xl text-sm'
                onClick={() => setAssignModalOpen(true)}
              >
                <Users className='size-4 mr-2' />
                Assign another
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                className='h-10 md:h-11 rounded-xl text-sm border-[#DFE2E0]'
              >
                <RefreshCw className='size-4 mr-2' />
                Update Requirements
              </Button>
              <Button
                className='h-10 md:h-11 rounded-xl text-sm'
                onClick={() => setSubmissionsModalOpen(true)}
              >
                View Submissions
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <SubmissionsModal
        open={submissionsModalOpen}
        onOpenChange={setSubmissionsModalOpen}
        submission={submission}
      />
      <AssignCaregiverModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        submission={submission}
      />
    </>
  );
};

// ─── Submissions Page ────────────────────────────────────────────────────────

const SubmissionsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <h1 className='text-xl md:text-2xl font-semibold text-tertiary'>
            Submissions
          </h1>
          <span className='bg-[#008000] text-white text-xs font-semibold px-2.5 py-1 rounded-full min-w-[24px] text-center'>
            {MOCK_SUBMISSIONS.length}
          </span>
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
          {/* Search */}
          <div className='relative'>
            <Users className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6C6C6C]' />
            <Input
              placeholder='Search by name, city, title'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 pr-4 h-10 rounded-full border-[#DFE2E0] bg-white text-sm w-full sm:w-[280px]'
            />
          </div>

          {/* All Status filter */}
          <Button
            variant='outline'
            className='h-10 rounded-full border-[#DFE2E0] text-sm text-[#6C6C6C] px-4'
          >
            All Status
            <ChevronDown className='size-4 ml-2' />
          </Button>

          {/* This Week filter */}
          <Button
            variant='outline'
            className='h-10 rounded-full border-[#DFE2E0] text-sm text-[#6C6C6C] px-4'
          >
            This Week
            <ChevronDown className='size-4 ml-2' />
          </Button>
        </div>
      </div>

      {/* Submission Cards */}
      <div className='flex flex-col gap-4'>
        {MOCK_SUBMISSIONS.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}
      </div>
    </div>
  );
};

export default SubmissionsPage;
