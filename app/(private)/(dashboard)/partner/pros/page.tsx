import { getPros } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { FileText, Heart, MapPin, MoveUpRight, X } from 'lucide-react';
import React from 'react';

const PartnerPros = async () => {
  const pros = await getPros();

  return (
    <div className='flex flex-col gap-8'>
      {pros?.map((pro: any, index: number) => (
        <div key={index} className='px-4 p-6 md:p-8 bg-white md:rounded-[16px]'>
          <div className='flex flex-col gap-4 w-full'>
            <div className='flex xs:flex-row flex-col justify-between gap-4 xs:items-center'>
              <div className='flex items-center gap-2'>
                <img
                  src={pro?.personalInfo?.image || '/dummy-profile-pic.png'}
                  alt={pro?.personalInfo?.name}
                  width={58}
                  height={58}
                  className='w-12 h-12 sm:size-[58px] rounded-full object-cover'
                />
                <div>
                  <h2 className='text-base sm:text-lg text-[#1C1C1C] inline-flex items-center gap-2 sm:pb-1 font-semibold'>
                    {pro?.personalInfo?.firstName} {pro?.personalInfo?.lastName}
                  </h2>
                  <p className='text-[#6C6C6C] text-xs sm:text-sm flex items-center gap-1.5'>
                    <MapPin className='size-4' />{' '}
                    {pro?.personalInfo?.address?.city &&
                      `${pro.personalInfo.address.city}, `}
                    {pro?.personalInfo?.address?.state &&
                      `${pro.personalInfo.address.state}, `}
                    {pro?.personalInfo?.address?.street &&
                      `${pro.personalInfo.address.street}, `}
                    {pro?.personalInfo?.address?.zipCode &&
                      `${pro.personalInfo.address.zipCode}, `}
                    {pro?.personalInfo?.address?.country}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <Button
                  href={`/partner/pros/${pro._id}`}
                  variant='outline'
                  className='h-10 md:h-12 rounded-[12px] w-fit text-xs md:text-base'
                >
                  View Profile
                  <MoveUpRight className='size-4 ml-2' />
                </Button>
                {/* <Button
                  variant='ghost'
                  size='icon'
                  className='h-10 md:h-12 rounded-[8px] p-3 w-fit text-xs md:text-base bg-accent'
                >
                  <Heart className='size-6 text-secondary fill-secondary' />
                </Button> */}
              </div>
            </div>

            <p
              className='text-sm md:text-base text-[#6C6C6C]'
              dangerouslySetInnerHTML={{
                __html: pro?.personalInfo?.bio,
              }}
            />

            <div className='flex flex-wrap gap-3 items-center'>
              {pro?.professionalInfo?.skills
                ?.slice(0, 12)
                .map((skill: string, index: number) => (
                  <Button
                    key={index}
                    className='bg-accent text-[#1C1C1C] text-xs md:text-sm h-7 md:h-9'
                    variant='ghost'
                  >
                    {skill}
                  </Button>
                ))}
              {pro?.professionalInfo?.skills?.length > 12 && (
                <span className='text-xs md:text-sm text-[#1C1C1C]'>
                  +{pro?.professionalInfo?.skills?.length - 12} more
                </span>
              )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 w-auto'>
              <div className='flex flex-col gap-2'>
                <p className='text-[#6C6C6C] text-sm'>Email address</p>
                <p className='text-[#1C1C1C] font-medium text-sm md:text-base'>
                  {pro?.email}
                </p>
              </div>
              <div className='flex flex-col gap-2'>
                <p className='text-[#6C6C6C] text-sm'>Phone number</p>
                <p className='text-[#1C1C1C] font-medium text-sm md:text-base'>
                  {pro?.personalInfo?.phone || 'N/A'}
                </p>
              </div>
            </div>

            {pro.requirements && (
              <div className='flex flex-col gap-3'>
                <p className='text-base text-[#1C1C1C] flex items-center gap-2'>
                  <FileText className='w-6 h-6 text-[#6C6C6C]' />
                  Requirements
                </p>
                <ul className='flex flex-wrap justify-between text-xs sm:text-sm text-[#1C1C1C] font-medium border border-[#DFE2E0] py-2 sm:px-4 sm:p-3 rounded-[12px] w-auto sm:w-max'>
                  {pro?.requirements?.map(
                    (requirement: string, idx: number) => (
                      <li
                        key={idx}
                        className='text-start sm:text-center px-6 list-disc list-inside w-max'
                      >
                        {requirement}
                      </li>
                    )
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

export default PartnerPros;
