// @ts-nocheck
'use client';
import Upload from '@/components/global/personal-info/upload';
import Title from '@/components/global/title';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import OnboardButton from '@/components/global/onboard-button';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Controller, useForm } from 'react-hook-form';
import LoadingOverlay from '@/components/global/loading-overlay';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import Editor from '../ui/editor';
import { cn } from '@/lib/utils';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  useAdminContext,
  useAuthContext,
  useOnboardContext,
  useUIContext,
  useUserContext,
} from '@/lib/contexts';
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { AutoFillAlert } from './dashboard/autofill-alert';

const OnboardPersonalInfo = forwardRef((props: any) => {
  const { source, from, userFromAdmin, onClose } = props;
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';

  const { user, refetchUser } = useUserContext();
  const { refetchUsers, refetchQaUsers } = useAdminContext();
  const { querySuffix, id } = useAuthContext();
  const { personalInfoRef, extractedData, setExtractedData } = useOnboardContext();
  const { setOpenAutoFillModal } = useUIContext();

  const extractedPersonalInfo = extractedData?.personalInformation;
  const extractedProfessionalRole = extractedData?.professionalInformation?.role;

  // SCRUM-153: the saved profile is the source of truth for this form. The AI
  // resume data used to come first, so a caregiver who filled a few fields by
  // hand, pressed Next (saving them) and came back saw the AI's nulls again.
  // The AI data is applied once, by the effect below, and consumed on save.
  const savedInfo =
    from && userFromAdmin?.personalInfo
      ? userFromAdmin?.personalInfo
      : !from && user?.personalInfo
        ? user?.personalInfo
        : {};
  const userData = savedInfo;

  // SCRUM-152: the caregiver's onboarding asks for one Full Name (Faisal's
  // design); the agency form and the admin's edit modal keep First / Last.
  // Onboarding only: the profile edit form keeps First / Last name, so an
  // existing two-word first name is never re-split by a save.
  const useFullName = source === 'pro' && !from;
  // SCRUM-152: About/Bio is not part of caregiver onboarding any more. It
  // stays on the profile edit form, where the saved text is still shown.
  const showBio = !(source === 'pro' && !from);
  // SCRUM-152 (Faisal, Figma "3. Onboarding Page - Personal Info"): the
  // caregiver's first step is Full Name | Role, Date of Birth | Gender, Phone,
  // Address — no photo upload, no Bio. Role (CNA / PCA) is asked here and
  // saved with the professional information, where it lives.
  const caregiverOnboarding = source === 'pro' && !isEdit && !from;
  // The caregiver's own form in both places it opens — onboarding and "Edit
  // information" on the profile — uses the same new design. The agency form
  // and the admin's edit modal keep theirs. Previous / Need help? stay
  // onboarding-only (the edit form has Cancel / Save & Exit).
  const caregiverForm = source === 'pro' && !from;
  const savedRole = !from ? user?.professionalInfo?.role || '' : '';

  const {
    image,
    bio,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    address,
    phone,
    companyName,
    industry,
    dateEstablished,
  } = userData;

  const proDefaultValues = {
    image: image || '',
    bio: bio || '',
    firstName: firstName || '',
    lastName: lastName || '',
    fullName: [firstName, lastName].filter(Boolean).join(' '),
    role: savedRole,
    dateOfBirth: source === 'pro' ? dateOfBirth?.split('T')[0] : '',
    gender: gender || (from === 'admin' ? 'Male' : ''),
    phone: phone || '',
    address: {
      street: address?.street || '',
      city: address?.city || '',
      state: address?.state || '',
      zipCode: address?.zipCode || '',
      country: address?.country || '',
    },
  };

  const partnerDefaultValues = {
    image: image || '',
    firstName: firstName || '',
    lastName: lastName || '',
    companyName: companyName || '',
    industry: industry || '',
    bio: bio || '',
    dateEstablished: source === 'partner' ? dateEstablished?.split('T')[0] : '',
    phone: phone || '',
    address: {
      street: address?.street || '',
      city: address?.city || '',
      state: address?.state || '',
      zipCode: address?.zipCode || '',
      country: address?.country || '',
    },
  };

  // The AI-autofill result replaces what is on the form (the prompt says so).
  // Empty values are skipped so a field the resume did not have keeps what the
  // caregiver typed, and the form is left dirty against the saved profile so
  // Next actually saves it — it used to reset the dirty flag, and "Next"
  // straight after an autofill saved nothing at all.
  useEffect(() => {
    if (
      extractedPersonalInfo &&
      Object.keys(extractedPersonalInfo).length > 0
    ) {
      const filled: any = {};
      Object.entries(extractedPersonalInfo).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') return;
        if (k === 'address' && typeof v === 'object') {
          const addr: any = {};
          Object.entries(v as any).forEach(([ak, av]) => {
            if (av !== null && av !== undefined && av !== '') addr[ak] = av;
          });
          filled.address = { ...getValues('address'), ...addr };
          return;
        }
        filled[k] = v;
      });
      if (filled.dateOfBirth && typeof filled.dateOfBirth === 'string') {
        filled.dateOfBirth = filled.dateOfBirth.split('T')[0];
      }
      if (filled.firstName || filled.lastName) {
        filled.fullName = [filled.firstName ?? getValues('firstName'), filled.lastName ?? getValues('lastName')]
          .filter(Boolean)
          .join(' ');
      }
      // SCRUM-152: Role is asked on this step now (step 2 no longer shows
      // it), so the resume's role pre-selects it here. It is applied together
      // with the personal data, which is consumed on save, so coming Back to
      // this step never puts the resume's role over the one that was saved.
      const extractedRole = String(extractedProfessionalRole || '').trim().toUpperCase();
      if (caregiverForm && (extractedRole === 'CNA' || extractedRole === 'PCA')) {
        filled.role = extractedRole;
      }
      reset({ ...getValues(), ...filled }, { keepDefaultValues: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedPersonalInfo, extractedProfessionalRole]);

  // SCRUM-153: the profile can arrive after this form mounted (Back from the
  // next step, or a reload), in which case the fields were left empty even
  // though everything had been saved. Fill them in once it is here, unless
  // the caregiver has already started typing.
  const savedKey = JSON.stringify(savedInfo ?? {});
  useEffect(() => {
    if (extractedPersonalInfo || isDirty) return;
    if (!savedInfo || Object.keys(savedInfo).length === 0) return;
    reset(source === 'partner' ? partnerDefaultValues : proDefaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues:
      source === 'partner' ? partnerDefaultValues : proDefaultValues,
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      // `id` is null on the credentialing share-link journey (that flow passes
      // ?proId=, while auth-context reads ?id=), which sent new agencies to
      // /agency/caregivers/null -> redirect -> the old Available Caregivers list.
      // Only take the caregiver-profile branch when we actually have an id.
      const path =
        source === 'pro'
          ? '/caregiver/onboard/professional-info'
          : querySuffix && id
            ? `/agency/caregivers/${id}?s=true`
            : '/agency/profile?onboarded=true';
      if (!isDirty && !isEdit && !from) {
        return router.push(path);
      }
      setIsLoading(true);

      source === 'pro' &&
        data.dateOfBirth &&
        (data.dateOfBirth = new Date(data.dateOfBirth).toISOString());

      // SCRUM-152: one Full Name field on the caregiver form; the profile,
      // emails and the share preview still read first and last name, so the
      // name is split on save (first word, then the rest).
      const savedFullName = [firstName, lastName].filter(Boolean).join(' ');
      if (useFullName && String(data.fullName || '').trim() !== savedFullName) {
        const [first = '', ...rest] = String(data.fullName || '').trim().split(/\s+/);
        data.firstName = first;
        data.lastName = rest.join(' ');
      }

      const formData = new FormData();

      const { image, fullName: _fullName, role: chosenRole, ...rest } = data;

      if (typeof data.image === 'object' && data.image?.length > 0) {
        formData.append('image', data.image[0]);
      } else if (typeof data.image === 'string' && data.image !== '') {
        rest.image = data.image; // Retain the existing string URL
      }

      formData.append('data', JSON.stringify(rest));

      if (from === 'admin') {
        formData.append('id', userFromAdmin?._id);
      }

      const response = await fetch('/api/user/personal-information', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      if (responseData.status === 200) {
        // The role chosen on this step is professional information; the
        // backend merges ($set), so education and experience are untouched.
        if (caregiverForm && chosenRole && chosenRole !== savedRole) {
          const roleData = new FormData();
          roleData.append('data', JSON.stringify({ role: chosenRole }));
          await fetch('/api/user/professional-information', { method: 'POST', body: roleData }).catch(() => {});
        }
        // SCRUM-153: wait for the fresh profile, so the next step — and this
        // one, on Back — read what was just saved. And the AI resume data has
        // now been applied and saved; drop it so a return to this step shows
        // the saved values, not the resume's blanks.
        await Promise.resolve(refetchUser());
        setExtractedData((prev: any) =>
          prev && prev.personalInformation ? { ...prev, personalInformation: null } : prev,
        );
        if (from === 'admin') {
          refetchUsers();
          refetchQaUsers();
          toast.success('Profile information updated successfully!');
          onClose && onClose();
        }
        reset(data);

        if (!from) {
          toast.success(
            isEdit
              ? 'Personal information updated successfully!'
              : 'Personal information submitted successfully!',
          );
          if (isEdit) {
            router.back();
          } else if (source === 'partner') {
            // Full page navigation (same idiom as login): a soft router.push
            // here could fail silently on a flaky connection, leaving the form
            // looking stuck after the success toast ("needs a 2nd click").
            // Hard navigation can't be dropped and reloads fresh user data.
            // Keep the loading overlay up until the browser swaps pages.
            window.location.href = path;
            return;
          } else {
            router.push(path);
          }
        }
      } else {
        toast.error(responseData.message || 'Something went wrong!');
      }
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      console.log('inside catch', error);
      toast.error(error.message || 'Something went wrong!');
    }
  };

  useImperativeHandle(personalInfoRef, () => ({
    submitForm: () => handleSubmit(onSubmit)(),
  }));
  const renderError = (message: string) => {
    return <p className='text-red-500 text-sm'>{message}</p>;
  };

  const imageFile = watch('image')?.[0];
  return (
    <form onSubmit={handleSubmit(onSubmit)} ref={personalInfoRef}>
      {isLoading && <LoadingOverlay />}
      <div className='flex items-center justify-between mb-8'>
        {/* SCRUM-152: sentence case in Faisal's onboarding frame; the profile
            edit form and the agency form keep their heading. */}
        <Title text={caregiverForm ? 'Personal information' : 'Personal Information'} className='mb-0' />
        <div className='flex items-center gap-3'>
          {from !== 'admin' && (
            <Button
              type='button'
              variant='outline'
              className='text-sm h-9 px-4 rounded-lg border-gray-300 text-muted-foreground hover:text-red-500 hover:border-red-300'
              onClick={() => {
                reset(
                  source === 'partner'
                    ? {
                        image: '',
                        firstName: '',
                        lastName: '',
                        companyName: '',
                        industry: '',
                        bio: '',
                        dateEstablished: '',
                        phone: '',
                        address: { street: '', city: '', state: '', zipCode: '', country: '' },
                      }
                    : {
                        image: '',
                        bio: '',
                        firstName: '',
                        lastName: '',
                        dateOfBirth: '',
                        gender: '',
                        phone: '',
                        fullName: '',
                        // SCRUM-152: the Role select is on this step too.
                        role: '',
                        address: { street: '', city: '', state: '', zipCode: '', country: '' },
                      },
                );
              }}
            >
              Clear All
            </Button>
          )}
          {from !== 'admin' && source === 'pro' && (
            <AutoFillAlert source='personal-info' />
          )}
        </div>
      </div>

      <div className='flex flex-col gap-8'>
        {!caregiverForm && (
          <div className='text-center flex flex-col gap-3'>
            <Upload register={register} image={watch('image') === '' ? null : image} imageFile={imageFile} />
          </div>
        )}

        {showBio && (
          <div className='flex flex-col gap-3'>
            <h2 className='text-lg font-medium leading-[25.2px] text-gray-800'>
              About/Bio
            </h2>
            <Controller
              name='bio'
              control={control}
              render={({ field }) => (
                <Editor
                  value={field.value}
                  onChange={(content) =>
                    setValue('bio', content, { shouldDirty: true })
                  }
                  placeholder='Write about yourself...'
                />
              )}
            />
          </div>
        )}

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
          {useFullName ? (
            <div className={cn('flex flex-col gap-3', !caregiverForm && 'sm:col-span-2')}>
              <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                Full Name <span className='text-red-500'>*</span>
              </label>
              <Input
                {...register('fullName', {
                  required: 'Full name is required',
                  validate: (v: string) =>
                    String(v || '').trim().length > 0 || 'Full name is required',
                })}
                className='rounded-[12px] h-14 bg-[#f9f9f9]'
                placeholder='Enter your first and last name'
                name='fullName'
                autoComplete='name'
                isError={!!errors.fullName}
              />
              {errors.fullName && renderError(errors.fullName.message as string)}
            </div>
          ) : (
            <>
          <div className='flex flex-col gap-3'>
            <label className='text-base font-medium leading-[22.4px] text-tertiary'>
              First name{' '}
              {from !== 'admin' && <span className='text-red-500'>*</span>}
            </label>
            <Input
              {...register('firstName', {
                required: from !== 'admin' && 'First name is required',
              })}
              className='rounded-[12px] h-14 bg-[#f9f9f9]'
              placeholder='Please enter your first name'
              name='firstName'
              isError={!!errors.firstName}
            />
            {errors.firstName &&
              renderError(errors.firstName.message as string)}
          </div>
          <div className='flex flex-col gap-3'>
            <label className='text-base font-medium leading-[22.4px] text-tertiary'>
              Last name{' '}
              {from !== 'admin' && <span className='text-red-500'>*</span>}
            </label>
            <Input
              {...register('lastName', {
                required: from !== 'admin' && 'Last name is required',
              })}
              className='rounded-[12px] h-14 bg-[#f9f9f9]'
              placeholder='Please enter your last name'
              name='lastName'
              isError={!!errors.lastName}
            />
            {errors.lastName && renderError(errors.lastName.message as string)}
          </div>
            </>
          )}
          {caregiverForm && (
            <div className='flex flex-col gap-3'>
              <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                Role <span className='text-red-500'>*</span>
              </label>
              <Controller
                name='role'
                control={control}
                rules={{ required: 'Please select your role' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <SelectTrigger
                      className={cn('rounded-[12px] h-14 bg-[#f9f9f9]', !field.value && 'text-muted-foreground')}
                      isError={!!errors.role}
                    >
                      <SelectValue placeholder='CNA or PCA'>{field.value}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='CNA'>CNA — Certified Nursing Assistant</SelectItem>
                        <SelectItem value='PCA'>PCA — Personal Care Assistant</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && renderError((errors.role as any).message as string)}
            </div>
          )}
          {source === 'pro' && (
            <>
              <div className='flex flex-col gap-3'>
                <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                  Date of Birth{' '}
                  {from !== 'admin' && <span className='text-red-500'>*</span>}
                </label>
                <Input
                  {...register('dateOfBirth', {
                    required: from !== 'admin' && 'Date of birth is required',
                  })}
                  className='rounded-[12px] h-14 bg-[#f9f9f9] uppercase'
                  type='date'
                  placeholder='DD/MM/YYYY'
                  name='dateOfBirth'
                  isError={!!errors.dateOfBirth}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth &&
                  renderError(errors.dateOfBirth.message as string)}
              </div>

              <div className='flex flex-col gap-3'>
                <label
                  className={cn(
                    'text-base font-medium',
                    // SCRUM-152: same label style as Date of Birth next to it.
                    caregiverForm && 'leading-[22.4px] text-tertiary',
                  )}
                >
                  Gender{' '}
                  {from !== 'admin' && <span className='text-red-500'>*</span>}
                </label>
                <Controller
                  name='gender'
                  control={control}
                  rules={{
                    required: from !== 'admin' && 'Gender is required.',
                  }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <SelectTrigger
                        className={cn(
                          'rounded-[12px] h-14 bg-[#f9f9f9]',
                          !field.value && 'text-muted-foreground',
                        )}
                        isError={!!errors.gender}
                      >
                        <SelectValue placeholder='Select gender' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value='Male'>Male</SelectItem>
                          <SelectItem value='Female'>Female</SelectItem>
                          <SelectItem value='Other'>Other</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && renderError(errors.gender.message as string)}
              </div>
            </>
          )}

          {source === 'partner' && (
            <>
              <div className='flex flex-col gap-3'>
                <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                  Company Name{' '}
                  {from !== 'admin' && <span className='text-red-500'>*</span>}
                </label>
                <Input
                  {...register('companyName', {
                    required: from !== 'admin' && 'Company name is required',
                  })}
                  className='rounded-[12px] h-14 bg-[#f9f9f9]'
                  placeholder='Please enter your company name'
                  name='companyName'
                  isError={!!errors.companyName}
                />
                {errors.companyName &&
                  renderError(errors.companyName.message as string)}
              </div>

              <div className='flex flex-col gap-3'>
                <label className='text-base font-medium'>
                  Company Industry{' '}
                  {from !== 'admin' && <span className='text-red-500'>*</span>}
                </label>
                <Controller
                  name='industry'
                  control={control}
                  rules={{
                    required: from !== 'admin' && 'Industry is required.',
                  }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        className='rounded-[12px] h-14 bg-[#f9f9f9]'
                        isError={!!errors.industry}
                      >
                        <SelectValue placeholder='Industry' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value='Assisted Living'>
                            Assisted Living
                          </SelectItem>
                          <SelectItem value='Home Care'>Home Care</SelectItem>
                          <SelectItem value='Home Health'>
                            Home Health
                          </SelectItem>
                          <SelectItem value='Hospitals'>Hospitals</SelectItem>
                          <SelectItem value='Nursing Home'>
                            Nursing Home
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.industry &&
                  renderError(errors.industry.message as string)}
              </div>
            </>
          )}

          <div
            className={cn(
              'flex flex-col gap-3',
              source === 'pro' && 'col-span-2',
            )}
          >
            <label className='text-base font-medium leading-[22.4px] text-tertiary'>
              Phone Number{' '}
              {from !== 'admin' && <span className='text-red-500'>*</span>}
            </label>
            <Controller
              name='phone'
              control={control}
              rules={{
                required: from !== 'admin' && 'Phone number is required',
                validate: (value: string) => {
                  if (from === 'admin' || !value) return true;
                  const digitsOnly = value.replace(/\D/g, '');
                  if (digitsOnly.length < 10) return 'Phone number must be at least 10 digits';
                  if (digitsOnly.length > 15) return 'Phone number must not exceed 15 digits';
                  return true;
                },
              }}
              render={({ field }) => (
                <PhoneInput
                  {...field}
                  // className="rounded-[12px] h-14 bg-[#f9f9f9]"
                  placeholder='Enter your phone number'
                  isError={!!errors.phone}
                />
              )}
            />
            {errors.phone && renderError(errors.phone.message as string)}
          </div>

          {source === 'partner' && (
            <div className='flex flex-col gap-3'>
              <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                Date of Establishment{' '}
                {from !== 'admin' && <span className='text-red-500'>*</span>}
              </label>
              <Input
                {...register('dateEstablished', {
                  required:
                    from !== 'admin' && 'Date of establishment is required',
                })}
                className='rounded-[12px] h-14 bg-[#f9f9f9] uppercase'
                type='date'
                placeholder='DD/MM/YYYY'
                name='dateEstablished'
                isError={!!errors.dateEstablished}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dateEstablished &&
                renderError(errors.dateEstablished.message as string)}
            </div>
          )}
        </div>

        <div className='flex flex-col gap-5'>
          <h2 className='text-lg font-medium leading-[25.2px] text-gray-800'>
            Address
          </h2>
          <div className='flex flex-col gap-3'>
            <label className='text-base font-medium leading-[22.4px] text-tertiary'>
              {/* SCRUM-152: label case as in Faisal's onboarding frame. */}
              {caregiverForm ? 'Street Address' : 'Street address'}{' '}
              {from !== 'admin' && !caregiverForm && <span className='text-red-500'>*</span>}
            </label>
            <Input
              className='rounded-[12px] h-14 bg-[#f9f9f9]'
              placeholder='Input Text'
              {...register('address.street', {
                // SCRUM-152: not required for caregivers.
                // SCRUM-152: optional in caregiver onboarding (Figma); the edit forms keep it required.
                required: from !== 'admin' && !caregiverForm && 'Street address is required',
              })}
              isError={!!errors.address?.street}
            />
            {errors.address?.street &&
              renderError(errors.address.street.message as string)}
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            <div className='flex flex-col gap-3'>
              <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                City{' '}
                {from !== 'admin' && <span className='text-red-500'>*</span>}
              </label>
              <Input
                className='rounded-[12px] h-14 bg-[#f9f9f9]'
                placeholder={caregiverForm ? 'Input Text' : 'Enter city name'}
                {...register('address.city', {
                  required: from !== 'admin' && 'City is required',
                  pattern: {
                    value: /^[A-Za-z\s\-'.]+$/,
                    message: 'City must contain only letters',
                  },
                })}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z\s\-'.]/g, '');
                }}
                isError={!!errors.address?.city}
              />
              {errors.address?.city &&
                renderError(errors.address.city.message as string)}
            </div>
            <div className='flex flex-col gap-3'>
              <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                State/Province{' '}
                {from !== 'admin' && <span className='text-red-500'>*</span>}
              </label>
              <Input
                className='rounded-[12px] h-14 bg-[#f9f9f9]'
                placeholder={caregiverForm ? 'Input Text' : 'Enter state/province'}
                {...register('address.state', {
                  required: from !== 'admin' && 'State is required',
                  pattern: {
                    value: /^[A-Za-z\s\-'.]+$/,
                    message: 'State must contain only letters',
                  },
                })}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z\s\-'.]/g, '');
                }}
                isError={!!errors.address?.state}
              />
              {errors.address?.state &&
                renderError(errors.address.state.message as string)}
            </div>
            <div className='flex flex-col gap-3'>
              <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                {caregiverForm ? 'Postal/ZIP code' : 'Postal/Zip code'}{' '}
                {from !== 'admin' && <span className='text-red-500'>*</span>}
              </label>
              <Input
                className='rounded-[12px] h-14 bg-[#f9f9f9]'
                placeholder={caregiverForm ? 'Input Text' : 'Enter zip code'}
                {...register('address.zipCode', {
                  required: from !== 'admin' && 'Zip code is required',
                  pattern: {
                    value: /^[0-9\-]+$/,
                    message: 'Zip code must contain only numbers',
                  },
                })}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^0-9\-]/g, '');
                }}
                maxLength={10}
                isError={!!errors.address?.zipCode}
              />
              {errors.address?.zipCode &&
                renderError(errors.address.zipCode.message as string)}
            </div>
            <div className='flex flex-col gap-3'>
              <label className='text-base font-medium leading-[22.4px] text-tertiary'>
                Country{' '}
                {from !== 'admin' && <span className='text-red-500'>*</span>}
              </label>
              <Input
                className='rounded-[12px] h-14 bg-[#f9f9f9]'
                placeholder={caregiverForm ? 'Input Text' : 'Enter country'}
                {...register('address.country', {
                  required: from !== 'admin' && 'Country is required',
                  pattern: {
                    value: /^[A-Za-z\s\-'.]+$/,
                    message: 'Country must contain only letters',
                  },
                })}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z\s\-'.]/g, '');
                }}
                isError={!!errors.address?.country}
              />
              {errors.address?.country &&
                renderError(errors.address.country.message as string)}
            </div>
          </div>
        </div>

        {from !== 'admin' && (
          <div className='flex items-center gap-5'>
            {isEdit && (
              <OnboardButton
                text='Cancel'
                onClick={() => router.back()}
                className='w-full bg-white text-tertiary border border-gray-300 hover:text-white'
              />
            )}
            {caregiverOnboarding && (
              // SCRUM-152 (Figma): there is no step before this one, so
              // Previous is shown disabled — the outlined button at 50%
              // opacity, not the grey fill disabled buttons get elsewhere.
              <OnboardButton
                text='Previous'
                disabled
                className='w-full bg-white text-tertiary border border-tertiary disabled:bg-white disabled:opacity-50'
              />
            )}
            <OnboardButton
              text={isEdit ? 'Save & Exit' : 'Next'}
              type='submit'
              className='w-full'
              disabled={!isDirty && isEdit}
            />
            {caregiverOnboarding && <span className='ml-auto hidden sm:inline-flex items-center gap-1.5 text-sm text-tertiary'><img src='/info.svg' alt='' className='size-4' /> Need help?</span>}
          </div>
        )}
      </div>
    </form>
  );
});

OnboardPersonalInfo.displayName = 'OnboardPersonalInfo';

export default OnboardPersonalInfo;
