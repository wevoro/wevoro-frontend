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
import NotesPopup from '../../note-popup';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatShiftDays, isNightShift } from './helpers';

interface ReceivedCardProps {
  offer: any;
}

const ReceivedCard: React.FC<ReceivedCardProps> = ({ offer }) => {
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);

  const isNew = moment().diff(moment(offer.createdAt), 'hours') < 24;
  const isUrgent = !!offer?.urgent;

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

  const handleNotInterested = async () => {
    try {
      const res = await fetch('/api/user/offer/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer._id,
          status: 'rejected',
          isRemovedByPro: true,
          silent: true,
        }),
      });
      if (res.ok) {
        toast.success('Removed');
        queryClient.invalidateQueries({ queryKey: ['offers'] });
      } else {
        toast.error('Failed to remove. Try again.');
      }
    } catch {
      toast.error('Failed to remove. Try again.');
    }
  };

  return (
    <>
      <div className='border border-gray-200 rounded-2xl p-5 md:p-6 flex flex-col gap-4 bg-white'>
        {/* Top row: timestamp + dropdown + rate */}
        <div className='flex items-start justify-between gap-3'>
          <div className='flex flex-col gap-2'>
            <span className='text-xs text-gray-400'>
              {moment(offer.createdAt).fromNow()}
            </span>
            <div className='flex items-center gap-2'>
              {isUrgent && (
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-md bg-red-100 text-red-600 text-xs font-semibold'>
                  URGENT
                </span>
              )}
              {isNew && (
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold'>
                  NEW
                </span>
              )}
            </div>
            <div className='inline-flex items-center gap-2 text-base md:text-lg font-bold text-gray-900'>
              <Calendar className='size-5 text-gray-400' />
              {offer?.startingDate
                ? moment(offer.startingDate).format('dddd, MMM DD')
                : 'Date TBD'}
            </div>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='size-8 -mt-1 -mr-1'>
                  <MoreHorizontal className='size-5 text-gray-500' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={handleNotInterested}>
                  Not interested
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Requested files */}
        {offer?.documentsNeeded && offer.documentsNeeded.length > 0 && (
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
        {offer?.notes && offer.notes.length > 0 && (
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

        {/* Actions */}
        <div className='flex gap-3 mt-2'>
          <Button
            className='flex-1 h-12 rounded-xl font-semibold text-base'
            onClick={() => setApplyOpen(true)}
          >
            Accept
          </Button>
          <Button
            variant='outline'
            className='flex-1 h-12 rounded-xl font-semibold text-base border-gray-200 text-gray-800 hover:bg-gray-50'
            onClick={handleNotInterested}
          >
            Not Interested
          </Button>
        </div>
      </div>

      <ApplyToShiftModal
        open={applyOpen}
        onOpenChange={setApplyOpen}
        shift={offer}
      />
    </>
  );
};

export default ReceivedCard;
