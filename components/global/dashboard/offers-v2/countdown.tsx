'use client';

import React, { useEffect, useState } from 'react';
import moment from 'moment';

interface CountdownProps {
  target: string | Date;
}

const Countdown: React.FC<CountdownProps> = ({ target }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const diff = moment(target).diff(moment(now));
  const dur = moment.duration(diff > 0 ? diff : 0);
  const days = Math.floor(dur.asDays());
  const hours = dur.hours();
  const minutes = dur.minutes();

  const Cell = ({ value, label }: { value: number; label: string }) => (
    <div className='flex items-center gap-1'>
      <span className='font-bold text-base text-gray-900 tabular-nums'>
        {String(value).padStart(2, '0')}
      </span>
      <span className='text-xs text-gray-400'>{label}</span>
    </div>
  );

  return (
    <div className='flex items-center gap-3'>
      <Cell value={days} label='days' />
      <Cell value={hours} label='hrs' />
      <Cell value={minutes} label='min' />
    </div>
  );
};

export default Countdown;
