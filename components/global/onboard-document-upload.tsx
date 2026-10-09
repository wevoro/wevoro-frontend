'use client';

import React, { forwardRef } from 'react';
import Title from '@/components/global/title';
import OnboardButton from '@/components/global/onboard-button';
import { Check } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import UploadDocumentModal from './dashboard/upload-document-modal';
import OnboardCredentialRow from './onboard-credential-row';
import { useDocuments } from '@/app/apiHooks/useDocuments';
import { Button } from '../ui/button';
import { CloudUpload } from 'lucide-react';
import { useUserContext } from '@/lib/contexts';
import { MAX_UPLOAD_MB } from '@/utils/download';
import {
  REQUIRED_CREDENTIALS as REQUIRED_CREDENTIALS_BASE,
  getCredentialLabel,
  isPrimaryCredentialRow,
  isSignoffRow,
  PCA_EXAM,
  PCA_SIGNOFF,
  CNA_CERTIFICATE_LABEL,
  type CertificatePart,
} from '@/lib/credential-config';

// SCRUM-97: the hint states what the validator (isValidFileType /
// isValidFileSize) really accepts. The medical rows used to advertise "doc",
// which the upload then refused.
const FILE_HINT = `jpeg, png, pdf formats, up to ${MAX_UPLOAD_MB}MB.`;

// SCRUM-176: one rule for "which row IS this credential". Every other resolver
// keys by type in a forEach — including this component's own non-onboarding
// branch below — so the LAST matching row stands for the credential. The
// onboarding branch took the first, so a caregiver who re-uploaded the
// certificate during onboarding saw the replaced row's state on this step
// while the profile card and the share gate read the new one. The predicate
// keeps isPrimaryCredentialRow, so SCRUM-165 still keeps the PCA sign-off from
// standing in for the certificate.
const lastPrimaryRow = (docs: any[], documentType: string) => {
  for (let i = docs.length - 1; i >= 0; i -= 1) {
    const d = docs[i];
    if (d?.documentType === documentType && isPrimaryCredentialRow(d)) return d;
  }
  return undefined;
};

const OnboardDocumentUpload = forwardRef(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: documents } = useDocuments();
  const { user } = useUserContext();
  const role = user?.professionalInfo?.role;

  // SCRUM-152: the Figma step 3 only exists in onboarding. The same component
  // is rendered by the admin edit-user modal and /caregiver/edit/documents,
  // which keep the five-credential layout below.
  const onboarding = !!pathname?.startsWith('/caregiver/onboard');

  if (onboarding) {
    const docs: any[] = documents ?? [];
    const certificate = REQUIRED_CREDENTIALS_BASE.find(
      (c) => c.key === 'certifications',
    )!;
    // SCRUM-165: the sign-off is the certificate's second half; the exam (or a
    // certificate uploaded before the split) is the primary row.
    const primaryDoc = lastPrimaryRow(docs, 'certifications');
    const signoffDoc = docs.find((d) => isSignoffRow(d));

    // SCRUM-152: Faisal's frames "5. Onboarding Page - Documant Upload - PCA /
    // - CNA" show only the role certificate here. PCA follows the frame's order
    // (sign-off first, then the written exam); the other four credentials stay
    // on the floating box, the Completing Profile window and the profile.
    const slots: {
      key: string;
      label: string;
      part?: CertificatePart;
      document?: any;
      tooltip?: { title: string; body: string };
      showHelpIcon?: boolean;
    }[] =
      role === 'PCA'
        ? [
            {
              key: 'certifications_signoff',
              label: PCA_SIGNOFF.label,
              part: PCA_SIGNOFF.part,
              document: signoffDoc,
              tooltip: {
                title: PCA_SIGNOFF.tooltipTitle,
                body: PCA_SIGNOFF.tooltip,
              },
            },
            {
              key: 'certifications',
              label: PCA_EXAM.label,
              part: PCA_EXAM.part,
              document: primaryDoc,
              showHelpIcon: true,
            },
          ]
        : [
            {
              key: 'certifications',
              label:
                // Figma "… - CNA": the one certificate card, also while no role is set.
                role === 'PCA' ? getCredentialLabel(certificate, role) : CNA_CERTIFICATE_LABEL,
              document: primaryDoc,
            },
          ];

    const cards = slots.map((slot) => (
      <OnboardCredentialRow
        key={slot.key}
        label={slot.label}
        part={slot.part}
        showHelpIcon={slot.showHelpIcon}
        document={slot.document}
        tooltip={slot.tooltip}
      />
    ));

    return (
      <div className='flex flex-col gap-8'>
        <div className='flex sm:flex-row flex-col gap-4 justify-between sm:items-center'>
          <h1 className='text-xl md:text-2xl font-semibold leading-[33px] text-tertiary'>
            Credentials
          </h1>
          <OnboardButton
            text='Skip for now'
            className='sm:w-[162px] px-5 bg-transparent text-[#3A4742] border border-[#3A4742] hover:text-white'
            href='/caregiver/profile'
          />
        </div>

        <div className='flex flex-col gap-4'>
          {/* SCRUM-165: for a PCA the sign-off and the written exam are the two
              halves of one credential, so they sit inside a single bordered
              group under a "PCA Certifications" label instead of reading as two
              separate credentials. Grouping is presentation only — each card
              keeps its own part, its own Upload and its own progress bar, and
              the sign-off is still not one of the five required credentials.
              A CNA has one slot and no group: the plain card, exactly as
              before. */}
          {role === 'PCA' ? (
            <div className='flex flex-col gap-4 rounded-2xl border border-[#DFE2E0] p-3 sm:p-4'>
              <p className='text-sm font-semibold text-tertiary'>PCA Certifications</p>
              {cards}
            </div>
          ) : (
            cards
          )}
        </div>

        <div className='flex items-center gap-5'>
          <OnboardButton
            text='Previous'
            className='w-full bg-white text-tertiary border border-tertiary hover:text-white'
            onClick={() => router.back()}
          />
          <OnboardButton
            text='Complete'
            className='w-full'
            href='/caregiver/onboard/completed'
          />
          <span className='ml-auto hidden sm:inline-flex items-center gap-1.5 text-sm text-tertiary'><img src='/info.svg' alt='' className='size-4' /> Need help?</span>
        </div>
      </div>
    );
  }

  // SCRUM-60: 5 required credentials with role-driven label for the certificate row.
  const credentialSlots = REQUIRED_CREDENTIALS_BASE.map((c) => {
    const label = getCredentialLabel(c, role);
    return {
      key: c.key,
      label,
      category: c.category,
      documentType: c.documentType,
      defaultTitle: label,
      // SCRUM-97: both hints previously understated the real cap (enforced by
      // isValidFileSize), which is what pushed caregivers into uploading
      // screenshots instead of photos of their credentials.
      hint: FILE_HINT,
    };
  });

  const uploadedByType: Record<string, any> = {};
  (documents ?? []).forEach((doc: any) => {
    // SCRUM-165: the RN/LPN sign-off is not the certificate. Keyed by type
    // alone it could stand in for the certificate on this row.
    if (!isPrimaryCredentialRow(doc)) return;
    uploadedByType[doc.documentType] = doc;
  });

  return (
    <div>
      <div className='flex sm:flex-row flex-col gap-4 justify-between sm:items-center mb-8'>
        <Title text='Credentials' className='mb-0' />
        <OnboardButton
          text='Skip for now'
          className='sm:w-max bg-transparent text-tertiary border border-gray-300 hover:text-white'
          href='/caregiver/profile'
        />
      </div>

      <div className='flex flex-col gap-4'>
        {credentialSlots.map((slot) => {
          const uploaded = uploadedByType[slot.documentType];
          const isUploaded = !!uploaded;

          return (
            <div
              key={slot.key}
              className='flex sm:flex-row flex-col gap-4 sm:items-center justify-between px-7 py-5 bg-white rounded-2xl'
            >
              <div className='flex items-center gap-4'>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isUploaded ? 'bg-primary' : 'bg-gray-100'}`}
                >
                  <Check
                    className={`w-4 h-4 ${isUploaded ? 'text-white' : 'text-gray-400'}`}
                  />
                </div>
                <div>
                  <p className='font-semibold text-gray-900'>{slot.label}</p>
                  <p className='text-xs text-[#5E6864]'>{slot.hint}</p>
                </div>
              </div>

              <UploadDocumentModal
                category={slot.category}
                documentType={slot.documentType}
                defaultTitle={slot.defaultTitle}
                document={isUploaded ? uploaded : undefined}
              >
                <Button
                  variant='special'
                  className='cursor-pointer font-medium text-sm border border-primary h-10 flex items-center justify-center gap-2 rounded-lg px-4 text-primary sm:w-auto w-full'
                >
                  <CloudUpload className='w-5 h-5' />
                  Upload
                </Button>
              </UploadDocumentModal>
            </div>
          );
        })}

        <div className='flex gap-5 mt-4'>
          <OnboardButton
            text='Previous'
            className='w-full bg-white text-tertiary border border-gray-300 hover:text-white'
            onClick={() => router.back()}
          />
          <OnboardButton
            text='Complete'
            className='w-full'
            href='/caregiver/onboard/completed'
          />
        </div>
      </div>
    </div>
  );
});

OnboardDocumentUpload.displayName = 'OnboardDocumentUpload';

export default OnboardDocumentUpload;
