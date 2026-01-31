'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import ProfileInfo from './profile-info';
import Tabs from './tabs';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import Back from '../back';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/app/actions';
import { useUIContext, useUserContext } from '@/lib/contexts';
import { OfferRequestModal } from './offer-request-modal';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useUserContext();
  const { openPartner } = useUIContext();
  const pathname = usePathname();
  const { id } = useParams();

  const searchParams = useSearchParams();
  const shouldStorePro = searchParams.get('s') === 'true';
  const effectRan = useRef(false);
  useEffect(() => {
    if (effectRan.current === false) {
      if (shouldStorePro && id) {
        const storePro = async () => {
          try {
            const response = await fetch('/api/user/store-pro', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pro: id }),
            });

            const responseData: any = await response.json();

            if (responseData.status === 200) {
              console.log('Pro stored successfully!');
            } else if (
              responseData.status === 500 ||
              responseData.status === 400
            ) {
              console.log('Pro store failed!');
            }
          } catch (error) {
            console.error('Error storing Pro:', error);
          }
        };

        storePro();
      }

      effectRan.current = true; // Mark effect as executed
    }
  }, [shouldStorePro, id]);

  const isProProfileFromPartner =
    pathname.includes('partner/pros/') && id ? true : false;

  const isPublicProPage = pathname.includes('pro/') && id ? true : false;

  const isPartnerFromPro =
    pathname.includes('pro/partner/') && id ? true : false;

  const { data: userById, isLoading } = useQuery({
    queryKey: [`userById`, id],
    queryFn: async () => await getUserById(id as string),
    enabled: !!id,
  });

  return (
    <div
      className={cn(
        'flex flex-col gap-6 max-w-screen-xl mx-auto pt-[70px] md:pt-[150px] pb-8 md:pb-16 px-0 md:px-8 2xl:px-0',
        (isProProfileFromPartner || isPublicProPage) &&
          'pt-[90px] md:pt-[120px] lg:pt-[150px]',
      )}
    >
      {(isProProfileFromPartner || isPublicProPage) && (
        <div className='flex items-center justify-between px-4 md:px-0'>
          {!isPublicProPage || isPartnerFromPro ? (
            <Back disabled={isPublicProPage && !isPartnerFromPro} />
          ) : (
            <div />
          )}

          <div className='flex items-center gap-4'>
            {user?.role === 'partner' && (
              <OfferRequestModal proUser={userById}>
                <Button
                  className='h-12 md:h-14 rounded-[12px] text-sm md:text-lg px-12'
                  // onClick={openPartner}
                  disabled={isPublicProPage}
                >
                  Send Offer
                </Button>
              </OfferRequestModal>
            )}
          </div>
        </div>
      )}

      <ProfileInfo
        isPartnerFromPro={isPartnerFromPro}
        isProProfileFromPartner={isProProfileFromPartner}
        isPublicProPage={isPublicProPage}
        userById={userById}
        isLoading={isLoading}
        id={id as string}
      />
      {!isProProfileFromPartner && !isPublicProPage && <Tabs />}
      <div>{children}</div>
    </div>
  );
};

export default DashboardLayout;
