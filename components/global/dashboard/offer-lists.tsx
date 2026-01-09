'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Check,
  Copy,
  FileCheck,
  FileClock,
  Link2,
  MoreHorizontal,
  RotateCw,
} from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { ProRequestModal } from './pro-request-modal';
import { AlertModal } from './alert-modal';
import { useAppContext } from '@/lib/context';
import moment from 'moment';
import Link from 'next/link';
import { toast } from 'sonner';
import NotesPopup from '../note-popup';
import { OfferDropdown } from './offer-dropdown';
import OfferActionModal from './offer-action-modal';
import { statusIcons, statusTexts } from '@/utils/status';
import { statusColors } from '@/utils/status';
import {
  useNotificationsContext,
  useOffersContext,
  useUIContext,
  useUserContext,
} from '@/lib/contexts';

const OfferLists = ({ offers, source }: any) => {
  const { user } = useUserContext();
  const { sendNotification } = useNotificationsContext();
  const { refetchOffers, isOffersLoading } = useOffersContext();
  const { setActionData, openAlert } = useUIContext();
  const handleRespond = (offer: any) => {
    setActionData({
      id: offer._id,
      type: 'accept',
      notes: offer.notes,
      partnerId: offer.partner._id,
    });
    openAlert();
  };
  const handleReject = (offer: any) => {
    setActionData({
      id: offer._id,
      type: 'reject',
      notes: offer.notes,
      partnerId: offer.partner._id,
    });
    openAlert();
  };

  console.log({ offers });

  const handleRemove = async (id: string, partnerId: string) => {
    const response = fetch(`/api/user/offer/update`, {
      method: 'PATCH',
      body: JSON.stringify({ id, status: 'rejected', isRemovedByPro: true }),
    });
    toast.promise(response, {
      loading: 'Removing offer...',
      success: async (data: any) => {
        refetchOffers();
        await data.json();
        await sendNotification(
          `<p>Your offer has been rejected by <span style="font-weight: 600; color: #008000;">${user?.personalInfo?.firstName} ${user?.personalInfo?.lastName}</span></p>`,
          partnerId
        );
        return 'Offer removed successfully!';
      },
      error: 'Failed to remove offer',
    });
  };

  if (isOffersLoading) {
    return (
      <div className='flex flex-col gap-8'>
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className='px-4 p-6 md:p-8 bg-white md:rounded-[16px] animate-pulse'
          >
            <div className='flex flex-col gap-2 w-full'>
              <div className='flex justify-between items-center'>
                <span className='bg-gray-200 h-4 w-24 rounded'></span>
                <MoreHorizontal className='w-6 h-6 text-gray-300' />
              </div>

              <div className='flex items-center gap-3'>
                <div className='bg-gray-200 w-12 h-12 sm:size-[58px] rounded-full'></div>
                <div>
                  <div className='bg-gray-200 h-4 w-32 rounded mb-1'></div>
                  <div className='bg-gray-200 h-4 w-24 rounded'></div>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-4 gap-2 w-auto xl:w-max'>
                <div className='flex flex-col gap-1'>
                  <div className='bg-gray-200 h-4 w-24 rounded'></div>
                  <div className='bg-gray-200 h-4 w-32 rounded'></div>
                </div>
                <div className='flex flex-col gap-1'>
                  <div className='bg-gray-200 h-4 w-24 rounded'></div>
                  <div className='bg-gray-200 h-4 w-32 rounded'></div>
                </div>
                <div className='flex flex-col gap-1'>
                  <div className='bg-gray-200 h-4 w-24 rounded'></div>
                  <div className='bg-gray-200 h-4 w-32 rounded'></div>
                </div>
                <div className='flex flex-col gap-1'>
                  <div className='bg-gray-200 h-4 w-24 rounded'></div>
                  <div className='bg-gray-200 h-4 w-32 rounded'></div>
                </div>
              </div>

              <div className='flex justify-between mt-4 gap-3'>
                <div className='bg-gray-200 h-[40px] sm:h-[50px] 2xl:h-[71px] w-full rounded-[12px]'></div>
                <div className='bg-gray-200 h-[40px] sm:h-[50px] 2xl:h-[71px] w-full rounded-[12px]'></div>
              </div>

              <div className='mt-3 flex items-center gap-2'>
                <FileCheck className='w-6 h-6 text-gray-300' />
                <div className='bg-gray-200 h-4 w-48 rounded'></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8'>
      {offers?.map((offer: any, index: any) => (
        <div key={index} className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
          <div className='flex flex-col gap-2 w-full'>
            <div className='flex flex-col gap-4'>
              <div
                className='flex justify-between items-center'
                key={offer._id}
              >
                <span
                  className={cn(
                    'text-[#6C6C6C80] text-sm flex items-center gap-2 uppercase'
                  )}
                  style={{
                    color:
                      statusColors[offer.status as keyof typeof statusColors],
                  }}
                >
                  {statusIcons[offer.status as keyof typeof statusIcons]}
                  {statusTexts[offer.status as keyof typeof statusTexts]}
                </span>

                <OfferDropdown offer={offer} handleRemove={handleRemove} />
              </div>
              <span className='text-[#6C6C6C80] text-sm'>
                {moment(offer.createdAt).format('DD MMM YYYY - hh:mm A')}
              </span>
            </div>

            <div className='flex items-center gap-3'>
              <Link href={`/pro/partner/${offer.partner._id}`}>
                <Image
                  unoptimized
                  src={offer?.partner?.personalInfo?.image}
                  alt={offer.partner.personalInfo.companyName}
                  width={58}
                  height={58}
                  className='w-12 h-12 sm:size-[58px] rounded-full object-cover hover:opacity-80 transition-opacity'
                />
              </Link>
              <div>
                <Link
                  href={`/pro/partner/${offer.partner._id}`}
                  className='text-base sm:text-lg text-tertiary inline-flex items-center gap-2 sm:pb-1 hover:underline'
                >
                  {offer.partner.personalInfo.firstName}{' '}
                  {offer.partner.personalInfo.lastName}{' '}
                  <span className='text-[8px] sm:text-sm bg-[#BBF8DC] px-2 font-semibold rounded-full'>
                    New
                  </span>
                </Link>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {offer.partner.personalInfo.companyName}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-4 gap-2 w-auto'>
              <div className='flex flex-col gap-1'>
                <p className='text-muted-foreground text-sm'>
                  Company Industry:
                </p>
                <p className='text-tertiary font-medium text-sm'>
                  {offer.partner.personalInfo.industry}
                </p>
              </div>
              <div className='flex flex-col gap-1'>
                <p className='text-muted-foreground text-sm'>
                  Date Established:
                </p>
                <p className='text-tertiary font-medium text-sm'>
                  {moment(offer.dateEstablished).format('DD MMM YYYY')}
                </p>
              </div>

              <div className='flex flex-col gap-1'>
                <p className='text-muted-foreground text-sm'>Location:</p>
                <p className='text-tertiary font-medium text-sm'>
                  {offer.partner.personalInfo.address.city} ,{' '}
                  {offer.partner.personalInfo.address.state} ,{' '}
                  {offer.partner.personalInfo.address.country}
                </p>
              </div>
              <div className='flex flex-col gap-1'>
                <p className='text-muted-foreground text-sm'>Job link:</p>
                <div className='inline-flex items-center gap-2'>
                  <Link
                    href={offer.jobLink}
                    target='_blank'
                    className='text-[#33B55B] font-medium text-sm truncate max-w-[250px]'
                  >
                    {offer.jobLink}
                  </Link>
                  <p
                    className='bg-accent text-sm rounded-lg p-1 cursor-pointer'
                    onClick={() => {
                      navigator.clipboard.writeText(offer.jobLink);
                      toast.success('Link copied to clipboard');
                    }}
                  >
                    <Copy className='w-3 h-3' />
                  </p>
                </div>
              </div>
            </div>
            {source === 'offers' && (
              <div className='flex justify-between mt-4 gap-3'>
                {offer.documentsNeeded.length === 0 ? (
                  <Button
                    className={cn(
                      'h-[40px] sm:h-[50px] 2xl:h-[71px] w-full rounded-[12px] text-xs sm:text-base font-semibold'
                    )}
                    onClick={() => handleRespond(offer)}
                  >
                    Accept
                  </Button>
                ) : (
                  <ProRequestModal offer={offer} refetchOffers={refetchOffers}>
                    <Button
                      className={cn(
                        'h-[40px] sm:h-[50px] 2xl:h-[71px] w-full rounded-[12px] text-xs sm:text-base font-semibold'
                      )}
                      // onClick={handleRespond}
                    >
                      Respond
                    </Button>
                  </ProRequestModal>
                )}
                <Button
                  className={cn(
                    'h-[40px] sm:h-[50px] 2xl:h-[71px] w-full rounded-[12px] text-xs sm:text-base font-semibold',
                    'bg-accent text-tertiary hover:bg-accent/80'
                  )}
                  onClick={() => handleReject(offer)}
                >
                  Reject
                </Button>
              </div>
            )}

            {offer.documentsNeeded.length === 0 ? (
              <div className='mt-3 flex items-center gap-2 text-[#6C6C6C80]'>
                <FileCheck className='w-6 h-6 text-[#6C6C6C80]' />
                <div className='flex gap-4 items-center'>
                  <p className='text-base'>
                    All good! No need for any more requirements.
                  </p>
                  {offer.notes && (
                    <NotesPopup
                      notes={offer.notes}
                      id={offer._id}
                      proId={offer.pro._id}
                      partnerId={offer.partner._id}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className='mt-3 flex flex-col gap-3'>
                <div className='text-base text-tertiary flex items-center gap-2'>
                  <FileClock className='w-6 h-6 text-muted-foreground' />
                  <div className='flex gap-4 items-center'>
                    <p>The client is requesting:</p>
                    {offer.notes && (
                      <NotesPopup
                        notes={offer.notes}
                        id={offer._id}
                        proId={offer.pro._id}
                        partnerId={offer.partner._id}
                      />
                    )}
                  </div>
                </div>

                {offer?.documentsNeeded?.map((document: any, idx: any) => (
                  <li
                    key={idx}
                    className='flex items-center gap-2 list-disc list-inside'
                  >
                    <Check
                      className={cn(
                        'size-4 text-[#DFE2E0]',
                        document?.status === 'uploaded' && 'text-primary'
                      )}
                    />
                    <span className='inline-flex items-center gap-2'>
                      {document.title}
                      {document.url && (
                        <Link
                          href={document.url || ''}
                          target='_blank'
                          className='text-primary'
                        >
                          <Link2 className='size-4' />
                        </Link>
                      )}
                    </span>
                  </li>
                ))}
                {source === 'jobs' &&
                  offer.status !== 'rejected' &&
                  offer.status !== 'accepted' && (
                    <ProRequestModal
                      offer={offer}
                      refetchOffers={refetchOffers}
                    >
                      <Button
                        variant='outline'
                        className='border border-primary py-2 px-4 rounded-[12px] h-9 w-max'
                      >
                        <RotateCw className='size-3 md:size-4 mr-1' />
                        Update Requirements
                      </Button>
                    </ProRequestModal>
                  )}
              </div>
            )}
          </div>
        </div>
      ))}
      <AlertModal />
      <OfferActionModal />
    </div>
  );
};

export default OfferLists;
