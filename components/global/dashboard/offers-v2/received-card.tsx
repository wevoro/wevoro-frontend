'use client';

import React, { useEffect, useState } from 'react';
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
  PenLine,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ApplyToShiftModal from '@/components/global/dashboard/matching-shifts/apply-to-shift-modal';
import SignDocumentsModal from '@/components/global/dashboard/esign/sign-documents-modal';
import ShiftDetailGrid from './shift-detail-grid';
import NotesPopup from '../../note-popup';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatShiftDays, getInitialStatus, isNightShift } from './helpers';
import { isCredentialingMode } from '@/lib/credentialing';

interface ReceivedCardProps {
  offer: any;
}

interface SigningRow {
  id: string;
  title: string;
  signed: boolean;
}

// SCRUM-118: once a packet exists it is the source of truth. 'outdated' items were
// superseded by a newer version of the agency's document and are never signable.
function toSigningRows(context: any): SigningRow[] {
  const items = context?.packet?.items;
  if (items?.length) {
    return items
      .filter((item: any) => item.status !== 'outdated')
      .map((item: any) => ({
        id: item._id,
        title: item.title,
        signed: item.status === 'signed',
      }));
  }
  return (context?.documents ?? []).map((doc: any) => ({
    id: doc._id,
    title: doc.title,
    signed: false,
  }));
}

const ReceivedCard: React.FC<ReceivedCardProps> = ({ offer }) => {
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [packet, setPacket] = useState<any>(null);
  const hasUnfinishedPacket =
    !!packet && packet.status !== 'completed' &&
    (packet.items ?? []).some((i: any) => i.status === 'pending');
  const [signingRows, setSigningRows] = useState<SigningRow[]>([]);

  const isNew = moment().diff(moment(offer.createdAt), 'hours') < 24;
  // SCRUM-118: the approved offer box (Figma 10593:3950) carries Job Link,
  // Requested Files and Documents to be signed — and none of the scheduling-era
  // chrome. In credentialing mode there is no shift, rate or start date behind
  // those fields anyway, so they render as "Date TBD", "$—" and a row of dashes.
  const credentialing = isCredentialingMode();
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

  // SCRUM-118: e-signature is opt-in per agency, so a failure or empty response
  // just means this offer has nothing to sign and the section stays hidden.
  useEffect(() => {
    const uiStatus = getInitialStatus(offer);
    // 'pending' here is the post-Step-1 state, which is exactly when an
    // unfinished packet needs to be picked back up.
    if (uiStatus !== 'received' && uiStatus !== 'pending') return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/esign/offer/${offer._id}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setSigningRows(toSigningRows(json?.data));
        // SCRUM-118 Scenario 4: a packet that exists but is not finished means
        // the caregiver got through Step 1 and stopped. Without holding onto it
        // there is no route back into signing and the resume requirement cannot
        // be met — the offer stops being 'received' the moment Step 1 submits.
        const existing = json?.data?.packet;
        if (existing && existing.status !== 'completed') setPacket(existing);
      } catch {
        // Silent — the caregiver simply sees no signing section.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [offer._id]);

  // SCRUM-118: the application is only complete once the packet is signed, so the
  // success toast and refetch happen here rather than at the end of Step 1.
  const handleSigningComplete = () => {
    setSignOpen(false);
    setPacket(null);
    toast.success('Application submitted!');
    queryClient.invalidateQueries({ queryKey: ['offers'] });
  };

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
            {!credentialing && (
              <div className='inline-flex items-center gap-2 text-base md:text-lg font-bold text-gray-900'>
                <Calendar className='size-5 text-gray-400' />
                {offer?.startingDate
                  ? moment(offer.startingDate).format('dddd, MMM DD')
                  : 'Date TBD'}
              </div>
            )}
            <div className={`items-center gap-2 text-xs text-gray-500 ${credentialing ? 'hidden' : 'inline-flex'}`}>
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
            {!credentialing && (
              <>
                <p className='text-2xl md:text-3xl font-bold text-gray-900'>
                  ${hourlyRate}
                  <span className='text-sm font-normal text-gray-500'>/hr</span>
                </p>
                <p className='text-xs text-gray-400'>
                  {hoursPerShift} hrs shift{' '}
                  {totalPerShift !== null && `( Total $${totalPerShift} )`}
                </p>
              </>
            )}
          </div>
        </div>

        {!credentialing && (
          <ShiftDetailGrid
            shiftDays={formatShiftDays(offer?.shiftDays)}
            timeRange={offer?.timeRange}
            location={offer?.location}
            position={offer?.position}
          />
        )}

        {/* Job Link — the design leads with it, above the agency row. */}
        {offer?.jobLink && (
          <div className='rounded-xl border border-gray-200 p-4'>
            <div className='flex items-center gap-2 text-sm text-gray-900'>
              <LinkIcon className='size-4 text-gray-400' />
              Job Link
            </div>
            <a
              href={offer.jobLink}
              target='_blank'
              rel='noopener noreferrer'
              className='mt-2 block truncate rounded-lg bg-gray-100 px-3 py-2 text-sm text-primary hover:underline'
            >
              {offer.jobLink}
            </a>
          </div>
        )}

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
                {credentialing ? 'View Agency ↗' : 'View Profile ↗'}
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

        {/* SCRUM-118: documents the agency requires an e-signature on */}
        {signingRows.length > 0 && (
          <div className='rounded-xl border border-gray-200 p-4'>
            <p className='text-sm font-semibold text-primary mb-2'>
              Documents to be signed
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3'>
              {signingRows.map((row) => (
                <div key={row.id} className='flex items-center gap-2'>
                  <PenLine className='size-4 text-primary shrink-0' />
                  <span className='min-w-0 truncate text-sm text-[#1C1C1C]'>
                    {row.title}
                  </span>
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      row.signed
                        ? 'bg-gray-100 text-[#6C6C6C]'
                        : 'bg-[#ECFAF0] text-primary'
                    }`}
                  >
                    {row.signed ? 'Signed' : 'To sign'}
                  </span>
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
            <span>The agency has left additional notes</span>
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
            onClick={() => (hasUnfinishedPacket ? setSignOpen(true) : setApplyOpen(true))}
          >
            {hasUnfinishedPacket ? 'Continue signing' : 'Accept'}
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
        onProceedToSigning={(startedPacket) => {
          setApplyOpen(false);
          setPacket(startedPacket);
          setSignOpen(true);
        }}
      />

      {packet && (
        <SignDocumentsModal
          open={signOpen}
          onOpenChange={setSignOpen}
          packet={packet}
          onComplete={handleSigningComplete}
        />
      )}
    </>
  );
};

export default ReceivedCard;
