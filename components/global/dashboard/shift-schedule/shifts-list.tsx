'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import ShiftListCard, { type ShiftListItem } from './shift-list-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Mock Data ──────────────────────────────────────────────────────────
const MOCK_SHIFTS: ShiftListItem[] = [
  {
    id: '1',
    createdAt: 'Mar 10, 2026',
    date: 'Tuesday, Oct 31',
    status: 'UPCOMING',
    openStatus: 'CLOSED',
    type: 'Day Shift',
    distance: '1.2mil away',
    shiftDays: 'Sun,Tue,Fri',
    timeRange: '10:00AM - 04:00PM',
    location: '18 Lord St, Springfield, Illinois',
    position: 'CNA Homecare',
    rate: 40,
    hoursPerShift: 6,
    caregivers: [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Carol' },
    ],
    totalSlots: 5,
    filledSlots: 2,
    countdown: { days: 2, hours: 2, minutes: 55 },
  },
  {
    id: '2',
    createdAt: 'Mar 12, 2026',
    date: 'March 22 - March 28, 2026',
    status: 'ACTIVE',
    openStatus: 'OPEN',
    type: 'Day Shift',
    distance: '0.8mil away',
    shiftDays: 'MON, WED, FRI',
    timeRange: '8:00AM - 2:00PM',
    location: 'Brooklyn, NY',
    position: 'Certified Nursing Assistant',
    rate: 40,
    hoursPerShift: 6,
    caregivers: [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Carol' },
      { name: 'Dan' },
    ],
    totalSlots: 5,
    filledSlots: 4,
  },
  {
    id: '3',
    createdAt: 'Mar 14, 2026',
    date: 'March 22 - March 28, 2026',
    status: 'ACTIVE',
    openStatus: 'CLOSED',
    type: 'Day Shift',
    distance: '3.5mil away',
    shiftDays: 'MON - FRI',
    timeRange: '7:00AM - 3:00PM',
    location: 'Queens, NY',
    position: 'Registered Nurse',
    rate: 55,
    hoursPerShift: 8,
    caregivers: [
      { name: 'Grace' },
      { name: 'Hank' },
      { name: 'Ivy' },
      { name: 'Jack' },
      { name: 'Kim' },
    ],
    totalSlots: 5,
    filledSlots: 5,
  },
];

const COMPLETED_SHIFTS: ShiftListItem[] = [
  {
    id: '4',
    createdAt: 'Feb 20, 2026',
    date: 'March 1 - March 7, 2026',
    status: 'ACTIVE',
    openStatus: 'CLOSED',
    type: 'Day Shift',
    distance: '2.1mil away',
    shiftDays: 'MON - FRI',
    timeRange: '9:00AM - 5:00PM',
    location: 'Bronx, NY',
    position: 'Physical Therapist',
    rate: 60,
    hoursPerShift: 8,
    caregivers: [
      { name: 'Leo' },
      { name: 'Mia' },
      { name: 'Noah' },
    ],
    totalSlots: 3,
    filledSlots: 3,
  },
];

// ── Component ──────────────────────────────────────────────────────────
type TabKey = 'onboarded' | 'completed';

const ShiftsList = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('onboarded');

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'onboarded', label: 'Onboarded Shifts', count: MOCK_SHIFTS.length },
    {
      key: 'completed',
      label: 'Completed Shifts',
      count: COMPLETED_SHIFTS.length,
    },
  ];

  const displayedShifts =
    activeTab === 'onboarded' ? MOCK_SHIFTS : COMPLETED_SHIFTS;

  return (
    <div className='pt-2'>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5'>
        <h2 className='text-[20px] md:text-[22px] font-bold text-[#1C1C1C]'>
          Your Shifts List
        </h2>
        <Select defaultValue='this-week'>
          <SelectTrigger className='w-[140px] rounded-[8px] h-[36px] border-[#E0E0E0] text-[13px] text-[#666] shadow-none'>
            <SelectValue placeholder='This Week' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='this-week'>This Week</SelectItem>
            <SelectItem value='last-week'>Last Week</SelectItem>
            <SelectItem value='this-month'>This Month</SelectItem>
            <SelectItem value='all'>All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className='flex items-center gap-0 border-b border-[#F0F0F0] mb-5'>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-[6px] px-4 py-[10px] text-[13px] font-medium transition-colors relative',
              activeTab === tab.key
                ? 'text-[#008000]'
                : 'text-[#999] hover:text-[#666]',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'text-[10px] font-bold px-[6px] py-[2px] rounded-full',
                activeTab === tab.key
                  ? 'bg-[#008000]/10 text-[#008000]'
                  : 'bg-[#F0F0F0] text-[#999]',
              )}
            >
              {tab.count}
            </span>
            {activeTab === tab.key && (
              <div className='absolute bottom-0 left-0 right-0 h-[2px] bg-[#008000] rounded-full' />
            )}
          </button>
        ))}
      </div>

      {/* ── Shift Cards ────────────────────────────────────────── */}
      <div className='flex flex-col gap-4'>
        {displayedShifts.map((shift) => (
          <ShiftListCard
            key={shift.id}
            shift={shift}
            onViewSubmissions={() => {
              // TODO: Navigate to submissions
            }}
          />
        ))}
      </div>

      {/* ── See More ───────────────────────────────────────────── */}
      {displayedShifts.length > 0 && (
        <div className='flex justify-center mt-6'>
          <button className='text-[13px] font-semibold text-[#008000] hover:underline flex items-center gap-1'>
            See More
            <ChevronDown className='size-[14px]' />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShiftsList;
