'use client';
import React, { useState } from 'react';
import Container from '../container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const StayTuned = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleWaitlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const response = await fetch('/api/user/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });

    const responseData: any = await response.json();

    if (responseData.status === 200) {
      setIsLoading(false);
      return toast({
        variant: 'success',
        title: responseData.message || `You have been added to the waitlist!`,
        description: 'We will notify you when we launch.',
      });
    }

    const errorObject = {
      500: {
        title: responseData.message || 'Uh oh! Something went wrong.',
        description: 'We will notify you when we launch.',
      },
      400: {
        title: responseData.message || 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.',
      },
    };

    if (responseData.status in errorObject) {
      setIsLoading(false);
      return toast({
        variant: 'destructive',
        title:
          errorObject[responseData.status as keyof typeof errorObject].title,
        description:
          errorObject[responseData.status as keyof typeof errorObject]
            .description,
      });
    }
  };

  return (
    <form
      className='bg-[#bcf8dc] h-full w-full py-12'
      onSubmit={handleWaitlist}
      id='joinwaitlist'
    >
      <Container className='flex flex-col lg:flex-row justify-between items-center gap-4'>
        <div className='max-w-md flex flex-col gap-4 text-center lg:text-left mx-auto lg:mx-0'>
          <h2 className='lg:text-[45px] text-[31px] font-light text-secondary lg:leading-[49.5px] leading-[34.1px] text-center lg:text-left'>
            <span className='font-medium'>Stay tuned</span> with our latest
            updates
          </h2>
          <p className='lg:text-lg text-sm text-[#6C6C6C]'>
            Join our waiting list by filling your email
          </p>
        </div>
        <div className='flex flex-col sm:flex-row gap-4 lg:w-[540px] w-full'>
          <Input
            type='email'
            name='email'
            placeholder='Enter your email'
            className='h-[56px] rounded-[12px]'
            required
          />
          <Button
            type='submit'
            className='w-max h-[56px] rounded-[12px] px-8 mx-auto sm:mx-0'
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Container>
    </form>
  );
};

export default StayTuned;
