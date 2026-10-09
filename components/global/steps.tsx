'use client';

import { isPrimaryCredentialRow, isSignoffRow } from '@/lib/credential-config';
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

  const { user, isPersonalInfoCompleted } = useUserContext();
  const { data: documents } = useDocuments();
  // SCRUM-152: step 3 now asks for the role certificate only, so it is done
  // when that is in — for a PCA both parts — not when any document exists.
  const isPcaRole = user?.professionalInfo?.role === 'PCA';
  const certRows = (documents ?? []).filter((d: any) => d?.documentType === 'certifications');
  const hasPrimaryCert = certRows.some((d: any) => isPrimaryCredentialRow(d));
  const hasSignoff = certRows.some((d: any) => isSignoffRow(d));
  const isDocumentUploadCompleted = isPcaRole ? hasPrimaryCert && hasSignoff : hasPrimaryCert;

  // SCRUM-152: step 1 now saves the Role into the professional information,
  // so "a professionalInfo record exists" (user-context) no longer means step
  // 2 was filled in — the sidebar showed "Completed" on a step the caregiver
  // had not opened yet. Step 2 counts as done only when it holds education,
  // experience or skills; the role alone does not.
  const hasValue = (v: unknown): boolean =>
    typeof v === 'number' ||
    (typeof v === 'string' && v.replace(/<[^>]*>/g, '').trim().length > 0);
  const hasFilledRow = (rows: unknown): boolean =>
    Array.isArray(rows) &&
    rows.some(
      (row) =>
        row &&
        typeof row === 'object' &&
        Object.entries(row).some(([k, v]) => k !== '_id' && hasValue(v)),
    );
  const professionalInfo = user?.professionalInfo;
  const savedSkills = professionalInfo?.skills;
  const isProfessionalStepCompleted =
    hasFilledRow(professionalInfo?.education) ||
    hasFilledRow(professionalInfo?.experience) ||
    (Array.isArray(savedSkills) && savedSkills.some(hasValue));

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

  // SCRUM-152 (Faisal's Figma): sentence-case step names in the sidebar.
  const proSteps = [
    {
      id: 1,
      name: 'Personal information',
      icon: <User className='h-[18px] w-[18px]' />,
      link: '/caregiver/onboard/personal-info',
      completed: isPersonalInfoCompleted,
    },
    {
      id: 2,
      name: 'Professional information',
      icon: <IdCard className='h-[18px] w-[18px]' />,
      link: '/caregiver/onboard/professional-info',
      completed: isProfessionalStepCompleted,
      disabled: !isPersonalInfoCompleted,
    },
    {
      id: 3,
      name: 'Credentials',
      icon: <FileText className='h-[18px] w-[18px]' />,
      link: '/caregiver/onboard/document-upload',
      completed: isDocumentUploadCompleted,
      // SCRUM-152: Professional Information can be skipped.
      disabled: !isPersonalInfoCompleted,
    },
  ];
  const partnerSteps = [
    {
      id: 1,
      name: 'Personal Information',
      icon: <User className='h-[18px] w-[18px]' />,
      link: '/agency/onboard/personal-info',
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
            // SCRUM-152 (Figma sidebar): a done step is a filled green circle
            // with a check and "Completed"; the current step a green outline
            // and "In progress"; a step still ahead is the whole item at 50%
            // opacity with a dark outline and no status line.
            // Figma 9: on the Completed page every step reads Completed.
            const isDone = !!step.completed || pathname.endsWith('/onboard/completed');
            const isCurrent = !isDone && pathname === step.link;
            const isFuture = !isDone && !isCurrent;
            return (
              <li key={step.id} className='flex items-center'>
                <Link
                  href={step.link}
                  className={cn(
                    'flex items-center text-tertiary',
                    isFuture && 'opacity-50',
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
                      isDone && 'border-[#33B55B] bg-[#33B55B] text-white',
                      isCurrent && 'border-[#33B55B] text-[#33B55B]',
                      isFuture && 'border-tertiary text-tertiary',
                    )}
                  >
                    {isDone ? <Check className='h-[18px] w-[18px]' /> : step.icon}
                  </div>
                  <div className='flex flex-col gap-[10px]'>
                    <span
                      className={cn(
                        'text-sm',
                        source === 'pro'
                          ? 'text-[#6C6C6C]'
                          : 'font-medium text-muted-foreground',
                      )}
                    >
                      Step - {step.id}
                    </span>
                    <p className='text-lg font-medium'>{step.name}</p>
                    {!isFuture && (
                      <span className='text-sm font-medium text-[#33B55B]'>
                        {isDone ? 'Completed' : 'In progress'}
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
