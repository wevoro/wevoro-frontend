'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DAYS = [
  { key: 'MON', label: 'MON' },
  { key: 'TUE', label: 'TUE' },
  { key: 'WED', label: 'WED' },
  { key: 'THU', label: 'THU' },
  { key: 'FRI', label: 'FRI' },
  { key: 'SAT', label: 'SAT' },
  { key: 'SUN', label: 'SUN' },
] as const;

export function SchedulePreferencesModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
  ]);
  const [anytime, setAnytime] = useState(false);
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('11:00 PM');

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  // Calculate working hours
  const calculateHours = () => {
    if (anytime) return 24;
    try {
      const parseTime = (t: string) => {
        const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return 0;
        let hours = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours + mins / 60;
      };
      const diff = parseTime(endTime) - parseTime(startTime);
      return diff > 0 ? Math.round(diff) : 0;
    } catch {
      return 0;
    }
  };

  const handleApply = () => {
    // TODO: Integrate with backend API
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[520px] gap-0 overflow-y-auto max-h-[85vh] p-0'>
        {/* Header */}
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle className='text-lg font-semibold text-tertiary'>
            Preferences
          </DialogTitle>
          <DialogDescription className='sr-only'>
            Set your schedule preferences
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-8 p-6'>
          {/* Working Days */}
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <h3 className='text-sm font-semibold text-tertiary'>
                Working Days
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='size-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs max-w-[200px]'>
                      Select the days you are available to work shifts.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className='flex gap-2 flex-wrap'>
              {DAYS.map((day) => (
                <button
                  key={day.key}
                  type='button'
                  onClick={() => toggleDay(day.key)}
                  className={cn(
                    'h-10 px-4 rounded-xl text-sm font-medium transition-all border',
                    selectedDays.includes(day.key)
                      ? 'bg-tertiary text-white border-tertiary'
                      : 'bg-white text-tertiary border-[#DFE2E0] hover:border-gray-400',
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Available Working Hours */}
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h3 className='text-sm font-semibold text-tertiary'>
                  Available Working Hours
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='size-4 text-muted-foreground cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs max-w-[200px]'>
                        Set your preferred working hours for shifts.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <label className='flex items-center gap-2 cursor-pointer'>
                <Checkbox
                  checked={anytime}
                  onCheckedChange={(checked) => setAnytime(checked === true)}
                  className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                />
                <span className='text-sm text-tertiary font-medium'>
                  Anytime
                </span>
              </label>
            </div>

            {!anytime && (
              <div className='grid grid-cols-2 gap-4'>
                <TimePicker
                  label='Starting Time'
                  value={startTime}
                  onChange={setStartTime}
                />
                <TimePicker
                  label='Ending Time'
                  value={endTime}
                  onChange={setEndTime}
                />
              </div>
            )}

            {/* Auto-calculated hours */}
            <div className='flex items-center gap-3 p-4 bg-[#F8FFF8] rounded-xl border border-primary/10'>
              <div className='flex flex-col'>
                <span className='text-2xl font-bold text-primary'>
                  {anytime ? '24' : calculateHours()} Hrs
                </span>
                <span className='text-xs text-muted-foreground'>
                  Working Hrs/Day
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className='flex flex-row gap-4 p-6 pt-0'>
          <DialogClose asChild>
            <Button
              type='button'
              variant='outline'
              className='w-full md:h-[52px] rounded-xl'
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            onClick={handleApply}
            className='w-full md:h-[52px] rounded-xl'
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
