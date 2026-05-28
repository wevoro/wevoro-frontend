'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string; // "10:00 AM" format
  onChange?: (value: string) => void;
  label?: string;
  required?: boolean;
  isError?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value = '',
  onChange,
  label,
  required,
  isError,
}) => {
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [time, setTime] = useState('08:00');

  useEffect(() => {
    if (value) {
      const parts = value.match(/(\d{1,2}:\d{2})\s*(AM|PM)/i);
      if (parts) {
        setTime(parts[1]);
        setPeriod(parts[2].toUpperCase() as 'AM' | 'PM');
      }
    }
  }, []);

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    onChange?.(`${newTime} ${period}`);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    onChange?.(`${time} ${newPeriod}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-tertiary">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 border rounded-xl px-3 py-2.5 h-12 bg-white',
          isError ? 'border-red-500' : 'border-[#DFE2E0]'
        )}
      >
        <div className="flex items-center gap-0.5 bg-[#F5F5F5] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => handlePeriodChange('AM')}
            className={cn(
              'px-2 py-1 rounded-md text-xs font-medium transition-colors',
              period === 'AM'
                ? 'bg-[#1C1C1C] text-white'
                : 'text-muted-foreground hover:text-tertiary'
            )}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('PM')}
            className={cn(
              'px-2 py-1 rounded-md text-xs font-medium transition-colors',
              period === 'PM'
                ? 'bg-[#1C1C1C] text-white'
                : 'text-muted-foreground hover:text-tertiary'
            )}
          >
            PM
          </button>
        </div>
        <input
          type="text"
          value={time}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9:]/g, '');
            if (val.length <= 5) handleTimeChange(val);
          }}
          placeholder="00:00"
          className="flex-1 text-sm text-tertiary bg-transparent outline-none min-w-0"
          maxLength={5}
        />
        <Clock className="size-5 text-[#008000]" />
      </div>
    </div>
  );
};

export { TimePicker };
