'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Bell,
  Globe,
  Info,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

interface CustomDocument {
  title: string;
}

interface ShiftFormValues {
  caregiversNeeded: string;
  positions: string[];
  startingDate: string;
  shiftDays: DayOfWeek[];
  startingTime: string;
  endingTime: string;
  hourRate: string;
  negotiable: boolean;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  presetDocuments: string[];
  customDocuments: CustomDocument[];
  notes: string;
  urgentShift: boolean;
  isPublic: boolean;
}

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'MON', value: 'MON' },
  { label: 'TUE', value: 'TUE' },
  { label: 'WED', value: 'WED' },
  { label: 'THU', value: 'THU' },
  { label: 'FRI', value: 'FRI' },
  { label: 'SAT', value: 'SAT' },
  { label: 'SUN', value: 'SUN' },
];

const POSITION_OPTIONS = ['CNA', 'PCA'] as const;

const PRESET_DOCUMENTS = [
  'Resume',
  'Driving License',
  'CPR Certification',
  'TB Test Results',
  'Background Check',
  'Vaccination Record',
  'CNA License',
  'First Aid Certification',
] as const;

const DEFAULT_VALUES: ShiftFormValues = {
  caregiversNeeded: '',
  positions: [],
  startingDate: '',
  shiftDays: [],
  startingTime: '08:00 AM',
  endingTime: '02:00 PM',
  hourRate: '',
  negotiable: false,
  streetAddress: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  presetDocuments: [],
  customDocuments: [],
  notes: '',
  urgentShift: false,
  isPublic: true,
};

// ─── Utility Functions ──────────────────────────────────────────────────────

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;

  return hours * 60 + minutes;
}

function calculateShiftLength(startTime: string, endTime: string): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  let diff = endMinutes - startMinutes;
  if (diff <= 0) diff += 24 * 60; // overnight shift

  return Math.round((diff / 60) * 10) / 10;
}

function getShiftType(startTime: string): 'Day Shift' | 'Night Shift' {
  const match = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 'Day Shift';

  let hours = parseInt(match[1], 10);
  const period = match[3].toUpperCase();

  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;

  // 7 PM (19:00) to 5 AM (05:00) = Night Shift
  if (hours >= 19 || hours < 5) return 'Night Shift';
  return 'Day Shift';
}

function getTodayFormatted(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateShiftModal({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(true);
  const [positionOpen, setPositionOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<ShiftFormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customDocuments',
  });

  // Watchers
  const startingTime = watch('startingTime');
  const endingTime = watch('endingTime');
  const positions = watch('positions');
  const presetDocuments = watch('presetDocuments');

  // Computed shift info
  const shiftLength = useMemo(
    () => calculateShiftLength(startingTime, endingTime),
    [startingTime, endingTime]
  );

  const shiftType = useMemo(
    () => getShiftType(startingTime),
    [startingTime]
  );

  // Position multi-select handlers
  const togglePosition = useCallback(
    (pos: string) => {
      const current = getValues('positions');
      if (current.includes(pos)) {
        setValue(
          'positions',
          current.filter((p) => p !== pos),
          { shouldValidate: true, shouldDirty: true }
        );
      } else {
        setValue('positions', [...current, pos], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [getValues, setValue]
  );

  // Preset document handlers
  const handleSelectAllDocs = useCallback(() => {
    setValue('presetDocuments', [...PRESET_DOCUMENTS], {
      shouldDirty: true,
    });
  }, [setValue]);

  const handleUnselectAllDocs = useCallback(() => {
    setValue('presetDocuments', [], { shouldDirty: true });
  }, [setValue]);

  const togglePresetDoc = useCallback(
    (doc: string) => {
      const current = getValues('presetDocuments');
      if (current.includes(doc)) {
        setValue(
          'presetDocuments',
          current.filter((d) => d !== doc),
          { shouldDirty: true }
        );
      } else {
        setValue('presetDocuments', [...current, doc], {
          shouldDirty: true,
        });
      }
    },
    [getValues, setValue]
  );

  // Day toggle
  const toggleDay = useCallback(
    (day: DayOfWeek) => {
      const current = getValues('shiftDays');
      if (current.includes(day)) {
        setValue(
          'shiftDays',
          current.filter((d) => d !== day),
          { shouldValidate: true, shouldDirty: true }
        );
      } else {
        setValue('shiftDays', [...current, day], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [getValues, setValue]
  );

  // Cancel handling
  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelAlert(true);
    } else {
      setOpen(false);
    }
  }, [isDirty]);

  const confirmCancel = useCallback(() => {
    setShowCancelAlert(false);
    reset(DEFAULT_VALUES);
    setOpen(false);
  }, [reset]);

  // Submit
  const onSubmit = async (data: ShiftFormValues) => {
    setIsLoading(true);

    const allDocuments = [
      ...data.presetDocuments.map((title) => ({ title })),
      ...data.customDocuments.filter((d) => d.title.trim()),
    ];

    const payload = {
      caregiversNeeded: parseInt(data.caregiversNeeded, 10),
      positions: data.positions,
      startingDate: data.startingDate,
      shiftDays: data.shiftDays,
      startingTime: data.startingTime,
      endingTime: data.endingTime,
      shiftLength,
      shiftType,
      hourRate: parseFloat(data.hourRate),
      negotiable: data.negotiable,
      address: {
        street: data.streetAddress,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      },
      documentsNeeded: allDocuments,
      notes: data.notes,
      urgentShift: data.urgentShift,
      isPublic: data.isPublic,
    };

    try {
      const response = await fetch('/api/user/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.status === 200 || response.ok) {
        reset(DEFAULT_VALUES);
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        setOpen(false);
        toast.success('Shift created successfully!', {
          position: 'top-center',
        });
      } else {
        toast.error(responseData.message || 'Failed to create shift', {
          position: 'top-center',
        });
      }
    } catch {
      toast.error('Something went wrong. Please try again.', {
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = (message: string) => (
    <p className='text-red-500 text-xs pt-1'>{message}</p>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className='sm:max-w-[600px] p-0 gap-0 overflow-hidden max-h-[726px] flex flex-col'>
          {/* Header */}
          <DialogHeader className='px-6 pt-6 pb-4 border-b border-[#DFE2E0] shrink-0'>
            <h2 className='text-lg font-semibold text-tertiary text-left'>
              Offer Details
            </h2>
          </DialogHeader>

          {/* Scrollable content */}
          <ScrollArea className='flex-1 [&_[data-radix-scroll-area-scrollbar]]:bg-[#E8E8E8] [&_[data-radix-scroll-area-thumb]]:bg-[#008000]'>
            <form
              id='create-shift-form'
              onSubmit={handleSubmit(onSubmit)}
              className='flex flex-col gap-6 px-6 py-5'
            >
              {/* Section: Shift Details */}
              <p className='text-base font-semibold text-tertiary'>
                Shift Details
              </p>

              {/* 1. Number of Caregivers */}
              <div className='flex flex-col gap-1.5'>
                <Label className='text-sm font-medium text-tertiary'>
                  Number of Caregivers Needed For This Shift{' '}
                  <span className='text-red-500'>*</span>
                </Label>
                <Controller
                  name='caregiversNeeded'
                  control={control}
                  rules={{ required: 'Number of caregivers is required' }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className='rounded-xl h-12'
                          isError={!!error}
                        >
                          <SelectValue placeholder='Select number' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => (
                            <SelectItem
                              key={i + 1}
                              value={String(i + 1)}
                            >
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {error && renderError(error.message || '')}
                    </>
                  )}
                />
              </div>

              {/* 2. Position (multi-select with checkboxes) */}
              <div className='flex flex-col gap-1.5'>
                <Label className='text-sm font-medium text-tertiary'>
                  Position <span className='text-red-500'>*</span>
                </Label>
                <Controller
                  name='positions'
                  control={control}
                  rules={{
                    validate: (v) =>
                      v.length > 0 || 'At least one position is required',
                  }}
                  render={({ fieldState: { error } }) => (
                    <>
                      <div className='relative'>
                        <button
                          type='button'
                          onClick={() => setPositionOpen(!positionOpen)}
                          className={cn(
                            'flex h-12 w-full items-center justify-between rounded-xl border bg-background px-3 py-2 text-sm ring-offset-background',
                            error
                              ? 'border-red-500'
                              : 'border-input',
                            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                          )}
                        >
                          <span
                            className={cn(
                              positions.length === 0 &&
                                'text-muted-foreground'
                            )}
                          >
                            {positions.length > 0
                              ? positions.join(', ')
                              : 'Select positions'}
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 opacity-50 transition-transform',
                              positionOpen && 'rotate-180'
                            )}
                          />
                        </button>

                        {positionOpen && (
                          <div className='absolute z-50 mt-1 w-full rounded-xl border border-input bg-white shadow-md py-1'>
                            {POSITION_OPTIONS.map((pos) => (
                              <label
                                key={pos}
                                className='flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors'
                              >
                                <Checkbox
                                  checked={positions.includes(pos)}
                                  onCheckedChange={() =>
                                    togglePosition(pos)
                                  }
                                  className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                                />
                                <span className='text-sm'>{pos}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {error && renderError(error.message || '')}
                    </>
                  )}
                />
              </div>

              {/* 3. Shift Date & Time section */}
              <div className='rounded-xl border border-[#DFE2E0] p-4 flex flex-col gap-4'>
                {/* Starting Date */}
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-sm font-medium text-tertiary'>
                    Starting Date <span className='text-red-500'>*</span>
                  </Label>
                  <Controller
                    name='startingDate'
                    control={control}
                    rules={{
                      required: 'Starting date is required',
                      validate: (v) => {
                        if (v < getTodayFormatted())
                          return 'Date cannot be in the past';
                        return true;
                      },
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <div className='relative'>
                          <Input
                            type='date'
                            {...field}
                            min={getTodayFormatted()}
                            className={cn(
                              'rounded-xl h-12 pr-10',
                              error &&
                                'border-red-500 focus-visible:ring-red-500'
                            )}
                          />
                          <CalendarDays className='absolute right-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none' />
                        </div>
                        {error && renderError(error.message || '')}
                      </>
                    )}
                  />
                </div>

                {/* Shift Days */}
                <div className='flex flex-col gap-1.5'>
                  <div className='flex items-center gap-1.5'>
                    <Label className='text-sm font-medium text-tertiary'>
                      Shift Days <span className='text-red-500'>*</span>
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className='size-3.5 text-muted-foreground cursor-help' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the days this shift repeats</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Controller
                    name='shiftDays'
                    control={control}
                    rules={{
                      validate: (v) =>
                        v.length > 0 || 'Select at least one day',
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <div className='flex flex-wrap gap-2'>
                          {DAYS.map(({ label, value }) => {
                            const isSelected =
                              field.value.includes(value);
                            return (
                              <button
                                type='button'
                                key={value}
                                onClick={() => toggleDay(value)}
                                className={cn(
                                  'px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border',
                                  isSelected
                                    ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]'
                                    : 'bg-[#F5F5F5] text-muted-foreground border-transparent hover:border-[#DFE2E0]'
                                )}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        {error && renderError(error.message || '')}
                      </>
                    )}
                  />
                </div>

                {/* Starting Time */}
                <Controller
                  name='startingTime'
                  control={control}
                  rules={{ required: 'Starting time is required' }}
                  render={({ field, fieldState: { error } }) => (
                    <TimePicker
                      label='Starting Time'
                      required
                      value={field.value}
                      onChange={field.onChange}
                      isError={!!error}
                    />
                  )}
                />

                {/* Shift Length Indicator */}
                <div className='flex items-center justify-center gap-4 py-2'>
                  <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                    <span className='inline-flex items-center gap-1 bg-[#F0FFF0] text-[#008000] px-2.5 py-1 rounded-md text-xs font-medium'>
                      {shiftLength} Hrs shift
                    </span>
                  </div>
                  <span className='text-xs font-medium text-muted-foreground'>
                    &bull;
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium',
                      shiftType === 'Night Shift'
                        ? 'bg-[#F5F0FF] text-[#6B21A8]'
                        : 'bg-[#FFF9E6] text-[#B45309]'
                    )}
                  >
                    {shiftType}
                  </span>
                </div>

                {/* Ending Time */}
                <Controller
                  name='endingTime'
                  control={control}
                  rules={{ required: 'Ending time is required' }}
                  render={({ field, fieldState: { error } }) => (
                    <TimePicker
                      label='Ending Time'
                      required
                      value={field.value}
                      onChange={field.onChange}
                      isError={!!error}
                    />
                  )}
                />
              </div>

              {/* 4. Hour Rate */}
              <div className='flex flex-col gap-1.5'>
                <Label className='text-sm font-medium text-tertiary'>
                  Hour Rate <span className='text-red-500'>*</span>
                </Label>
                <div className='flex items-center gap-3'>
                  <Controller
                    name='hourRate'
                    control={control}
                    rules={{
                      required: 'Hour rate is required',
                      validate: (v) =>
                        parseFloat(v) > 0 || 'Rate must be greater than 0',
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <div className='flex-1'>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium'>
                            $
                          </span>
                          <Input
                            {...field}
                            type='number'
                            step='0.01'
                            min='0'
                            placeholder='0.00'
                            className={cn(
                              'rounded-xl h-12 pl-7',
                              error &&
                                'border-red-500 focus-visible:ring-red-500'
                            )}
                          />
                        </div>
                        {error && renderError(error.message || '')}
                      </div>
                    )}
                  />
                  <Controller
                    name='negotiable'
                    control={control}
                    render={({ field }) => (
                      <label className='flex items-center gap-2 cursor-pointer whitespace-nowrap pt-0.5'>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                        />
                        <span className='text-sm text-tertiary'>
                          Negotiable
                        </span>
                      </label>
                    )}
                  />
                </div>
              </div>

              {/* 5. Address Section */}
              <div className='flex flex-col gap-4'>
                <p className='text-base font-semibold text-tertiary'>
                  Address
                </p>

                {/* Street Address */}
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-sm font-medium text-tertiary'>
                    Street Address{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Controller
                    name='streetAddress'
                    control={control}
                    rules={{ required: 'Street address is required' }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input
                          {...field}
                          placeholder='Enter street address'
                          className='rounded-xl h-12'
                          isError={!!error}
                        />
                        {error && renderError(error.message || '')}
                      </>
                    )}
                  />
                </div>

                {/* City + State */}
                <div className='grid grid-cols-2 gap-3'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-sm font-medium text-tertiary'>
                      City <span className='text-red-500'>*</span>
                    </Label>
                    <Controller
                      name='city'
                      control={control}
                      rules={{ required: 'City is required' }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            placeholder='City'
                            className='rounded-xl h-12'
                            isError={!!error}
                          />
                          {error && renderError(error.message || '')}
                        </>
                      )}
                    />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-sm font-medium text-tertiary'>
                      State / Province{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Controller
                      name='state'
                      control={control}
                      rules={{ required: 'State is required' }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            placeholder='State'
                            className='rounded-xl h-12'
                            isError={!!error}
                          />
                          {error && renderError(error.message || '')}
                        </>
                      )}
                    />
                  </div>
                </div>

                {/* Postal Code + Country */}
                <div className='grid grid-cols-2 gap-3'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-sm font-medium text-tertiary'>
                      Postal / ZIP Code{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Controller
                      name='postalCode'
                      control={control}
                      rules={{ required: 'Postal code is required' }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            placeholder='ZIP Code'
                            className='rounded-xl h-12'
                            isError={!!error}
                          />
                          {error && renderError(error.message || '')}
                        </>
                      )}
                    />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-sm font-medium text-tertiary'>
                      Country <span className='text-red-500'>*</span>
                    </Label>
                    <Controller
                      name='country'
                      control={control}
                      rules={{ required: 'Country is required' }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            placeholder='Country'
                            className='rounded-xl h-12'
                            isError={!!error}
                          />
                          {error && renderError(error.message || '')}
                        </>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* 6. Documents to be provided (collapsible) */}
              <div className='flex flex-col gap-3'>
                <button
                  type='button'
                  onClick={() => setDocsExpanded(!docsExpanded)}
                  className='flex items-center justify-between w-full text-left'
                >
                  <p className='text-base font-semibold text-tertiary'>
                    Documents to be provided
                  </p>
                  {docsExpanded ? (
                    <ChevronUp className='size-5 text-muted-foreground' />
                  ) : (
                    <ChevronDown className='size-5 text-muted-foreground' />
                  )}
                </button>

                {docsExpanded && (
                  <div className='rounded-xl border border-[#DFE2E0] p-4 flex flex-col gap-3'>
                    {/* Select All / Unselect All */}
                    <div className='flex items-center gap-4'>
                      <button
                        type='button'
                        onClick={handleSelectAllDocs}
                        className='text-sm font-medium text-[#008000] hover:underline'
                      >
                        Select all
                      </button>
                      <button
                        type='button'
                        onClick={handleUnselectAllDocs}
                        className='text-sm font-medium text-muted-foreground hover:underline'
                      >
                        Un Select all
                      </button>
                    </div>

                    {/* Preset Documents */}
                    <Controller
                      name='presetDocuments'
                      control={control}
                      render={({ field }) => (
                        <div className='flex flex-col gap-2.5'>
                          {PRESET_DOCUMENTS.map((doc) => {
                            const isChecked =
                              field.value.includes(doc);
                            return (
                              <label
                                key={doc}
                                className='flex items-center gap-3 cursor-pointer'
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() =>
                                    togglePresetDoc(doc)
                                  }
                                  className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                                />
                                <span className='text-sm text-tertiary'>
                                  {doc}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    />

                    {/* Custom Documents */}
                    {fields.map((item, index) => (
                      <div
                        key={item.id}
                        className='flex items-start gap-2'
                      >
                        <button
                          type='button'
                          onClick={() => remove(index)}
                          className='mt-2.5 shrink-0'
                        >
                          <Trash2 className='size-4 text-red-500 hover:text-red-700 transition-colors' />
                        </button>
                        <Controller
                          name={`customDocuments.${index}.title`}
                          control={control}
                          rules={{
                            required: 'Document title is required',
                          }}
                          render={({
                            field,
                            fieldState: { error },
                          }) => (
                            <div className='flex-1'>
                              <Input
                                {...field}
                                placeholder='Document title'
                                className='rounded-xl h-10'
                                isError={!!error}
                              />
                              {error &&
                                renderError(error.message || '')}
                            </div>
                          )}
                        />
                      </div>
                    ))}

                    {/* Add More */}
                    <button
                      type='button'
                      onClick={() => append({ title: '' })}
                      className='flex items-center gap-2 mt-1 group'
                    >
                      <span className='flex items-center justify-center w-6 h-6 rounded-full bg-[#008000]'>
                        <Plus className='size-3.5 text-white' />
                      </span>
                      <span className='text-sm font-medium text-[#008000] group-hover:underline'>
                        Add More
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* 7. Notes */}
              <div className='flex flex-col gap-1.5'>
                <p className='text-base font-semibold text-tertiary'>
                  Notes
                </p>
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder='Explain here any further information, Ex: shift rules'
                      className='rounded-xl min-h-[100px]'
                    />
                  )}
                />
              </div>

              {/* 8. Urgent Shift Toggle */}
              <div className='flex items-start justify-between gap-4 py-3 border-t border-[#DFE2E0]'>
                <div className='flex items-start gap-3'>
                  <div className='mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-[#FFF5F5]'>
                    <Bell className='size-4 text-[#EF4444]' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-tertiary'>
                      Urgent Shift
                    </span>
                    <span className='text-xs text-muted-foreground leading-relaxed max-w-[360px]'>
                      This will shorten list the matching CNA&apos;s to only
                      who accept that
                    </span>
                  </div>
                </div>
                <Controller
                  name='urgentShift'
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* 9. Public Toggle */}
              <div className='flex items-start justify-between gap-4 py-3 border-t border-[#DFE2E0]'>
                <div className='flex items-start gap-3'>
                  <div className='mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-[#F0FFF0]'>
                    <Globe className='size-4 text-[#008000]' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-tertiary'>
                      Public
                    </span>
                    <span className='text-xs text-muted-foreground leading-relaxed max-w-[360px]'>
                      This shift will be visible to verified CNA&apos;s, it
                      will help with matching the suitable candidates.
                    </span>
                  </div>
                </div>
                <Controller
                  name='isPublic'
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </form>
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className='px-6 py-4 border-t border-[#DFE2E0] flex flex-row gap-3 shrink-0'>
            <Button
              type='button'
              variant='outline'
              className='w-full h-12 rounded-xl'
              disabled={isLoading}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              form='create-shift-form'
              className='w-full h-12 rounded-xl'
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation AlertDialog */}
      <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
        <AlertDialogContent className='sm:max-w-[425px] rounded-xl'>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
