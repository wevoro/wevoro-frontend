'use client';

import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { CalendarDays, Download as DownloadIcon, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SendMessageModal } from './send-message-modal';

const DEFAULT_AVATAR =
  'https://med.gov.bz/wp-content/uploads/2020/08/dummy-profile-pic.jpg';

export interface EngagementEntry {
  /** The other party's user id (agency for caregiver view, caregiver for agency view). */
  partyId: string;
  name: string;
  image?: string | null;
  /** Caregiver role badge — agency-side cards only (SCRUM-60). */
  role?: 'CNA' | 'PCA' | null;
  onboardedAt?: string | null;
  downloadedAt?: string | null;
}

/**
 * SCRUM-87/88: a single credentialing-mode Offers card. Reused on both sides —
 * the caregiver sees agencies, the agency sees caregivers. `downloadedAt`
 * presence is what distinguishes a Received card from a Submitted one.
 */
export function EngagementCard({
  entry,
  profileHref,
  profileLabel,
  /** Optional extra primary action, e.g. agency-side "Download Credential Package". */
  extraAction,
}: {
  entry: EngagementEntry;
  profileHref: string;
  profileLabel: string;
  extraAction?: React.ReactNode;
}) {
  const fmt = (d?: string | null) =>
    d ? moment(d).format('MMM D, YYYY') : null;

  return (
    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 md:p-5'>
      {/* Identity + timestamps */}
      <div className='flex items-start gap-3 md:gap-4 min-w-0'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.image || DEFAULT_AVATAR}
          alt={entry.name}
          className='size-12 md:size-14 rounded-full object-cover bg-gray-100 dark:bg-neutral-800 shrink-0'
        />
        <div className='min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h3 className='text-base md:text-lg font-semibold text-gray-900 dark:text-neutral-100 truncate'>
              {entry.name}
            </h3>
            {entry.role && (
              <span className='inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold'>
                {entry.role}
              </span>
            )}
          </div>
          <div className='mt-1 flex flex-col gap-0.5 text-sm text-gray-500 dark:text-neutral-400'>
            {fmt(entry.onboardedAt) && (
              <span className='inline-flex items-center gap-1.5'>
                <CalendarDays className='size-3.5' />
                Onboarded on {fmt(entry.onboardedAt)}
              </span>
            )}
            {fmt(entry.downloadedAt) && (
              <span className='inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400'>
                <DownloadIcon className='size-3.5' />
                Downloaded on {fmt(entry.downloadedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-2 md:gap-3 shrink-0'>
        {extraAction}
        <SendMessageModal recipientId={entry.partyId} recipientName={entry.name}>
          <Button
            variant='outline'
            className='h-10 rounded-xl gap-1.5 text-sm font-semibold'
          >
            <MessageSquare className='size-4' />
            Message
          </Button>
        </SendMessageModal>
        <Link href={profileHref}>
          <Button
            variant='outline'
            className='h-10 rounded-xl gap-1.5 text-sm font-semibold'
          >
            <User className='size-4' />
            <span className='hidden sm:inline'>{profileLabel}</span>
            <span className='sm:hidden'>Profile</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default EngagementCard;
