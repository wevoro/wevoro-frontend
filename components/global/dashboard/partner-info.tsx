import React from 'react';
import ProfileName from './profile-name';
import { CircleHelp, Crown, Star } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

const PartnerInfo = ({
  user,
  isPartnerFromPro,
}: {
  user: any;
  isPartnerFromPro: boolean;
}) => {
  const personalInfo = user?.personalInfo;

  const name =
    personalInfo?.firstName && personalInfo?.lastName
      ? `${personalInfo?.firstName} ${personalInfo?.lastName}`
      : 'N/A';
  const companyName = personalInfo?.companyName;
  return (
    <div className='flex flex-col gap-2 sm:gap-3 w-full'>
      <div className='flex justify-between lg:flex-row flex-col sm:gap-6 gap-3'>
        <div className='flex flex-col gap-2'>
          <ProfileName name={name} hasPersonalInfo={!!personalInfo?.firstName} status={user?.status} />
          <p className='text-base sm:text-xl text-[#3A4742] font-medium'>
            {companyName}
          </p>
          {user?.status !== 'approved' && !isPartnerFromPro && (
            <Button
              variant='outline'
              className='w-fit h-9 rounded-lg text-sm font-medium border-[#FAB607] text-[#FAB607] hover:bg-[#FAB607]/10 hover:text-[#FAB607] inline-flex items-center gap-2 mt-1'
              onClick={() => window.open('/partner/upgrade', '_self')}
            >
              <Crown className='size-4' />
              Upgrade to Plus
            </Button>
          )}
          {user?.completionPercentage && (
            <div className='flex items-start sm:items-center sm:flex-row flex-col'>
              <span className='text-sm text-[#6d6d6d] mr-6'>
                Profile Completion
              </span>
              <div className='flex items-center'>
                <div className='w-[185px] h-2 bg-[#FAFAFA] rounded-full overflow-hidden'>
                  <div
                    className='h-full'
                    style={{
                      width: `${user?.completionPercentage}%`,
                      background:
                        'linear-gradient(90deg, #33B55B 0%, #008000 100%)',
                    }}
                  ></div>
                </div>
                <span className='text-sm text-[#3A4742] font-medium ml-2'>
                  {user?.completionPercentage}%
                </span>
              </div>
            </div>
          )}
        </div>
        {!isPartnerFromPro && (
          <Tracks
            offersSent={user?.offersSent}
            jobConversionPercentage={user?.jobConversionPercentage}
          />
        )}
      </div>
    </div>
  );
};

export default PartnerInfo;

const Tracks = ({
  offersSent,
  jobConversionPercentage,
}: {
  offersSent: number;
  jobConversionPercentage: number;
}) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
      <div className='flex flex-col gap-1'>
        <p className='text-[#6C6C6C] text-sm md:text-base flex items-center gap-2'>
          Offers Sent{' '}
          <Star className='size-5 fill-[#FAB607] stroke-[#FAB607]' />
        </p>
        <p className='text-[#1C1C1C] font-medium text-lg md:text-2xl'>
          {offersSent}
        </p>
      </div>
      <div className='flex flex-col gap-1'>
        <p className='text-[#6C6C6C] text-sm md:text-base flex items-center gap-2'>
          Jobs Conversion{' '}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className='size-5 cursor-help' />
              </TooltipTrigger>
              <TooltipContent>
                <p className='max-w-[200px] text-xs'>
                  Percentage of sent offers that were accepted by professionals.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
        <p className='text-[#1C1C1C] font-medium text-lg md:text-2xl'>
          {jobConversionPercentage}%
        </p>
      </div>
    </div>
  );
};
