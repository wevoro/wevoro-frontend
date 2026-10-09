'use client';

import React, { ReactNode, useEffect, useRef, useState } from 'react';
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
import PartnerVerificationModal from './partner-verification-modal';
import { isCredentialingMode } from '@/lib/credentialing';
import OnboardActionBar from './onboard/onboard-action-bar';
import { isAgencyCaregiverPath, isCaregiverAgencyPath, isCaregiverPublicPath } from '@/lib/routes';

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

  // SCRUM-144: /agency/caregivers/:id, /caregiver/:id and
  // /caregiver/agencies/:id (were /partner/pros/:id, /pro/:id, /pro/partner/:id).
  const isProProfileFromPartner = isAgencyCaregiverPath(pathname) && !!id;

  const isPublicProPage = isCaregiverPublicPath(pathname) && !!id;

  const isPartnerFromPro = isCaregiverAgencyPath(pathname) && !!id;

  const { data: userById, isLoading } = useQuery({
    queryKey: [`userById`, id],
    queryFn: async () => await getUserById(id as string),
    enabled: !!id,
  });

  // SCRUM-141: an agency viewing a caregiver gets the Onboard action in the
  // Back row, and that row stays pinned under the fixed nav while the profile
  // scrolls. The nav's height changes with the breakpoint, so measure it.
  const showOnboardBar =
    isProProfileFromPartner && user?.role === 'partner' && isCredentialingMode();
  const [navHeight, setNavHeight] = useState(0);
  useEffect(() => {
    if (!showOnboardBar) return;
    const nav = document.querySelector('nav.fixed') as HTMLElement | null;
    if (!nav) return;
    const measure = () => setNavHeight(nav.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [showOnboardBar]);

  return (
    <div
      className={cn(
        'flex flex-col gap-6 max-w-screen-xl mx-auto pt-[70px] md:pt-[150px] pb-8 md:pb-16 px-0 md:px-8 2xl:px-0',
        (isProProfileFromPartner || isPublicProPage) &&
          'pt-[90px] md:pt-[120px] lg:pt-[150px]',
      )}
    >
      {(isProProfileFromPartner || isPublicProPage) && (
        <div
          className={cn(
            'flex items-center justify-between px-4 md:px-0',
            showOnboardBar &&
              'sticky z-40 -my-3 gap-3 bg-[#F9F9FA] py-3 md:-mx-8 md:px-8 2xl:mx-0 2xl:px-0'
          )}
          style={showOnboardBar ? { top: navHeight } : undefined}
          data-testid={showOnboardBar ? 'onboard-bar' : undefined}
        >
          {!isPublicProPage || isPartnerFromPro ? (
            <Back disabled={isPublicProPage && !isPartnerFromPro} />
          ) : (
            <div />
          )}

          <div className='flex items-center gap-4'>
            {showOnboardBar && id && (
              <OnboardActionBar caregiverId={id as string} caregiver={userById} />
            )}
            {/* SCRUM-87/88: the scheduling-era "Send Offer" flow is hidden in
                credentialing mode. Partners engage via share-link onboarding +
                the "Download Credential Package" button instead — a sent Offer
                would never surface in the pro's credentialing Offers tab. */}
            {user?.role === 'partner' &&
              user?.status === 'approved' &&
              !isCredentialingMode() && (
                <OfferRequestModal proUser={userById}>
                  <Button
                    className='h-12 md:h-14 rounded-[12px] text-sm md:text-lg px-12'
                    disabled={isPublicProPage}
                  >
                    Send Offer
                  </Button>
                </OfferRequestModal>
              )}
            {user?.role === 'partner' &&
              user?.status !== 'approved' &&
              !isPublicProPage &&
              !isCredentialingMode() && (
                <PartnerVerificationModal>
                  <Button
                    variant='outline'
                    className='h-12 md:h-14 rounded-[12px] text-sm md:text-lg px-8 border-primary text-primary hover:bg-primary/5'
                  >
                    Verify to Send Offers
                  </Button>
                </PartnerVerificationModal>
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
