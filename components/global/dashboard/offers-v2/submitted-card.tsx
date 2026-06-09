'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import moment from 'moment';
import {
  Calendar,
  MoreHorizontal,
  Sun,
  Moon,
  Navigation,
  Check,
  FileText,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ApplyToShiftModal from '@/components/global/dashboard/matching-shifts/apply-to-shift-modal';
import ShiftDetailGrid from './shift-detail-grid';
import StatusPill, { SubmittedStatus } from './status-pill';
import Countdown from './countdown';
import WithdrawDialog from './withdraw-dialog';
import NotesPopup from '../../note-popup';
import { formatShiftDays, isNightShift } from './helpers';

interface SubmittedCardProps {
  offer: any;
  status: SubmittedStatus;
}

const SubmittedCard: React.FC<SubmittedCardProps> = ({ offer, status }) => {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const partner = offer?.partner;
  const partnerName = partner?.personalInfo
    ? `${partner.personalInfo.firstName ?? ''} ${partner.personalInfo.lastName ?? ''}`.trim()
    : 'Agency';
  const companyName = partner?.personalInfo?.companyName ?? '';
  const partnerImage = partner?.personalInfo?.image || '/dummy-profile-pic.jpg';

  const hourlyRate = offer?.hourlyRate ?? offer?.rate ?? '—';
  const hoursPerShift = offer?.hoursPerShift ?? 6;
  const totalPerShift =
    typeof hourlyRate === 'number' ? hourlyRate * hoursPerShift : null;

  const night = isNightShift(offer?.timeRange);

  const submittedAt = offer?.createdAt;
  const startedAt = offer?.startedAt ?? offer?.startingDate;
  const completedAt = offer?.completedAt ?? offer?.updatedAt;

  const showWithdraw =
    status === 'pending' || status === 'upcoming' || status === 'active';
  const showUpdateSubmission = status === 'pending';

  return (
    <>
      <div className='border border-gray-200 rounded-2xl p-5 md:p-6 flex flex-col gap-4 bg-white'>
        {/* Top row */}
        <div className='flex items-start justify-between gap-3'>
          <div className='flex flex-col gap-2 min-w-0 flex-1'>
            {status === 'pending' && submittedAt && (
              <span className='text-xs text-gray-400'>
                {moment(submittedAt).format('DD MMM, YYYY - hh:mmA')}
              </span>
            )}
            {status === 'completed' && completedAt && (
              <span className='text-xs text-gray-400'>
                {moment(completedAt).format('DD MMM, YYYY - hh:mmA')}
              </span>
            )}

            <div className='flex items-center gap-2 flex-wrap'>
              <div className='inline-flex items-center gap-2 text-base md:text-lg font-bold text-gray-900'>
                <Calendar className='size-5 text-gray-400' />
                {offer?.startingDate
                  ? moment(offer.startingDate).format('dddd, MMM DD')
                  : 'Date TBD'}
              </div>
              <StatusPill status={status} />
            </div>

            {status === 'active' && startedAt && (
              <p className='text-xs text-gray-500'>
                Started at {moment(startedAt).format('DD MMM, YYYY hh:mmA')}
              </p>
            )}
            {status === 'completed' && completedAt && (
              <p className='text-xs text-gray-500'>
                Completed at {moment(completedAt).format('DD MMM, YYYY hh:mmA')}
              </p>
            )}

            <div className='inline-flex items-center gap-2 text-xs text-gray-500'>
              <span className='inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md'>
                {night ? <Moon className='size-3' /> : <Sun className='size-3' />}
                {night ? 'Night Shift' : 'Day Shift'}
              </span>
              {offer?.distance && (
                <span className='inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md'>
                  <Navigation className='size-3' />
                  {offer.distance}mil away
                </span>
              )}
            </div>
          </div>

          <div className='flex flex-col items-end gap-1'>
            {status === 'upcoming' && offer?.startingDate && (
              <Countdown target={offer.startingDate} />
            )}
            {(showWithdraw || showUpdateSubmission || status === 'completed') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 -mt-1 -mr-1'
                  >
                    <MoreHorizontal className='size-5 text-gray-500' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  {showUpdateSubmission && (
                    <DropdownMenuItem onClick={() => setUpdateOpen(true)}>
                      Update Submission
                    </DropdownMenuItem>
                  )}
                  {showWithdraw && (
                    <DropdownMenuItem
                      onClick={() => setWithdrawOpen(true)}
                      className='text-red-600 focus:text-red-700'
                    >
                      Withdraw application
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <p className='text-2xl md:text-3xl font-bold text-gray-900'>
              ${hourlyRate}
              <span className='text-sm font-normal text-gray-500'>/hr</span>
            </p>
            <p className='text-xs text-gray-400'>
              {hoursPerShift} hrs shift{' '}
              {totalPerShift !== null && `( Total $${totalPerShift} )`}
            </p>
          </div>
        </div>

        <ShiftDetailGrid
          shiftDays={formatShiftDays(offer?.shiftDays)}
          timeRange={offer?.timeRange}
          location={offer?.location}
          position={offer?.position}
        />

        {/* Agency row */}
        <div className='flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3'>
          <div className='flex items-center gap-3'>
            <Image
              unoptimized
              src={partnerImage}
              alt={partnerName}
              width={40}
              height={40}
              className='rounded-full object-cover size-10'
            />
            <div>
              <p className='text-sm font-semibold text-gray-900'>
                {partnerName}
              </p>
              <p className='text-xs text-gray-500'>{companyName}</p>
            </div>
          </div>
          {partner?._id && (
            <Link href={`/pro/partner/${partner._id}`}>
              <Button
                variant='outline'
                size='sm'
                className='rounded-lg border-primary text-primary hover:bg-primary/5'
              >
                View Profile ↗
              </Button>
            </Link>
          )}
        </div>

        {/* Requested files — Pending only */}
        {status === 'pending' &&
          offer?.documentsNeeded &&
          offer.documentsNeeded.length > 0 && (
            <div className='rounded-xl border border-gray-200 p-4'>
              <p className='text-sm font-semibold text-primary mb-2'>
                Requested Files
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2'>
                {offer.documentsNeeded.map((doc: any, i: number) => (
                  <div
                    key={i}
                    className='flex items-center gap-2 text-sm text-gray-700'
                  >
                    <Check className='size-4 text-primary shrink-0' />
                    <span className='truncate'>{doc.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Notes */}
        {status === 'pending' && offer?.notes && offer.notes.length > 0 && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <span className='inline-flex w-6 h-6 rounded-md bg-amber-50 items-center justify-center'>
              <FileText className='size-3.5 text-amber-500' />
            </span>
            <span>The client has left additional notes</span>
            <NotesPopup
              notes={offer.notes}
              id={offer._id}
              proId={offer?.pro?._id}
              partnerId={offer?.partner?._id}
            />
          </div>
        )}

        {/* Update Submission CTA (Pending) */}
        {showUpdateSubmission && (
          <Button
            variant='outline'
            className='w-fit gap-2 rounded-xl border-primary text-primary hover:bg-primary/5'
            onClick={() => setUpdateOpen(true)}
          >
            <RotateCw className='size-4' />
            Update Submission
          </Button>
        )}
      </div>

      <ApplyToShiftModal
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        shift={offer}
      />

      {showWithdraw && (
        <WithdrawDialog
          open={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          offer={offer}
          status={status as 'pending' | 'upcoming' | 'active'}
        />
      )}
    </>
  );
};

export default SubmittedCard;
