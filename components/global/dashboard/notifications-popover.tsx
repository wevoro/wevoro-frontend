'use client';

import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { Bell, FileText, CheckCircle2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/app/apiHooks/useNotifications';

/**
 * The approved design (Figma 10544:3982) puts notifications in a popover on the
 * bell — header, the most recent few, and a "See all" link — not on a page of
 * their own. The bell used to navigate straight to /notifications, so the
 * popover in the design never existed. The full page is kept and is what
 * "See all" opens.
 */
const stripHtml = (s: string): string =>
  String(s || '')
    .replace(/<[^>]*>/g, '')
    .trim();

const NotificationsPopover: React.FC<{ basePath: string }> = ({ basePath }) => {
  const { data: notifications } = useNotifications();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const items = React.useMemo(
    () => (notifications ?? []).slice(0, 5),
    [notifications]
  );
  const unread = React.useMemo(
    () => (notifications ?? []).filter((n: any) => !n.isRead),
    [notifications]
  );

  const markAllRead = async () => {
    try {
      // The existing endpoint marks every unread notification for this user.
      await fetch('/api/user/notification/mark-as-read', { method: 'PATCH' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // Best effort: the list still reads correctly on the next fetch.
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label='Notifications'
          className='flex flex-col items-center gap-1 text-sm text-gray-600 transition-colors hover:text-primary'
        >
          <span className='relative'>
            <Bell className='h-5 w-5 md:h-4 md:w-4 lg:h-6 lg:w-6' />
            {unread.length > 0 && (
              <span className='absolute right-0 top-0 h-2 w-2 rounded-full bg-[#33B55B]' />
            )}
          </span>
          <span className='hidden lg:block'>Notifications</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align='end'
        sideOffset={12}
        className='w-[400px] rounded-2xl border border-[#DFE2E0] p-0 shadow-lg'
      >
        <div className='flex items-center justify-between px-5 pb-3 pt-4'>
          <p className='text-[16px] font-semibold text-[#1C1C1C]'>
            Notifications
          </p>
          {/* The design keeps this visible at all times; it simply has nothing
              to do once everything is read. */}
          <button
            type='button'
            onClick={markAllRead}
            disabled={unread.length === 0}
            className='text-[14px] font-medium text-[#008000] hover:underline disabled:cursor-default disabled:opacity-40 disabled:hover:no-underline'
          >
            Mark all read
          </button>
        </div>

        {items.length === 0 ? (
          <p className='px-5 pb-6 pt-2 text-center text-[14px] text-[#5E6864]'>
            Nothing yet.
          </p>
        ) : (
          <div className='px-2'>
            {items.map((n: any) => (
              <Link
                key={n._id}
                href={n.ctaLink || `${basePath}/notifications`}
                onClick={() => setOpen(false)}
                className={`flex gap-3 rounded-xl px-3 py-3 transition-colors ${
                  n.isRead ? 'hover:bg-[#F7F8F8]' : 'bg-[#E9FBF0]'
                }`}
              >
                <span className='relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F2F4F3]'>
                  <FileText className='size-4 text-[#5E6864]' />
                  <CheckCircle2 className='absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-white text-[#008000]' />
                </span>
                <span className='min-w-0'>
                  <span className='block text-[14px] leading-[19px] text-[#1C1C1C]'>
                    {stripHtml(n.message)}
                  </span>
                  <span className='mt-0.5 block text-[13px] text-[#5E6864]'>
                    {moment(n.createdAt).fromNow()}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <Link
          href={`${basePath}/notifications`}
          onClick={() => setOpen(false)}
          className='block px-5 py-3.5 text-center text-[14px] text-[#5E6864] hover:text-[#1C1C1C]'
        >
          See all
        </Link>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;
