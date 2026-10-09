'use client';
import React, {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import Title from '@/components/global/title';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import OnboardButton from '@/components/global/onboard-button';
import { CloudUploadIcon, LinkIcon, Sparkles } from 'lucide-react';
import AddMore from '@/components/global/professional-info/add-more';
import Remove from '@/components/global/professional-info/remove';
import SkillsSelector from '@/components/global/professional-info/skills-selector';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { toast } from 'sonner';
import LoadingOverlay from '@/components/global/loading-overlay';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Editor from '../ui/editor';
import {
  useAdminContext,
  useOnboardContext,
  useUIContext,
  useUserContext,
} from '@/lib/contexts';
import { Button } from '../ui/button';
import { AutoFillAlert } from './dashboard/autofill-alert';
import { MAX_UPLOAD_MB } from '@/utils/download';

const OnboardProfessionalInfo = forwardRef((props: any) => {
  const { from, userFromAdmin, onClose } = props;

  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  /*
   * SCRUM-205: the profile's Skills card has its own Edit, and it used to open
   * this whole form — Role, Education, Experience and the deleted Licenses &
   * Certifications block — with Skills somewhere down the page. `section=skills`
   * narrows it to the one card the caregiver asked to edit. Any other entry
   * (the Professional information card's own Edit, the admin modal, onboarding)
   * passes nothing and is unchanged.
   */
  const section = searchParams.get('section');
  const skillsOnly = isEdit && section === 'skills';

  const { professionalInfoRef, extractedData, setExtractedData, takeDraft, setDraft } =
    useOnboardContext();
  const { user, refetchUser, isUserLoading } = useUserContext();
  // SCRUM-152: during onboarding this step is optional and shows only
  // Education and Experience (Faisal's Figma): the Role is asked on step 1,
  // and Skills and the Licenses & Certifications block are not part of it.
  // Next on an untouched form goes straight to the credentials step. The
  // profile edit form (?edit=true) and the admin modal are unchanged.
  const onboarding = !isEdit && !from;
  // console.log('🚀 ~ user:', Boolean({}));
  const { refetchUsers, refetchQaUsers } = useAdminContext();
  const { setOpenAutoFillModal } = useUIContext();
  const extractedProfessionalInfo = extractedData?.professionalInformation;
  // console.log('🚀 ~ extractedProfessionalInfo:', extractedProfessionalInfo);

  // SCRUM-153: the saved profile first; the AI resume data is applied once by
  // the effect below and consumed on save (see onSubmit).
  const savedInfo =
    from && userFromAdmin?.professionalInfo
      ? userFromAdmin?.professionalInfo
      : !from && user?.professionalInfo
        ? user?.professionalInfo
        : {};
  const userData = savedInfo;

  const { education, experience, certifications, skills, role } = userData;

  useEffect(() => {
    if (
      extractedProfessionalInfo &&
      Object.keys(extractedProfessionalInfo).length > 0
    ) {
      const pick = (v: any) => (Array.isArray(v) && v.length > 0 ? v : undefined);
      reset(
        {
          ...getValues(),
          education: pick(extractedProfessionalInfo.education) ?? getValues('education'),
          experience: pick(extractedProfessionalInfo.experience) ?? getValues('experience'),
          certifications:
            pick(extractedProfessionalInfo.certifications) ?? getValues('certifications'),
          skills: pick(extractedProfessionalInfo.skills) ?? getValues('skills'),
          // The reset used to drop the role the caregiver had already chosen.
          role: extractedProfessionalInfo.role || getValues('role'),
        },
        { keepDefaultValues: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedProfessionalInfo]);

  const processedCertifications = certifications?.map((certification: any) => {
    return {
      ...certification,
      issueDate: certification?.issueDate
        ? certification?.issueDate?.split('T')[0]
        : '',
      expireDate: certification?.expireDate
        ? certification?.expireDate?.split('T')[0]
        : '',
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    getValues,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      // A saved-but-empty list (step 1 saves the role, which creates the
      // record with education: [] and experience: []) still shows one blank
      // block, as in Figma — an empty array used to hide the section's fields.
      education: education?.length ? education : [
        {
          degree: '',
          institution: '',
          yearOfGraduation: '',
          fieldOfStudy: '',
          grade: '',
        },
      ],
      experience: experience?.length ? experience : [
        {
          jobTitle: '',
          companyName: '',
          duration: '',
          responsibilities: '',
        },
      ],
      certifications: processedCertifications || [
        {
          title: '',
          institution: '',
          issueDate: '',
          expireDate: '',
          credentialId: '',
          credentialUrl: '',
          certificateFile: null,
        },
      ],
      skills: skills || [],
      role: role || '',
    },
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control,
    name: 'education',
  });
  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: 'experience',
  });
  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({
    control,
    name: 'certifications',
  });

  // SCRUM-153: a draft left behind by Previous / Back wins over everything;
  // otherwise, the saved profile that may have arrived after this mounted.
  const draftRef = useRef<any>(onboarding ? takeDraft('professional') : null);
  const savedKey = JSON.stringify(savedInfo ?? {});
  useEffect(() => {
    if (draftRef.current) {
      reset(draftRef.current, { keepDefaultValues: true });
      draftRef.current = null;
      return;
    }
    if (extractedProfessionalInfo || isDirty) return;
    if (!savedInfo || Object.keys(savedInfo).length === 0) return;
    reset({
      education: education?.length ? education : getValues('education'),
      experience: experience?.length ? experience : getValues('experience'),
      certifications: processedCertifications || getValues('certifications'),
      skills: skills || [],
      role: role || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  // SCRUM-153: leaving this step without saving keeps what was typed, so
  // coming back (Previous from the credentials step, or Back) shows it again.
  const savedRef = useRef(false);
  const valuesRef = useRef(getValues);
  valuesRef.current = getValues;
  useEffect(() => {
    if (!onboarding) return;
    return () => {
      if (!savedRef.current) setDraft('professional', valuesRef.current());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const targetElement = document.querySelector(window.location.hash);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setIsMounted(true);
    }
  }, [isMounted]);

  const onSubmit = async (data: any) => {
    try {
      // Skip submission if form is not dirty and not in edit mode
      if (!isDirty && !isEdit && !from) {
        return router.push('/caregiver/onboard/document-upload');
      }

      setExtractedData(null);

      setIsLoading(true);
      const formData = new FormData();

      // Process certifications: format dates and clean up data. SCRUM-152: the
      // block is hidden during onboarding, so an untouched empty row is not a
      // certification and is not saved.
      const processedCertifications = (data.certifications || []).filter(
        (cert: any) => cert?.title || cert?.institution || cert?.credentialId || cert?.certificateFile,
      ).map(
        (cert: any, index: number) => {
          // Get the actual file if it exists (from file input)
          const uploadedFile = cert.certificateFile?.[0];
          const hasNewFile = uploadedFile instanceof File;

          // If there's a new file to upload, append it with index as key
          if (hasNewFile) {
            formData.append(`certification_${index}`, uploadedFile);
          }

          // Build clean certification object
          const { certificateFile, fileId, ...cleanCert } = cert;

          return {
            ...cleanCert,
            // Format dates to ISO strings
            issueDate: cert.issueDate
              ? new Date(cert.issueDate).toISOString()
              : '',
            expireDate: cert.expireDate
              ? new Date(cert.expireDate).toISOString()
              : '',
            // Preserve existing certificateFile URL if it's a string (already uploaded)
            ...(typeof certificateFile === 'string' && certificateFile
              ? { certificateFile }
              : {}),
          };
        },
      );

      // Prepare final data payload
      const payload = {
        ...data,
        certifications: processedCertifications,
      };
      // SCRUM-152: in onboarding the Role is chosen and saved on step 1. This
      // step never shows it, so its value here is stale ('' on a fresh form or
      // after Clear All, or the resume's guess) and must not overwrite it.
      if (onboarding) delete payload.role;

      formData.append('data', JSON.stringify(payload));

      if (from === 'admin') {
        formData.append('id', userFromAdmin?._id);
      }

      const response = await fetch('/api/user/professional-information', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (responseData.status === 200) {
        savedRef.current = true;
        setDraft('professional', null);
        await Promise.resolve(refetchUser());
        if (from === 'admin') {
          refetchUsers();
          refetchQaUsers();
        }
        reset();
        if (!from) {
          toast.success(
            isEdit
              ? 'Professional information updated successfully!'
              : 'Professional information submitted successfully!',
          );
          if (isEdit) {
            router.back();
          } else {
            router.push('/caregiver/onboard/document-upload');
          }
        }
      } else {
        toast.error(responseData.message || 'Something went wrong!');
      }
    } catch (error: any) {
      console.error('Professional info submission error:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  // @ts-nocheck
  useImperativeHandle(professionalInfoRef, (): any => ({
    submitForm: () => handleSubmit(onSubmit)(),
  }));

  // Helper to safely access array field errors with proper typing
  const getArrayFieldError = (
    fieldErrors: any,
    index: number,
    fieldName: string,
  ) => {
    return fieldErrors?.[index]?.[fieldName];
  };

  const renderError = (message: string) => {
    return <p className='text-red-500 text-sm'>{message}</p>;
  };

  const watchCertificationFileData: any = watch('certifications');
  const watchSkills: any = watch('skills');

  const getIssueDate = (index: number) => {
    const watchIssueDate = watchCertificationFileData[index]?.issueDate;
    if (watchIssueDate) {
      return new Date(watchIssueDate).toISOString().split('T')[0];
    }
    return '';
  };

  return (
    <form ref={professionalInfoRef} onSubmit={handleSubmit(onSubmit)}>
      <div className='flex items-center justify-between mb-8'>
        <Title text={onboarding ? 'Professional information' : 'Professional Info'} className='mb-0' />
        <div className='flex items-center gap-3'>
          {from !== 'admin' && !onboarding && (
            <Button
              type='button'
              variant='outline'
              className='text-sm h-9 px-4 rounded-lg border-gray-300 text-muted-foreground hover:text-red-500 hover:border-red-300'
              onClick={() => {
                const emptyEducation = [{ degree: '', institution: '', yearOfGraduation: '', fieldOfStudy: '', grade: '' }];
                const emptyExperience = [{ jobTitle: '', companyName: '', duration: '', responsibilities: '' }];
                // SCRUM-152: onboarding shows only Education and Experience, so
                // Clear All must not wipe the role, skills or certifications
                // the caregiver cannot see on this step.
                if (onboarding) {
                  reset({ ...getValues(), education: emptyEducation, experience: emptyExperience });
                  return;
                }
                reset({
                  education: emptyEducation,
                  experience: emptyExperience,
                  certifications: [{ title: '', institution: '', issueDate: '', expireDate: '', credentialId: '', credentialUrl: '', certificateFile: null }],
                  skills: [],
                  role: '',
                });
              }}
            >
              Clear All
            </Button>
          )}
          <AutoFillAlert source='professional-info' />
        </div>
      </div>

      {isLoading && <LoadingOverlay />}

      <div className='flex flex-col gap-10'>
        {/* SCRUM-60: Role (CNA / PCA) — required; drives [Role] Certificate label.
            SCRUM-152 (Figma): asked on step 1 during onboarding, so not here. */}
        {!onboarding && !skillsOnly && (
        <div className='flex flex-col gap-3'>
          <h2 className='text-2xl font-medium leading-[33.6px] text-gray-800'>
            Role <span className='text-red-500'>*</span>
          </h2>
          <p className='text-sm text-muted-foreground -mt-1'>
            This determines which certificate is required on your profile.
          </p>
          <Controller
            control={control}
            name='role'
            rules={{ required: !onboarding && 'Please select your role' }}
            render={({ field }) => (
              <div className='flex flex-col sm:flex-row gap-3'>
                {[
                  { value: 'CNA', title: 'CNA', sub: 'Certified Nursing Assistant' },
                  { value: 'PCA', title: 'PCA', sub: 'Personal Care Assistant' },
                ].map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <button
                      type='button'
                      key={opt.value}
                      onClick={() => field.onChange(opt.value)}
                      className={`flex-1 text-left rounded-2xl border-2 p-4 transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className='font-semibold text-gray-900 text-lg'>
                        {opt.title}
                      </p>
                      <p className='text-sm text-muted-foreground'>{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors?.role && (
            <p className='text-sm text-red-500'>{(errors.role as any).message}</p>
          )}
        </div>
        )}

        {/* Education Section */}
        {!skillsOnly && (
        <div className='flex flex-col gap-5'>
          <h2 className='text-2xl font-medium leading-[33.6px] text-gray-800'>
            Education
          </h2>
          {educationFields?.map((education, index) => (
            <div
              key={index}
              className='flex flex-col gap-5 border border-[#DFE2E0] rounded-[16px] p-5'
            >
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Degree
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Input Text'
                    {...register(`education.${index}.degree`, {
                      required:
                        !!watch(`education.${index}.institution`) ||
                        !!watch(`education.${index}.yearOfGraduation`) ||
                        !!watch(`education.${index}.fieldOfStudy`) ||
                        !!watch(`education.${index}.grade`),
                    })}
                    isError={
                      !!getArrayFieldError(errors.education, index, 'degree')
                    }
                  />
                  {getArrayFieldError(errors.education, index, 'degree') &&
                    renderError(
                      getArrayFieldError(errors.education, index, 'degree')
                        .message!,
                    )}
                </div>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Institution
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Input Text'
                    {...register(`education.${index}.institution`, {
                      required:
                        !!watch(`education.${index}.degree`) ||
                        !!watch(`education.${index}.yearOfGraduation`) ||
                        !!watch(`education.${index}.fieldOfStudy`) ||
                        !!watch(`education.${index}.grade`),
                    })}
                    isError={
                      !!getArrayFieldError(
                        errors.education,
                        index,
                        'institution',
                      )
                    }
                  />
                  {getArrayFieldError(errors.education, index, 'institution') &&
                    renderError(
                      getArrayFieldError(errors.education, index, 'institution')
                        .message!,
                    )}
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-5'>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Year of graduation
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder={onboarding ? 'Input Text' : 'e.g. 2024'}
                    type='number'
                    maxLength={4}
                    max={new Date().getFullYear()}
                    min={1900}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      if (e.currentTarget.value.length > 4) {
                        e.currentTarget.value = e.currentTarget.value.slice(0, 4);
                      }
                    }}
                    {...register(`education.${index}.yearOfGraduation`, {
                      validate: (value: string) => {
                        if (!value) return true;
                        const year = parseInt(value, 10);
                        if (value.length > 4) return 'Year must be 4 digits';
                        if (year < 1900 || year > new Date().getFullYear()) return `Year must be between 1900 and ${new Date().getFullYear()}`;
                        return true;
                      },
                    })}
                  />
                </div>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Field of study
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Input Text'
                    {...register(`education.${index}.fieldOfStudy`)}
                  />
                </div>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Grade
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Input Text'
                    {...register(`education.${index}.grade`)}
                  />
                </div>
              </div>
              {index > 0 && (
                <Remove handleRemove={() => removeEducation(index)} />
              )}
            </div>
          ))}

          <AddMore
            handleAdd={() =>
              appendEducation({
                degree: '',
                institution: '',
                yearOfGraduation: '',
                fieldOfStudy: '',
                grade: '',
              })
            }
          />
        </div>

        )}

        {/* Experience Section */}
        {!skillsOnly && (
        <div className='flex flex-col gap-5'>
          <h2 className='text-2xl font-medium leading-[33.6px] text-gray-800'>
            Experience
          </h2>
          {experienceFields.map((experience, index) => (
            <div
              key={index}
              className='flex flex-col gap-5 border border-[#DFE2E0] rounded-[16px] p-5'
            >
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-5'>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Job Title
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Input Text'
                    {...register(`experience.${index}.jobTitle`, {
                      required:
                        !!watch(`experience.${index}.companyName`) ||
                        !!watch(`experience.${index}.duration`) ||
                        !!watch(`experience.${index}.responsibilities`),
                    })}
                    isError={
                      !!getArrayFieldError(errors.experience, index, 'jobTitle')
                    }
                  />
                  {getArrayFieldError(errors.experience, index, 'jobTitle') &&
                    renderError(
                      getArrayFieldError(errors.experience, index, 'jobTitle')
                        .message!,
                    )}
                </div>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Company name
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Input Text'
                    {...register(`experience.${index}.companyName`)}
                    isError={
                      !!getArrayFieldError(
                        errors.experience,
                        index,
                        'companyName',
                      )
                    }
                  />
                </div>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Duration
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Input Text'
                    {...register(`experience.${index}.duration`)}
                    isError={
                      !!getArrayFieldError(errors.experience, index, 'duration')
                    }
                  />
                </div>
              </div>

              <div className='flex flex-col gap-3'>
                <label className='text-base font-medium text-tertiary'>
                  Responsibilities
                </label>
                {/* SCRUM-152 (Figma): a single-line field in onboarding, like
                    the others; the profile edit form keeps the rich editor. */}
                {onboarding ? (
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Input Text'
                    {...register(`experience.${index}.responsibilities`)}
                  />
                ) : (
                  <Controller
                    name={`experience.${index}.responsibilities`}
                    control={control}
                    render={({ field }) => (
                      <Editor
                        value={field.value}
                        onChange={(content) => field.onChange(content)}
                        placeholder='Write about your responsibilities...'
                      />
                    )}
                  />
                )}
              </div>

              {index > 0 && (
                <Remove handleRemove={() => removeExperience(index)} />
              )}
            </div>
          ))}

          <AddMore
            handleAdd={() =>
              appendExperience({
                jobTitle: '',
                companyName: '',
                duration: '',
                responsibilities: '',
              })
            }
          />
        </div>

        )}

        {/* SCRUM-205: Licenses & Certifications was removed from the product by
            SCRUM-152, but this form kept rendering it for the profile edit — so a
            caregiver changing one skill was sent through a section of mandatory
            fields that no longer exists anywhere else, and could not get past it.
            It is gone from the caregiver's edit form. The admin modal keeps it:
            that surface still reads these records. */}
        {!onboarding && from === 'admin' && (
        <div className='flex flex-col gap-5'>
          <h2 className='text-2xl font-medium leading-[33.6px] text-gray-800'>
            Licenses & Certifications
          </h2>
          {certificationFields.map((certification, index) => (
            <div
              key={index}
              className='flex flex-col gap-5 border border-[#DFE2E0] rounded-[16px] p-5'
            >
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Title{' '}
                    {from !== 'admin' && (
                      <span className='text-red-500'>*</span>
                    )}
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Ex: Patient Service Fundamentals'
                    {...register(`certifications.${index}.title`, {
                      required: from !== 'admin' && 'Title is required',
                    })}
                    isError={
                      !!getArrayFieldError(
                        errors.certifications,
                        index,
                        'title',
                      )
                    }
                  />
                  {getArrayFieldError(errors.certifications, index, 'title') &&
                    renderError(
                      getArrayFieldError(errors.certifications, index, 'title')
                        .message!,
                    )}
                </div>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Name of Institute{' '}
                    {from !== 'admin' && (
                      <span className='text-red-500'>*</span>
                    )}
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Ex: Johns Hopkins School of Nursing'
                    {...register(`certifications.${index}.institution`, {
                      required:
                        from !== 'admin' && 'Name of Institute is required',
                    })}
                    isError={
                      !!getArrayFieldError(
                        errors.certifications,
                        index,
                        'institution',
                      )
                    }
                  />
                  {getArrayFieldError(
                    errors.certifications,
                    index,
                    'institution',
                  ) &&
                    renderError(
                      getArrayFieldError(
                        errors.certifications,
                        index,
                        'institution',
                      ).message!,
                    )}
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Issue Date{' '}
                    {from !== 'admin' && (
                      <span className='text-red-500'>*</span>
                    )}
                  </label>
                  <Input
                    type='date'
                    className='rounded-[12px] h-14 bg-[#f9f9f9] uppercase'
                    placeholder='DD/MM/YYYY'
                    {...register(`certifications.${index}.issueDate`, {
                      required: from !== 'admin' && 'Issue Date is required',
                    })}
                    isError={
                      !!getArrayFieldError(
                        errors.certifications,
                        index,
                        'issueDate',
                      )
                    }
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {getArrayFieldError(
                    errors.certifications,
                    index,
                    'issueDate',
                  ) &&
                    renderError(
                      getArrayFieldError(
                        errors.certifications,
                        index,
                        'issueDate',
                      ).message!,
                    )}
                </div>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Expire Date{' '}
                    {from !== 'admin' && (
                      <span className='text-red-500'>*</span>
                    )}
                  </label>
                  <Input
                    type='date'
                    className='rounded-[12px] h-14 bg-[#f9f9f9] uppercase'
                    placeholder='DD/MM/YYYY'
                    {...register(`certifications.${index}.expireDate`, {
                      required: from !== 'admin' && 'Expire Date is required',
                    })}
                    isError={
                      !!getArrayFieldError(
                        errors.certifications,
                        index,
                        'expireDate',
                      )
                    }
                    min={getIssueDate(index)}
                    max='2099-12-31'
                  />
                  {getArrayFieldError(
                    errors.certifications,
                    index,
                    'expireDate',
                  ) &&
                    renderError(
                      getArrayFieldError(
                        errors.certifications,
                        index,
                        'expireDate',
                      ).message!,
                    )}
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Credential URL
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='https://www.credential.com/1234567890'
                    {...register(`certifications.${index}.credentialUrl`)}
                    type='url'
                  />
                  {/* {errors.certifications &&
                    errors.certifications[index] &&
                    errors.certifications[index].credentialUrl &&
                    renderError(
                      errors.certifications[index].credentialUrl.message!
                    )} */}
                </div>
                <div className='flex flex-col gap-3'>
                  <label className='text-base font-medium text-tertiary'>
                    Credential ID{' '}
                    {from !== 'admin' && (
                      <span className='text-red-500'>*</span>
                    )}
                  </label>
                  <Input
                    className='rounded-[12px] h-14 bg-[#f9f9f9]'
                    placeholder='Ex: ABC123'
                    {...register(`certifications.${index}.credentialId`, {
                      required: from !== 'admin' && 'Credential ID is required',
                    })}
                    isError={
                      !!getArrayFieldError(
                        errors.certifications,
                        index,
                        'credentialId',
                      )
                    }
                  />
                  {getArrayFieldError(
                    errors.certifications,
                    index,
                    'credentialId',
                  ) &&
                    renderError(
                      getArrayFieldError(
                        errors.certifications,
                        index,
                        'credentialId',
                      ).message!,
                    )}
                </div>
              </div>
              <label
                htmlFor={`licenseFile-${index}`}
                className='relative cursor-pointer'
              >
                <div className='flex flex-col items-center justify-center border border-gray-300 rounded-[12px] p-4 bg-white h-22'>
                  <div className='flex flex-col items-center gap-2.5'>
                    <CloudUploadIcon className='w-6 h-6' />
                    <span className='text-sm text-gray-500'>
                      Upload physical licenses or certificate
                    </span>
                  </div>
                  <input
                    type='file'
                    className='hidden'
                    id={`licenseFile-${index}`}
                    accept='image/*,application/pdf'
                    // {...register(`certifications.${index}.certificateFile`)}
                    {...register(`certifications.${index}.certificateFile`, {
                      validate: {
                        fileSize: (value) => {
                          // Check if a file exists and validate its size
                          const file =
                            typeof value === 'object' ? value?.[0] : null;
                          // console.log({ value });
                          // SCRUM-97: same limit as every other credential
                          // upload row — a phone photo of a certificate is
                          // routinely larger than the old 3MB cap.
                          return (
                            !file ||
                            file.size <= MAX_UPLOAD_MB * 1024 * 1024 ||
                            `File size should be less than ${MAX_UPLOAD_MB}MB`
                          );
                        },
                      },
                    })}
                    // onChange={(e) => {
                    //   setValue(
                    //     `certifications.${index}.certificateFile`,
                    //     // @ts-ignore
                    //     e.target.files ? e.target.files[0] : null
                    //   );
                    // }}
                  />
                  {getArrayFieldError(
                    errors.certifications,
                    index,
                    'certificateFile',
                  ) &&
                    renderError(
                      getArrayFieldError(
                        errors.certifications,
                        index,
                        'certificateFile',
                      ).message!,
                    )}
                  {watchCertificationFileData[index]?.certificateFile &&
                    watchCertificationFileData[index]?.certificateFile?.[0]
                      ?.name && (
                      <p className='text-base text-black py-2 inline-flex gap-4'>
                        <span>
                          Name:{' '}
                          {
                            watchCertificationFileData[index]
                              ?.certificateFile?.[0]?.name
                          }
                        </span>
                        <span>
                          Size:{' '}
                          {(
                            watchCertificationFileData[index]
                              ?.certificateFile?.[0]?.size / 1024
                          ).toFixed(2)}{' '}
                          KB
                        </span>
                      </p>
                    )}
                </div>
                {typeof watchCertificationFileData?.[index]?.certificateFile === 'string' && watchCertificationFileData?.[index]?.certificateFile && (
                  <Link
                    href={watchCertificationFileData?.[index]?.certificateFile}
                    target='_blank'
                    className='text-blue-600 underline text-sm flex items-center gap-2 pt-2'
                  >
                    <LinkIcon className='w-4 h-4' />
                    View current certificate
                  </Link>
                )}
              </label>
              {index > 0 && (
                <Remove handleRemove={() => removeCertification(index)} />
              )}
            </div>
          ))}
          <AddMore
            handleAdd={() =>
              appendCertification({
                fileId: new Date().getTime(),
                title: '',
                institution: '',
                issueDate: '',
                expireDate: '',
                credentialId: '',
                credentialUrl: '',
                certificateFile: null,
              })
            }
          />
        </div>
        )}
        {!onboarding && (
        <div className='flex flex-col gap-5' id='skills'>
          <h2 className='text-2xl font-medium leading-[33.6px] text-gray-800'>
            Skills {from !== 'admin' && !onboarding && <span className='text-red-500'>*</span>}
          </h2>

          <SkillsSelector
            errors={errors}
            setValue={setValue}
            watchSkills={watchSkills}
          />
          <input
            type='hidden'
            value={watch('skills')}
            {...register('skills', {
              // SCRUM-152: optional during onboarding.
              required: from !== 'admin' && !onboarding && 'At least one skill is required',
            })}
          />
          {errors.skills &&
            errors.skills.message &&
            renderError(errors.skills.message as string)}
        </div>
        )}

        {from !== 'admin' && (
          <div className='flex items-center gap-5'>
            <OnboardButton
              text={isEdit ? 'Cancel' : 'Previous'}
              className={cn('w-full bg-white text-tertiary border hover:text-white', onboarding ? 'border-tertiary' : 'border-gray-300')}
              onClick={() => router.back()}
            />
            <OnboardButton
              text={isEdit ? 'Save & Exit' : 'Next'}
              className='w-full'
              type='submit'
              disabled={!isDirty && isEdit}
            />
            {onboarding && <span className='ml-auto hidden sm:inline-flex items-center gap-1.5 text-sm text-tertiary'><img src='/info.svg' alt='' className='size-4' /> Need help?</span>}
          </div>
        )}
      </div>
    </form>
  );
});

OnboardProfessionalInfo.displayName = 'OnboardProfessionalInfo';
export default OnboardProfessionalInfo;
