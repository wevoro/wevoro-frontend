/* eslint-disable react/prop-types */
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePathname, useRouter } from 'next/navigation';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import GoogleLogin from './google-login';

import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { useAuthContext } from '@/lib/contexts';

export default function AuthForm({
  inputFields,
  onSubmit,
  submitButtonText,
  type,
  source,
}: any) {
  const { isLoading, setIsLoading, isOtpResend } = useAuthContext();
  const location = usePathname();
  const locationSource = location.split('/')[1];

  const router = useRouter();
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>(
    {}
  );

  const schemaFields: any = {};
  inputFields.forEach((field: any) => {
    schemaFields[field.name] = field.validation;
  });

  const createFormSchema = (type: any) => {
    let formSchema: any = z.object(schemaFields);

    if (type === 'signup' || type === 'reset-password') {
      formSchema = formSchema.superRefine(
        ({ confirmPassword, password }: any, ctx: any) => {
          if (confirmPassword !== password) {
            ctx.addIssue({
              code: 'custom',
              message: 'The passwords did not match',
              path: ['confirmPassword'],
            });
          }
        }
      );
    }

    return formSchema;
  };

  const formSchema = createFormSchema(type);

  const defaultValues: any = {};
  inputFields.forEach((field: any) => {
    defaultValues[field.name] = field.defaultValue || '';
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await onSubmit(data, source || locationSource);
    } catch (error) {
      setIsLoading(false);
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const expiryTime =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('otpExpiry')
        : '';
    return expiryTime ? new Date(expiryTime).getTime() - Date.now() : 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const expiryTime = window.localStorage.getItem('otpExpiry');
      if (!expiryTime) {
        clearInterval(interval);
        setTimeLeft(0);
        return;
      }

      const remaining = new Date(expiryTime).getTime() - Date.now();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOtpResend]);

  const formatTime = (milliseconds: number) => {
    if (milliseconds <= 0) return 'OTP expired';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='space-y-6 w-full'
      >
        {type === 'verify-otp' && (
          <p className='text-center text-sm text-gray-500'>
            The verification code expires in:{' '}
            <span className='font-medium'>{formatTime(timeLeft)}</span>
          </p>
        )}
        <div className={`grid grid-cols-1 gap-5`}>
          {inputFields.map((input: any, i: number) => (
            <div key={i}>
              <FormField
                control={form.control}
                name={input.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-base font-medium'>
                      {input.label}
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        {input.type === 'tel' ? (
                          <div className='flex items-center'>
                            {/* <Select
                              onValueChange={(value) =>
                                field.onChange(
                                  `+${value}${field.value.split(' ')[1] || ''}`
                                )
                              }
                              defaultValue={
                                field.value.split(' ')[0]?.replace('+', '') ||
                                ''
                              }
                            >
                              <SelectTrigger className='w-[100px] text-base h-14 mt-1 rounded-r-none border-gray-300 shadow-sm bg-[#f9f9f9] rounded-l-[12px] focus:ring-0'>
                                <SelectValue placeholder='+99' />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country, index) => (
                                  <SelectItem
                                    key={index}
                                    value={country.phone_code}
                                  >
                                    +{country.phone_code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select> */}
                            <Input
                              type='number'
                              placeholder={input.placeholder}
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  `${field.value.split(' ')[0]} ${
                                    e.target.value
                                  }`
                                )
                              }
                              value={field.value.split(' ')[1] || ''}
                              className={cn(
                                'flex-grow mt-1 block h-14 bg-[#f9f9f9] border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500',
                                {
                                  'rounded-[12px]': input.type !== 'tel',
                                  'rounded-r-[12px] rounded-l-none border-l-0':
                                    input.type === 'tel',
                                }
                              )}
                            />
                          </div>
                        ) : input.type === 'password' ? (
                          <>
                            <Input
                              type={
                                showPassword[input.name] ? 'text' : 'password'
                              }
                              placeholder={input.placeholder}
                              {...field}
                              className='mt-1 block w-full rounded-[12px] h-14 bg-[#f9f9f9] border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-10'
                            />
                            <button
                              type='button'
                              onClick={() =>
                                togglePasswordVisibility(input.name)
                              }
                              className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'
                            >
                              {showPassword[input.name] ? (
                                <EyeOff className='h-4 w-4 text-gray-400' />
                              ) : (
                                <Eye className='h-4 w-4 text-gray-400' />
                              )}
                            </button>
                          </>
                        ) : input.type === 'otp' ? (
                          <InputOTP maxLength={6} {...field} className='w-full'>
                            <InputOTPGroup className='w-full'>
                              <InputOTPSlot index={0} className='w-full' />
                              <InputOTPSlot index={1} className='w-full' />
                              <InputOTPSlot index={2} className='w-full' />
                              <InputOTPSlot index={3} className='w-full' />
                              <InputOTPSlot index={4} className='w-full' />
                              <InputOTPSlot index={5} className='w-full' />
                            </InputOTPGroup>
                          </InputOTP>
                        ) : (
                          <Input
                            disabled={isLoading}
                            type={input.type}
                            placeholder={input.placeholder}
                            {...field}
                            className='mt-1 block w-full rounded-[12px] h-14 bg-[#f9f9f9] border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500'
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className='text-xs text-red-600' />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        {type === 'login' && source !== 'admin' && (
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <Checkbox id='remember-me' className='rounded-sm' />
              <label
                htmlFor='remember-me'
                className='ml-2 text-base text-muted-foreground'
              >
                Remember me
              </label>
            </div>
            <Link
              href={`/${source}/forgot-password`}
              className='text-base text-primary underline hover:text-primary-600 transition'
            >
              Forgot password?
            </Link>
          </div>
        )}

        <Button
          disabled={isLoading}
          className='w-full relative z-50 h-[75px] rounded-[12px] text-lg font-medium'
          type='submit'
        >
          {submitButtonText}
        </Button>
        {(type === 'login' || type === 'signup') && source !== 'admin' && (
          <>
            <div className='flex items-center my-4'>
              <div className='flex-grow border-t border-gray-400'></div>
              <span className='mx-4 text-gray-500'>OR</span>
              <div className='flex-grow border-t border-gray-400'></div>
            </div>

            <GoogleLogin source={source} />
          </>
        )}
      </form>
    </Form>
  );
}
