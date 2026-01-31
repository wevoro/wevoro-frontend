'use client';

import { useDocuments } from '@/app/apiHooks/useDocuments';
import { useUserContext } from '@/lib/contexts';

import { cn } from '@/lib/utils';
import { IdCard, User, FileText, Check } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Steps = ({
  source,
  isEdit,
}: {
  source: 'partner' | 'pro';
  isEdit?: boolean;
}) => {
  const pathname = usePathname();

  const { user, isPersonalInfoCompleted, isProfessionalInfoCompleted } =
    useUserContext();
  const { data: documents } = useDocuments();
  const isDocumentUploadCompleted = documents?.length! > 0;

  // console.log({ user });

  const isEditPersonalInfo = pathname.includes('edit/personal-information');
  const isEditProfessionalInfo = pathname.includes(
    'edit/professional-information',
  );

  const updatedAt = isEditPersonalInfo
    ? user?.personalInfo?.updatedAt
    : isEditProfessionalInfo
      ? user?.professionalInfo?.updatedAt
      : null;

  const proSteps = [
    {
      id: 1,
      name: 'Personal Information',
      icon: <User className='h-[18px] w-[18px]' />,
      link: '/pro/onboard/personal-info',
      completed: isPersonalInfoCompleted,
    },
    {
      id: 2,
      name: 'Professional Information',
      icon: <IdCard className='h-[18px] w-[18px]' />,
      link: '/pro/onboard/professional-info',
      completed: isProfessionalInfoCompleted,
      disabled: !isPersonalInfoCompleted,
    },
    {
      id: 3,
      name: 'Document Upload',
      icon: <FileText className='h-[18px] w-[18px]' />,
      link: '/pro/onboard/document-upload',
      completed: isDocumentUploadCompleted,
      disabled: !isProfessionalInfoCompleted || !isPersonalInfoCompleted,
    },
  ];
  const partnerSteps = [
    {
      id: 1,
      name: 'Personal Information',
      icon: <User className='h-[18px] w-[18px]' />,
      link: '/partner/onboard/personal-info',
      completed: isPersonalInfoCompleted,
      disabled: false,
    },
  ];

  const steps = source === 'pro' ? proSteps : partnerSteps;

  const label = isEditPersonalInfo
    ? 'Personal Information'
    : isEditProfessionalInfo
      ? 'Professional Information'
      : 'Personal Information';

  return (
    <ul className='space-y-6 list-none pl-0'>
      {isEdit ? (
        <>
          <li className='flex items-center'>
            <div className={cn('flex items-center')}>
              <div
                className={cn(
                  'h-10 w-10 mr-3 rounded-full border flex items-center justify-center border-[#33B55B] text-[#33B55B]',
                )}
              >
                <User className='h-[18px] w-[18px]' />
              </div>
              <div className='flex flex-col gap-[10px]'>
                <p className='text-lg font-medium'>{label}</p>

                {updatedAt && (
                  <p className='text-sm font-medium text-muted-foreground'>
                    Last updated{' '}
                    <span className='text-tertiary'>
                      {moment(updatedAt).format('h:mm a, d MMM yyyy')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </li>
        </>
      ) : (
        <>
          {steps.map((step) => {
            const isActive = pathname === step.link || step.completed;
            return (
              <li key={step.id} className='flex items-center'>
                <Link
                  href={step.link}
                  className={cn(
                    'flex items-center',
                    isActive ? 'text-tertiary' : 'text-[#8d8d8d]',
                    step.disabled && 'cursor-not-allowed',
                  )}
                  onClick={(e) => {
                    if (step.disabled) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  <div
                    className={cn(
                      'h-10 w-10 mr-3 rounded-full border flex items-center justify-center',
                      isActive
                        ? 'border-[#33B55B] text-[#33B55B]'
                        : 'border-[#8e8e8e] text-[#8e8e8e]',
                      step.completed && 'bg-[#33B55B] text-white',
                    )}
                  >
                    {step.completed ? (
                      <Check className='h-[18px] w-[18px]' />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className='flex flex-col gap-[10px]'>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-muted-foreground' : 'text-[#b6b6b6]',
                      )}
                    >
                      Step - {step.id}
                    </span>
                    <p className='text-lg font-medium'>{step.name}</p>
                    {isActive && (
                      <span className='text-sm font-medium text-[#33B55B]'>
                        {step.completed ? 'Completed' : 'In progress'}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </>
      )}
    </ul>
  );
};

export default Steps;
