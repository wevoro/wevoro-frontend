'use client';
import EditBtn from '@/components/global/dashboard/edit-btn';
import Title from '@/components/global/title';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/lib/context';
import { cn } from '@/lib/utils';
import {
  BriefcaseBusiness,
  GraduationCap,
  IdCard,
  Link,
  Link2,
  MoveUpRight,
} from 'lucide-react';
import moment from 'moment';
import NoData from '../no-data';
import SectionDescription from '../section-description';
import { useUserContext } from '@/lib/contexts';

export default function ProfessionalInformation({
  proUser,
  from,
}: {
  proUser?: any;
  from?: string;
}) {
  const { user } = useUserContext();
  const userData = proUser ? proUser : user;
  const education = userData?.professionalInfo?.education;
  const experience = userData?.professionalInfo?.experience;
  const certifications = userData?.professionalInfo?.certifications;

  const noData = !education && !experience && !certifications;

  return (
    <div
      className={cn(
        'bg-white md:rounded-[16px]',
        from === 'admin' ? 'p-0' : 'px-4 p-6 md:p-8 '
      )}
    >
      <div className='flex items-center justify-between border-b pb-4 mb-8'>
        <Title
          text='Professional information'
          className='mb-0 !text-lg md:!text-2xl'
        />
        {from !== 'admin' && (
          <EditBtn href={`/pro/edit/professional-information?edit=true`} />
        )}
      </div>

      {!noData ? (
        <div className='space-y-6'>
          {education?.length > 0 && education[0]?.institution && (
            <div className='border-b pb-6 flex flex-col gap-5 w-full'>
              <SectionTitle
                text='Education'
                className='!text-lg md:!text-2xl'
              />
              {education?.map((item: any, index: number) => (
                <EducationItem key={index} {...item} />
              ))}
            </div>
          )}
          {experience?.length > 0 && experience[0]?.jobTitle && (
            <div className='border-b pb-6 flex flex-col gap-5'>
              <SectionTitle
                text='Experience'
                className='!text-lg md:!text-2xl'
              />
              {experience?.map((item: any, index: number) => (
                <ExperienceItem key={index} {...item} image='/exp1.svg' />
              ))}
            </div>
          )}
          {certifications && (
            <div className='flex flex-col gap-5'>
              <SectionTitle
                text='Licenses & certifications'
                className='!text-lg md:!text-2xl'
              />
              {certifications?.map((item: any, index: number) => (
                <CertificationItem key={index} {...item} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <NoData />
      )}
    </div>
  );
}

const EducationItem = ({
  degree,
  fieldOfStudy,
  yearOfGraduation,
  grade,
  institution,
}: {
  degree: string;
  fieldOfStudy: string;
  yearOfGraduation: string;
  grade: string;
  institution: string;
}) => {
  return (
    <div className='flex items-start gap-4 md:gap-6'>
      <GraduationCap className='w-12 h-12 md:w-14 md:h-14 text-gray-700' />
      {/* <img
        src='/education.svg'
        alt='Education'
        className='size-16 md:size-20'
      /> */}
      <div className='flex flex-col gap-3 md:gap-6 w-full'>
        <div className='flex flex-col gap-1 md:gap-2'>
          {degree && (
            <SectionTitle
              className='font-semibold !text-base md:!text-2xl'
              text={degree}
            />
          )}
          {institution && (
            <SectionDescription
              text={institution}
              className='!text-sm md:!text-lg'
            />
          )}
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 w-full'>
          {yearOfGraduation && (
            <div className='flex flex-col  gap-1.5 md:gap-2.5'>
              <SectionTitle
                text='Year of Graduation'
                className='text-sm md:!text-base font-medium'
              />
              <SectionDescription text={yearOfGraduation} />
            </div>
          )}
          {fieldOfStudy && (
            <div className='flex flex-col  gap-1.5 md:gap-2.5'>
              <SectionTitle
                text='Field of Study'
                className='text-sm md:!text-base font-medium'
              />
              <SectionDescription text={fieldOfStudy} />
            </div>
          )}
          {grade && (
            <div className='flex flex-col  gap-1.5 md:gap-2.5'>
              <SectionTitle
                text='Grade'
                className='text-sm md:!text-base font-medium'
              />
              <SectionDescription text={grade} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const CertificationItem = ({
  certificateFile,
  credentialId,
  credentialUrl,
  expireDate,
  institution,
  issueDate,
  title,
}: any) => {
  return (
    <div className='flex items-start gap-4 md:gap-6'>
      <IdCard className='w-12 h-12 md:w-14 md:h-14 text-gray-700 shrink-0' />

      <div className='flex flex-col gap-1 md:gap-2'>
        <div className='flex items-center gap-2'>
          <SectionTitle
            className='font-semibold !text-base md:!text-2xl'
            text={title}
          />
          {credentialUrl && (
            <Button target='_blank' href={credentialUrl} variant='special'>
              <Link className='size-4 mr-2' />
            </Button>
          )}
        </div>
        <SectionDescription
          text={institution}
          className='!text-sm md:!text-lg font-medium'
        />
        <div className='grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-6'>
          <SectionDescription
            text={`Issue Date: ${moment(issueDate).format('MMM DD, YYYY')}`}
            className='!text-sm md:!text-base text-[#595959] font-normal'
          />
          {expireDate && (
            <SectionDescription
              text={`Expire Date: ${moment(expireDate).format('MMM DD, YYYY')}`}
              className='!text-sm md:!text-base text-[#595959] font-normal'
            />
          )}
        </div>
        <SectionDescription
          text={`Credential ID: ${credentialId}`}
          className='!text-sm md:!text-base text-[#595959] font-normal'
        />
        {certificateFile && (
          <Button
            onClick={() => window.open(certificateFile, '_blank')}
            variant='outline'
            className='h-10 md:h-12 rounded-[12px] w-fit mt-4 text-xs md:text-base'
          >
            View Credential
            <MoveUpRight className='size-4 ml-2' />
          </Button>
        )}
      </div>
    </div>
  );
};

const SectionTitle = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        'text-xl md:text-2xl font-medium text-[#1C1C1C]',
        className
      )}
    >
      {text}
    </h3>
  );
};

// const SectionDescription = ({
//   text,
//   className,
// }: {
//   text: string;
//   className?: string;
// }) => {
//   return (
//     <p
//       className={cn('text-sm md:text-xl text-[#1C1C1C] font-medium', className)}
//     >
//       {text}
//     </p>
//   );
// };
const ExperienceItem = ({
  jobTitle,
  companyName,
  duration,
  responsibilities,
  image,
}: any) => {
  return (
    <div className='flex items-start gap-4 md:gap-6 '>
      <BriefcaseBusiness className='w-10 h-10 md:w-14 md:h-14 text-gray-700 shrink-0' />
      {/* <img src={image} alt={jobTitle} className='size-16 md:size-20' /> */}
      <div className='flex flex-col gap-1 md:gap-2'>
        {jobTitle && (
          <SectionTitle
            text={jobTitle}
            className='font-semibold !text-base md:!text-2xl'
          />
        )}
        {companyName && (
          <SectionDescription
            text={companyName}
            className='!text-sm md:!text-lg font-medium'
          />
        )}
        {duration && (
          <SectionDescription
            text={duration}
            className='!text-sm md:!text-base text-[#595959] font-normal'
          />
        )}

        {responsibilities && (
          <SectionDescription text={responsibilities} className='mt-4' />
        )}
      </div>
    </div>
  );
};
