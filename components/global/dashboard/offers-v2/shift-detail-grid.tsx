'use client';

import React from 'react';
import { Clock, MapPin, Briefcase } from 'lucide-react';

interface ShiftDetailGridProps {
  shiftDays?: string;
  timeRange?: string;
  location?: string;
  position?: string;
}

const ShiftDetailGrid: React.FC<ShiftDetailGridProps> = ({
  shiftDays,
  timeRange,
  location,
  position,
}) => (
  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-4'>
    <div>
      <p className='text-xs text-gray-400 uppercase mb-1 flex items-center gap-1'>
        <Clock className='size-3' /> Shift Days
      </p>
      <p className='text-sm font-medium text-gray-900'>{shiftDays || '—'}</p>
    </div>
    <div>
      <p className='text-xs text-gray-400 uppercase mb-1 flex items-center gap-1'>
        <Clock className='size-3' /> Time Range
      </p>
      <p className='text-sm font-medium text-gray-900'>{timeRange || '—'}</p>
    </div>
    <div>
      <p className='text-xs text-gray-400 uppercase mb-1 flex items-center gap-1'>
        <MapPin className='size-3' /> Location
      </p>
      <p className='text-sm font-medium text-gray-900 truncate'>
        {location || '—'}
      </p>
    </div>
    <div>
      <p className='text-xs text-gray-400 uppercase mb-1 flex items-center gap-1'>
        <Briefcase className='size-3' /> Position
      </p>
      <p className='text-sm font-medium text-gray-900'>{position || '—'}</p>
    </div>
  </div>
);

export default ShiftDetailGrid;
