'use client';
import React from 'react';
import ShiftCalendar from '@/components/global/dashboard/shift-schedule/shift-calendar';
import ShiftsList from '@/components/global/dashboard/shift-schedule/shifts-list';
import AvailableCaregivers from '@/components/global/dashboard/shift-schedule/available-caregivers';

const ShiftSchedulePage = () => {
  return (
    <div className='flex flex-col gap-8'>
      <ShiftCalendar />
      <ShiftsList />
      <AvailableCaregivers />
    </div>
  );
};

export default ShiftSchedulePage;
