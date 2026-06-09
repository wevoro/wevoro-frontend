import moment from 'moment';

export function formatShiftDays(days?: string[]): string {
  if (!days || days.length === 0) return '';
  const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (days.length === 7) return 'Every day';
  return order.filter((d) => days.includes(d)).join(',');
}

/** SCRUM-55 platform-wide Night Shift = start time between 7:00 PM and 5:00 AM */
export function isNightShift(timeRange?: string): boolean {
  if (!timeRange) return false;
  const startStr = timeRange.split('-')[0]?.trim();
  if (!startStr) return false;
  // Accept "10:00AM", "10:00 AM", "10AM" forms
  const m = moment(startStr, ['h:mmA', 'h:mm A', 'hA', 'h A', 'HH:mm']);
  if (!m.isValid()) return false;
  const hour = m.hour();
  return hour >= 19 || hour < 5;
}

export function getInitialStatus(offer: any): 'pending' | 'upcoming' | 'active' | 'completed' | 'received' {
  // Map backend offer.status to UI status
  const s = offer?.status;
  if (s === 'pending' && !offer?.proResponded) return 'received';
  if (s === 'pending' && offer?.proResponded) return 'pending';
  if (s === 'responded' || s === 'accepted') return 'pending';
  if (s === 'upcoming') return 'upcoming';
  if (s === 'active') return 'active';
  if (s === 'onboarded' && offer?.startingDate && moment(offer.startingDate).isAfter()) return 'upcoming';
  if (s === 'onboarded' && offer?.startingDate && moment(offer.startingDate).isSameOrBefore()) return 'active';
  if (s === 'completed') return 'completed';
  return 'received';
}
