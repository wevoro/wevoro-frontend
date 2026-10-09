'use client';

import React from 'react';
import { ChevronDown, UserSearch } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type OnboardingStatusFilter = 'all' | 'not_started' | 'in_progress' | 'signed';
export type OnboardingTimeFilter = 'all' | 'week' | 'month';

export const STATUS_LABELS: Record<OnboardingStatusFilter, string> = {
  all: 'All Status',
  not_started: 'Not started',
  in_progress: 'Signing started',
  signed: 'Signed',
};

export const TIME_LABELS: Record<OnboardingTimeFilter, string> = {
  all: 'Any time',
  week: 'This Week',
  month: 'This Month',
};

/**
 * SCRUM-141 (Faisal P1/P2): the search box and the two filters above the
 * caregiver's onboarding cards. Everything is filtered on the page; nothing
 * is fetched again.
 *
 * The time filter starts at "Any time", not "This Week" as drawn: a request
 * older than a week that is still waiting on a signature must not be hidden
 * by default.
 */
const OnboardingFilters: React.FC<{
  query: string;
  onQuery: (v: string) => void;
  status: OnboardingStatusFilter;
  onStatus: (v: OnboardingStatusFilter) => void;
  time: OnboardingTimeFilter;
  onTime: (v: OnboardingTimeFilter) => void;
}> = ({ query, onQuery, status, onStatus, time, onTime }) => {
  const menu = <T extends string>(
    id: string,
    value: T,
    labels: Record<T, string>,
    onPick: (v: T) => void
  ) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          data-testid={id}
          className='inline-flex h-14 items-center gap-3 rounded-[12px] bg-[#F9F9FA] px-6 text-[16px] font-medium text-[#1C1C1C] hover:bg-[#F1F2F3]'
        >
          {labels[value]}
          <ChevronDown className='size-5 text-[#6C6C6C]' strokeWidth={1.6} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {(Object.keys(labels) as T[]).map((k) => (
          <DropdownMenuItem key={k} onClick={() => onPick(k)}>
            {labels[k]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className='flex flex-col gap-3 pb-6 lg:flex-row lg:items-center'>
      <label className='flex w-full items-center gap-3 rounded-[12px] border-[1.25px] border-[#DFE2E0] px-4 lg:w-[580px]'>
        <UserSearch className='size-6 shrink-0 text-[#6C6C6C]' strokeWidth={1.4} />
        <input
          id='onboarding-search'
          type='search'
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder='Search by agency, role, or location'
          className='h-14 w-full min-w-0 bg-transparent text-[16px] text-[#1C1C1C] outline-none placeholder:text-[#6C6C6C]/80'
        />
      </label>
      <div className='flex flex-1 items-center gap-2.5 lg:justify-end'>
        {menu('onboarding-status', status, STATUS_LABELS, onStatus)}
        {menu('onboarding-time', time, TIME_LABELS, onTime)}
      </div>
    </div>
  );
};

export default OnboardingFilters;
