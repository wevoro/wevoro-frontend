'use client';
import { Button } from '@/components/ui/button';
import {
  Download,
  FileText,
  Hourglass,
  Link as LinkIcon,
  Link2,
  MapPin,
  MoveUpRight,
  RotateCw,
  X,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

import { saveAs } from 'file-saver';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OfferDropdown } from '@/components/global/dashboard/offer-dropdown';
import OffersSkeleton from '@/components/global/dashboard/offers-skeleton';
import moment from 'moment';

import { toast } from 'sonner';
import NotesPopup from '@/components/global/note-popup';
import Link from 'next/link';
import { statusColors, statusIcons, statusTexts } from '@/utils/status';
import {
  useNotificationsContext,
  useOffersContext,
  useUIContext,
  useUserContext,
} from '@/lib/contexts';

const PartnerOffers = () => {
  // const {
  //   openPartner,
  //   offers,
  //   isOffersLoading,
  //   refetchOffers,
  //   sendNotification,
  //   // user,
  // } = useAppContext();

  const { offers, isOffersLoading, refetchOffers } = useOffersContext();
  const { sendNotification } = useNotificationsContext();
  const { user } = useUserContext();
  const { openPartner } = useUIContext();

  const [isLoading, setIsLoading] = useState(false);

  if (isOffersLoading) {
    return <OffersSkeleton />;
  }

  const handleRemove = async (id: string) => {
    const response = fetch(`/api/user/offer/delete`, {
      method: 'DELETE',
      body: JSON.stringify(id),
    });
    toast.promise(response, {
      loading: 'Deleting offer...',
      success: async (data: any) => {
        refetchOffers();
        const responseData: any = await data.json();
        return responseData.message || 'Offer deleted successfully!';
      },
      error: 'Failed to delete offer',
    });
  };

  const handleDownloadAll = async (id: string) => {
    const offer = offers.find((offer: any) => offer._id === id);
    const documentsNeeded = offer?.documentsNeeded;
    const urls = documentsNeeded
      .map((document: any) => document.url)
      .filter(Boolean);

    if (urls.length === 0) {
      alert('No downloadable files available.');
      return;
    }

    if (urls.length === 1) {
      const item = urls[0];

      const response = await fetch(item);
      const blob = await response.blob();

      saveAs(blob, 'document');
    } else {
      for (const item of urls) {
        try {
          const response = await fetch(item);
          const blob = await response.blob();
          saveAs(blob, 'document');
        } catch (error) {
          console.error(`Failed to download file:`, error);
        }
      }
    }
  };

  const handleConfirm = async (offer: any) => {
    setIsLoading(true);
    const response = await fetch(`/api/user/offer/update`, {
      method: 'PATCH',
      body: JSON.stringify({
        id: offer._id,
        status: 'accepted',
      }),
    });
    const responseData: any = await response.json();

    if (responseData.status === 200) {
      refetchOffers();
      toast.success('Offer confirmed successfully!');
      setIsLoading(false);
      await sendNotification(
        `<p>Your response has been confirmed by <span style="font-weight: 600; color: #008000;">${user?.personalInfo?.companyName}</span></p>`,
        offer.pro._id
      );
    } else {
      setIsLoading(false);
      toast.error('Failed to confirm offer');
    }
  };

  return (
    <div className='flex flex-col gap-8'>
      {offers?.map((offer: any, index: any) => (
        <div key={index} className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
          <div className='flex flex-col gap-4 w-full'>
            <div className='flex justify-between items-start'>
              <div className='flex flex-col gap-4'>
                <span
                  className={cn(
                    'text-[#6C6C6C80] text-sm flex items-center gap-2 uppercase'
                    // statusColors[offer.status as keyof typeof statusColors]
                  )}
                  style={{
                    color:
                      statusColors[offer.status as keyof typeof statusColors],
                  }}
                >
                  {statusIcons[offer.status as keyof typeof statusIcons]}
                  {statusTexts[offer.status as keyof typeof statusTexts]}
                </span>
                <span className='text-[#6C6C6C80] text-sm'>
                  {moment(offer.createdAt).format('hh:mmA, DD MMM, YYYY')}
                </span>
              </div>
              <OfferDropdown offer={offer} handleRemove={handleRemove} />
            </div>
            <div className='flex xs:flex-row flex-col justify-between gap-4 xs:items-center'>
              <div className='flex items-center gap-2'>
                <Image
                  unoptimized
                  src={offer.pro.personalInfo.image}
                  alt={offer.pro.personalInfo.firstName}
                  width={58}
                  height={58}
                  className='w-12 h-12 sm:size-[58px] rounded-full object-cover'
                />
                <div>
                  <h2 className='text-base sm:text-lg text-tertiary inline-flex items-center gap-2 sm:pb-1 font-semibold'>
                    {offer.pro.personalInfo.firstName}{' '}
                    {offer.pro.personalInfo.lastName}{' '}
                  </h2>
                  <p className='text-muted-foreground text-xs sm:text-sm flex items-center gap-1.5'>
                    <MapPin className='size-4' />{' '}
                    {offer.pro.personalInfo.address.city} ,{' '}
                    {offer.pro.personalInfo.address.state} ,{' '}
                    {offer.pro.personalInfo.address.country}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <Button
                  href={`/partner/pros/${offer.pro._id}`}
                  variant='outline'
                  className='h-10 md:h-12 rounded-[12px] w-fit text-xs md:text-base'
                >
                  View Profile
                  <MoveUpRight className='size-4 ml-2' />
                </Button>
              </div>
            </div>

            {offer.pro.personalInfo.bio && (
              <p
                className='text-sm md:text-base text-muted-foreground truncate'
                dangerouslySetInnerHTML={{
                  __html: offer.pro.personalInfo.bio,
                }}
              />
            )}

            <div className='flex flex-wrap gap-3 items-center'>
              {offer.pro.professionalInfo.skills
                .slice(0, 3)
                .map((skill: any, index: any) => (
                  <Button
                    key={index}
                    className='bg-accent text-tertiary text-xs md:text-sm h-7 md:h-9'
                    variant='ghost'
                  >
                    {skill}
                  </Button>
                ))}
              {offer.pro.professionalInfo.skills.length > 3 && (
                <span className='text-xs md:text-sm text-tertiary'>
                  +{offer.pro.professionalInfo.skills.length - 3} more
                </span>
              )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 w-auto'>
              <div className='flex flex-col gap-2'>
                <p className='text-muted-foreground text-sm'>Email address</p>
                <p className='text-tertiary font-medium text-sm md:text-base'>
                  {offer.pro.email}
                </p>
              </div>
              <div className='flex flex-col gap-2'>
                <p className='text-muted-foreground text-sm'>Phone number</p>
                <p className='text-tertiary font-medium text-sm md:text-base'>
                  {offer.pro.personalInfo.phone || 'N/A'}
                </p>
              </div>
            </div>

            {(offer.jobLink ||
              offer.documentsNeeded?.length > 0 ||
              offer.notes) && (
              <div className='flex flex-col gap-3'>
                <div className='flex gap-4 items-center text-base'>
                  <p className=' text-tertiary flex items-center gap-2'>
                    <FileText className='w-6 h-6 text-muted-foreground' />
                    Requirements:
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
                <ul className='flex flex-col gap-2 text-xs sm:text-sm text-tertiary font-medium border border-[#DFE2E0] p-4 rounded-[12px] w-full'>
                  <p className='flex items-center gap-2 text-xs'>
                    <LinkIcon className='text-gray-500 size-5' /> Job link
                  </p>
                  <Button
                    href={offer.jobLink}
                    target='_blank'
                    variant='special'
                    className='bg-[#F9F9FA] p-3 rounded-[12px] text-[#33B55B] text-xs'
                  >
                    <span>{offer.jobLink}</span>
                  </Button>
                  {offer.documentsNeeded?.map((requirement: any, idx: any) => (
                    <li
                      key={idx}
                      className='flex items-center gap-2 list-disc list-inside'
                    >
                      <Check
                        className={cn(
                          'size-4 text-[#DFE2E0]',
                          requirement?.status === 'uploaded' && 'text-primary'
                        )}
                      />
                      {requirement.title}
                      {requirement.url && (
                        <Link
                          href={requirement.url || ''}
                          target='_blank'
                          className='text-primary'
                        >
                          <Link2 className='size-4' />
                        </Link>
                      )}
                    </li>
                  ))}
                  {offer.documentsNeeded.length > 0 && (
                    <div className='flex gap-2 max-w-[500px] w-full'>
                      {offer.status !== 'rejected' &&
                        offer.status !== 'accepted' && (
                          <Button
                            onClick={() => openPartner(offer)}
                            variant='outline'
                            className='border border-primary py-2 px-4 rounded-[12px] w-full h-9'
                          >
                            <RotateCw className='size-3 md:size-4 mr-1' />
                            Update Requirements
                          </Button>
                        )}
                      {Object.keys(offer.documentsNeeded).some(
                        (key) =>
                          offer.documentsNeeded[key].status === 'uploaded'
                      ) && (
                        <Button
                          onClick={() => handleDownloadAll(offer._id)}
                          variant='outline'
                          className='border border-primary py-2 px-4 rounded-[12px] w-full h-9'
                        >
                          <Download className='size-3 md:size-4 mr-1' />
                          Download All
                        </Button>
                      )}
                      {offer.status !== 'rejected' &&
                        offer.status !== 'accepted' && (
                          <Button
                            onClick={() => handleConfirm(offer)}
                            className='py-2 px-4 rounded-[12px] w-full h-9'
                            disabled={isLoading}
                          >
                            {isLoading ? 'Confirming...' : 'Confirm'}
                          </Button>
                        )}
                    </div>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PartnerOffers;
