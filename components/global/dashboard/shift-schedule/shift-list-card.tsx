'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Clock,
  Briefcase,
  Sun,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Types ──────────────────────────────────────────────────────────────
export interface ShiftListItem {
  id: string;
  createdAt: string;
  date: string;
  status: 'ACTIVE' | 'UPCOMING';
  openStatus: 'OPEN' | 'CLOSED';
  type: 'Day Shift' | 'Night Shift';
  distance: string;
  shiftDays: string;
  timeRange: string;
  location: string;
  position: string;
  rate: number;
  hoursPerShift: number;
  caregivers: { name: string; avatar?: string }[];
  totalSlots: number;
  filledSlots: number;
  countdown?: { days: number; hours: number; minutes: number };
}

interface ShiftListCardProps {
  shift: ShiftListItem;
  onViewSubmissions?: () => void;
}

// ── Avatars ────────────────────────────────────────────────────────────
const MOCK_AVATARS = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
];

// ── Component ──────────────────────────────────────────────────────────
const ShiftListCard: React.FC<ShiftListCardProps> = ({
  shift,
  onViewSubmissions,
}) => {
  const slotsRemaining = shift.totalSlots - shift.filledSlots;
  const totalPay = shift.rate * shift.hoursPerShift;

  return (
    <div className='border border-[#E8E8E8] rounded-[12px] bg-white'>
      {/* Main content row */}
      <div className='p-5 md:p-6'>
        {/* Top section: Date + Status + Countdown + Menu + Rate */}
        <div className='flex items-start justify-between gap-4'>
          {/* Left side: Date + Status + Shift info */}
          <div className='flex-1'>
            {/* Date line + badges */}
            <div className='flex items-center gap-3 flex-wrap'>
              <div className='flex items-center gap-[6px]'>
                <Calendar className='size-[16px] text-[#1C1C1C]' />
                <span className='text-[14px] font-bold text-[#1C1C1C]'>
                  {shift.date}
                </span>
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  'text-[10px] font-bold uppercase px-[8px] py-[3px] rounded-[4px] tracking-[0.04em]',
                  shift.status === 'ACTIVE'
                    ? 'bg-[#008000] text-white'
                    : 'bg-[#F5A623] text-white',
                )}
              >
                {shift.status}
              </span>

              {/* Open/Closed text */}
              <span className='text-[12px] font-medium text-[#666] uppercase'>
                {shift.openStatus}
              </span>
            </div>

            {/* Shift type */}
            <div className='flex items-center gap-[6px] mt-[8px]'>
              <Sun className='size-[14px] text-[#999]' />
              <span className='text-[12px] text-[#666] font-normal'>
                {shift.type}
              </span>
            </div>
          </div>

          {/* Right side: Countdown + Menu + Rate */}
          <div className='flex flex-col items-end gap-2'>
            {/* Countdown Timer (for UPCOMING) */}
            {shift.status === 'UPCOMING' && shift.countdown && (
              <div className='flex items-center gap-[6px]'>
                <CountdownUnit value={shift.countdown.days} label='days' />
                <CountdownUnit value={shift.countdown.hours} label='hrs' />
                <CountdownUnit value={shift.countdown.minutes} label='min' />
                <button className='w-[32px] h-[32px] flex items-center justify-center rounded-[6px] border border-[#E8E8E8] hover:bg-[#F5F5F5] transition-colors ml-1'>
                  <MoreHorizontal className='size-[16px] text-[#1C1C1C]' />
                </button>
              </div>
            )}

            {/* 3-dot menu for ACTIVE status */}
            {shift.status === 'ACTIVE' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className='w-[32px] h-[32px] flex items-center justify-center rounded-[6px] border border-[#E8E8E8] hover:bg-[#F5F5F5] transition-colors'>
                    <MoreHorizontal className='size-[16px] text-[#1C1C1C]' />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem>Edit Shift</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className='text-red-600'>
                    Cancel Shift
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Rate */}
            <div className='text-right'>
              <p className='text-[18px] font-bold text-[#1C1C1C]'>
                ${shift.rate}/hr
              </p>
              <p className='text-[11px] text-[#999] font-normal mt-[1px]'>
                {shift.hoursPerShift} hrs shift ( Total ${totalPay} )
              </p>
            </div>
          </div>
        </div>

        {/* Info Row: SHIFT DAYS | TIME RANGE | LOCATION | POSITION */}
        <div className='flex flex-wrap items-start gap-x-8 gap-y-3 mt-5'>
          <div className='flex flex-col gap-[4px]'>
            <div className='flex items-center gap-[5px]'>
              <Clock className='size-[12px] text-[#999]' />
              <span className='text-[10px] text-[#999] font-medium uppercase tracking-[0.06em]'>
                Shift Days
              </span>
            </div>
            <p className='text-[13px] text-[#1C1C1C] font-medium'>
              {shift.shiftDays}
            </p>
          </div>

          <div className='flex flex-col gap-[4px]'>
            <div className='flex items-center gap-[5px]'>
              <Clock className='size-[12px] text-[#999]' />
              <span className='text-[10px] text-[#999] font-medium uppercase tracking-[0.06em]'>
                Time Range
              </span>
            </div>
            <p className='text-[13px] text-[#1C1C1C] font-medium'>
              {shift.timeRange}
            </p>
          </div>

          <div className='flex flex-col gap-[4px]'>
            <div className='flex items-center gap-[5px]'>
              <MapPin className='size-[12px] text-[#999]' />
              <span className='text-[10px] text-[#999] font-medium uppercase tracking-[0.06em]'>
                Location
              </span>
            </div>
            <p className='text-[13px] text-[#1C1C1C] font-medium'>
              {shift.location}
            </p>
          </div>

          <div className='flex flex-col gap-[4px]'>
            <div className='flex items-center gap-[5px]'>
              <Briefcase className='size-[12px] text-[#999]' />
              <span className='text-[10px] text-[#999] font-medium uppercase tracking-[0.06em]'>
                Position
              </span>
            </div>
            <p className='text-[13px] text-[#1C1C1C] font-medium'>
              {shift.position}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar: Caregiver Avatars */}
      <div className='bg-[#F9F9F9] rounded-b-[12px] px-5 md:px-6 py-3 flex items-center'>
        <div className='flex -space-x-[8px]'>
          {shift.caregivers.slice(0, 3).map((c, i) => (
            <div
              key={i}
              className='w-[28px] h-[28px] rounded-full border-[2px] border-white overflow-hidden'
            >
              <Image
                src={MOCK_AVATARS[i % MOCK_AVATARS.length]}
                alt={c.name}
                width={28}
                height={28}
                className='w-full h-full object-cover'
              />
            </div>
          ))}
        </div>
        {slotsRemaining > 0 && (
          <span className='text-[11px] font-semibold text-[#008000] ml-[6px]'>
            + {slotsRemaining}more
          </span>
        )}
      </div>
    </div>
  );
};

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className='flex items-baseline gap-[4px] border border-[#E8E8E8] rounded-[6px] px-[10px] py-[6px]'>
      <span className='text-[14px] font-bold text-[#1C1C1C] tabular-nums leading-none'>
        {String(value).padStart(2, '0')}
      </span>
      <span className='text-[10px] text-[#999] font-normal leading-none'>
        {label}
      </span>
    </div>
  );
}

export default ShiftListCard;
