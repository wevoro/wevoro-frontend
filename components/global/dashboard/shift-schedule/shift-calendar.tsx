'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { CreateShiftModal } from './create-shift-modal';
import { SchedulePreferencesModal } from './schedule-preferences-modal';

// ── Types ──────────────────────────────────────────────────────────────
interface CalendarShift {
  id: string;
  status: 'COMPLETED' | 'UPCOMING';
  type: 'Day Shift' | 'Night Shift';
  startHour: number;
  endHour: number;
  startLabel: string;
  endLabel: string;
  position: string;
  dayIndex: number;
  avatars: string[];
  moreCount: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────
const MOCK_SHIFTS: CalendarShift[] = [
  {
    id: '1',
    status: 'COMPLETED',
    type: 'Day Shift',
    startHour: 10,
    endHour: 13,
    startLabel: '8:00AM',
    endLabel: '2:00PM',
    position: 'Job Position Title',
    dayIndex: 0,
    avatars: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
    ],
    moreCount: 3,
  },
  {
    id: '2',
    status: 'COMPLETED',
    type: 'Day Shift',
    startHour: 8,
    endHour: 16,
    startLabel: '8:00AM',
    endLabel: '2:00PM',
    position: 'Job Position Title',
    dayIndex: 1,
    avatars: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
    ],
    moreCount: 3,
  },
  {
    id: '5',
    status: 'COMPLETED',
    type: 'Day Shift',
    startHour: 10,
    endHour: 16,
    startLabel: '8:00AM',
    endLabel: '2:00PM',
    position: 'Job Position Title',
    dayIndex: 1,
    avatars: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
      'https://randomuser.me/api/portraits/men/45.jpg',
    ],
    moreCount: 3,
  },
  {
    id: '7',
    status: 'COMPLETED',
    type: 'Day Shift',
    startHour: 8,
    endHour: 16,
    startLabel: '8:00AM',
    endLabel: '2:00PM',
    position: 'Job Position Title',
    dayIndex: 2,
    avatars: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
    ],
    moreCount: 3,
  },
  {
    id: '8',
    status: 'COMPLETED',
    type: 'Day Shift',
    startHour: 10,
    endHour: 16,
    startLabel: '8:00AM',
    endLabel: '2:00PM',
    position: 'Job Position Title',
    dayIndex: 2,
    avatars: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
      'https://randomuser.me/api/portraits/men/45.jpg',
    ],
    moreCount: 3,
  },
  {
    id: '3',
    status: 'UPCOMING',
    type: 'Day Shift',
    startHour: 8,
    endHour: 11,
    startLabel: '8:00AM',
    endLabel: '2:00PM',
    position: 'Job Position Title',
    dayIndex: 3,
    avatars: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
    ],
    moreCount: 0,
  },
  {
    id: '4',
    status: 'UPCOMING',
    type: 'Day Shift',
    startHour: 8,
    endHour: 11,
    startLabel: '8:00AM',
    endLabel: '2:00PM',
    position: 'Job Position Title',
    dayIndex: 4,
    avatars: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
    ],
    moreCount: 0,
  },
  {
    id: '6',
    status: 'UPCOMING',
    type: 'Day Shift',
    startHour: 10,
    endHour: 15,
    startLabel: '8:00AM',
    endLabel: '2:00PM',
    position: 'Job Position Title',
    dayIndex: 5,
    avatars: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
    ],
    moreCount: 3,
  },
];

// ── Constants ──────────────────────────────────────────────────────────
const DAY_LABELS = ['MON', 'TUE', 'SAT', 'THU', 'FRI', 'SUN', 'WED'] as const;
const DESIGN_DATES = [23, 24, 28, 26, 27, 29, 25];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15];
const ROW_H = 72;
const FIRST_HOUR = 8;
const TIME_COL_W = 56;
const DAY_COL_W = 140;
const TOTAL_W = TIME_COL_W + DAY_COL_W * 7;

function formatHour(h: number): string {
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(diff);
  m.setHours(0, 0, 0, 0);
  return m;
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

// ── Component ──────────────────────────────────────────────────────────
const ShiftCalendar = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart],
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevWeek = () => setCurrentWeekStart((p) => addDays(p, -7));
  const nextWeek = () => setCurrentWeekStart((p) => addDays(p, 7));

  const displayMonth = MONTH_NAMES[currentWeekStart.getMonth()];
  const displayYear = currentWeekStart.getFullYear();

  // Group shifts by day
  const shiftsByDay = useMemo(() => {
    const map: Record<number, CalendarShift[]> = {};
    MOCK_SHIFTS.forEach((s) => {
      if (!map[s.dayIndex]) map[s.dayIndex] = [];
      map[s.dayIndex].push(s);
    });
    return map;
  }, []);

  // Green bg range per column
  const dayBgRange = useMemo(() => {
    const ranges: Record<number, { min: number; max: number }> = {};
    Object.entries(shiftsByDay).forEach(([d, shifts]) => {
      ranges[Number(d)] = {
        min: Math.min(...shifts.map((s) => s.startHour)),
        max: Math.max(...shifts.map((s) => s.endHour)),
      };
    });
    return ranges;
  }, [shiftsByDay]);

  return (
    <div className='bg-white md:rounded-[16px] p-4 md:p-8'>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
        <h2 className='text-[20px] md:text-[22px] font-bold text-[#1C1C1C]'>
          My Shifts Flow
        </h2>
        <div className='flex items-center gap-3'>
          <CreateShiftModal>
            <Button className='h-[44px] rounded-[10px] px-5 text-[14px] font-semibold gap-2 bg-[#008000] hover:bg-[#006600] text-white shadow-none'>
              <Plus className='size-[18px]' /> Create a Shift
            </Button>
          </CreateShiftModal>
          <SchedulePreferencesModal>
            <Button
              variant='outline'
              className='h-[44px] rounded-[10px] px-5 text-[14px] font-medium gap-2 border-[#E0E0E0] text-[#1C1C1C] hover:bg-[#F9F9F9] shadow-none'
            >
              <Users className='size-[16px]' />
              Schedule Preferences
            </Button>
          </SchedulePreferencesModal>
        </div>
      </div>

      {/* ── Month Nav ────────────────────────────────────────── */}
      <div className='flex items-center justify-center gap-3 mb-6'>
        <button
          onClick={prevWeek}
          className='w-[28px] h-[28px] flex items-center justify-center rounded-full border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors'
        >
          <ChevronLeft className='size-[14px] text-[#008000]' />
        </button>
        <span className='text-[16px] font-semibold text-[#1C1C1C] min-w-[120px] text-center'>
          {displayMonth} {displayYear}
        </span>
        <button
          onClick={nextWeek}
          className='w-[28px] h-[28px] flex items-center justify-center rounded-full border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors'
        >
          <ChevronRight className='size-[14px] text-[#008000]' />
        </button>
      </div>

      {/* ── Scrollable Calendar ──────────────────────────────── */}
      <div className='overflow-x-auto -mx-4 md:mx-0 pb-2'>
        <div style={{ width: `${TOTAL_W}px`, minWidth: `${TOTAL_W}px` }}>
          {/* Day Headers */}
          <div className='flex'>
            <div style={{ width: TIME_COL_W, minWidth: TIME_COL_W }} />
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                style={{ width: DAY_COL_W, minWidth: DAY_COL_W }}
                className='flex flex-col items-center py-3 gap-[2px]'
              >
                <span className='text-[11px] font-semibold tracking-[0.08em] text-[#AEAEAE] uppercase'>
                  {label}
                </span>
                <span className='text-[15px] font-medium text-[#1C1C1C]'>
                  {DESIGN_DATES[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Grid body — relative wrapper so cards can position absolutely */}
          <div className='relative border-t border-[#F0F0F0]'>
            {/* Row lines */}
            {HOURS.map((hour) => (
              <div key={hour} className='flex border-b border-[#F0F0F0]' style={{ height: ROW_H }}>
                {/* Time label */}
                <div
                  className='flex items-start justify-end pr-3 pt-[4px] shrink-0'
                  style={{ width: TIME_COL_W, minWidth: TIME_COL_W }}
                >
                  <span className='text-[11px] text-[#AEAEAE] font-normal whitespace-nowrap'>
                    {formatHour(hour)}
                  </span>
                </div>
                {/* Day cells — green bg when shift present */}
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const bg = dayBgRange[dayIdx];
                  const green = bg && hour >= bg.min && hour < bg.max;
                  return (
                    <div
                      key={dayIdx}
                      style={{ width: DAY_COL_W, minWidth: DAY_COL_W }}
                      className={cn(
                        'border-l border-[#F0F0F0]',
                        green && 'bg-[#D4EDDA]',
                      )}
                    />
                  );
                })}
              </div>
            ))}

            {/* Shift cards on top */}
            {MOCK_SHIFTS.map((shift) => {
              const top = (shift.startHour - FIRST_HOUR) * ROW_H;
              const h = (shift.endHour - shift.startHour) * ROW_H;
              const left = TIME_COL_W + shift.dayIndex * DAY_COL_W + 3;
              const w = DAY_COL_W - 6;

              return (
                <div
                  key={shift.id}
                  className='absolute z-10'
                  style={{ top, left, width: w, height: h }}
                >
                  <ShiftBlock shift={shift} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Shift Block Card ───────────────────────────────────────────────────
function ShiftBlock({ shift }: { shift: CalendarShift }) {
  const isCompleted = shift.status === 'COMPLETED';
  const isUpcoming = shift.status === 'UPCOMING';

  return (
    <div
      className={cn(
        'h-full rounded-[8px] flex flex-col overflow-hidden cursor-pointer bg-[#C8E6C9]',
        isUpcoming && 'border-r-[3px] border-r-[#FF6B6B]',
      )}
    >
      <div className='flex flex-col gap-[3px] p-[10px]'>
        {/* Status + Edit */}
        <div className='flex items-center justify-between'>
          <span
            className={cn(
              'text-[9px] font-bold uppercase px-[8px] py-[2px] rounded-[4px] tracking-[0.04em] leading-[16px]',
              isCompleted ? 'bg-[#008000] text-white' : 'bg-[#F5A623] text-white',
            )}
          >
            {shift.status}
          </span>
          {isUpcoming && (
            <button className='w-[24px] h-[24px] rounded-[5px] bg-white/80 flex items-center justify-center hover:bg-white transition-colors'>
              <Pencil className='size-[12px] text-[#666]' />
            </button>
          )}
        </div>

        {/* Shift type */}
        <div className='flex items-center gap-[4px] mt-[4px]'>
          <span className='text-[11px] text-[#555]'>❊</span>
          <span className='text-[11px] text-[#555] font-normal whitespace-nowrap'>
            Day Shift
          </span>
        </div>

        {/* Time range */}
        <p className='text-[11px] text-[#555] font-normal whitespace-nowrap'>
          {shift.startLabel} - {shift.endLabel}
        </p>

        {/* Position title */}
        <p className='text-[13px] font-bold text-[#1C1C1C] leading-tight mt-[2px]'>
          {shift.position}
        </p>

        {/* Avatars */}
        <div className='flex items-center mt-[6px]'>
          <div className='flex -space-x-[6px]'>
            {shift.avatars.slice(0, 3).map((avatar, i) => (
              <div
                key={i}
                className='w-[24px] h-[24px] rounded-full border-[1.5px] border-white overflow-hidden'
              >
                <Image
                  src={avatar}
                  alt=''
                  width={24}
                  height={24}
                  className='w-full h-full object-cover'
                />
              </div>
            ))}
          </div>
          {shift.moreCount > 0 && (
            <span className='text-[10px] font-semibold text-[#008000] ml-[4px] whitespace-nowrap'>
              + {shift.moreCount}more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShiftCalendar;
