'use client';

import React from 'react';
import { Clock, Calendar, Play, CheckCircle2 } from 'lucide-react';

export type SubmittedStatus = 'pending' | 'upcoming' | 'active' | 'completed';

interface StatusPillProps {
  status: SubmittedStatus;
}

const STATUS_CONFIG: Record<
  SubmittedStatus,
  { label: string; bg: string; color: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: 'PENDING',
    bg: '#FFF4E5',
    color: '#FF9500',
    Icon: Clock,
  },
  upcoming: {
    label: 'UPCOMING',
    bg: '#FFF4E5',
    color: '#FF9500',
    Icon: Calendar,
  },
  active: {
    label: 'ACTIVE',
    bg: '#E6F8EC',
    color: '#1A7A3C',
    Icon: Play,
  },
  completed: {
    label: 'COMPLETED',
    bg: '#E6F8EC',
    color: '#1A7A3C',
    Icon: CheckCircle2,
  },
};

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  const { Icon } = cfg;

  return (
    <span
      className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium'
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon className='size-3' />
      {cfg.label}
    </span>
  );
};

export default StatusPill;
