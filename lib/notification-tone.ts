/**
 * SCRUM-168 — notification colours, one rule for every surface.
 *
 * Urgency colour is reserved for credential-expiry alerts: yellow while the
 * credential has 30-60 days left, red under 30 days or once expired (the same
 * bands as SCRUM-136). Every other notification — a signature completed, an
 * onboarding request, a status change — is routine and reads green.
 *
 * Before this file the notifications page picked a colour per type with no
 * rule (amber reminders, orange rejections, blue and indigo for engagement
 * events) and the bell dropdown ignored the type altogether, so routine
 * events could look like warnings and expiry alerts could look routine.
 */
export type NotificationTone = 'green' | 'yellow' | 'red';

const YELLOW = new Set(['credential_yellow']);
const RED = new Set(['credential_red', 'credential_expired']);

export const toneOf = (type?: string | null): NotificationTone => {
  if (type && RED.has(type)) return 'red';
  if (type && YELLOW.has(type)) return 'yellow';
  return 'green';
};

export const NOTIFICATION_TONE: Record<
  NotificationTone,
  { bg: string; border: string; iconBg: string; iconText: string }
> = {
  green: {
    bg: 'bg-green-50',
    border: 'border-l-4 border-green-500',
    iconBg: 'bg-green-50',
    iconText: 'text-green-700',
  },
  yellow: {
    bg: 'bg-amber-50',
    border: 'border-l-4 border-amber-400',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-l-4 border-red-500',
    iconBg: 'bg-red-50',
    iconText: 'text-red-700',
  },
};
