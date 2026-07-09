'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { superSetup } from '@/app/actions';

const SuperSetupForm = () => {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // The link can carry the setup key (?key=...) so the client only fills in
  // email + password.
  useEffect(() => {
    const k = searchParams.get('key');
    if (k) setSetupKey(k);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !setupKey) {
      return toast.error('Email, password and setup key are all required');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    const res = await superSetup({ email, password, setupKey });
    setLoading(false);
    if (res?.success) {
      toast.success(res.message || 'Super admin created');
      setDone(true);
    } else {
      toast.error(res?.message || 'Setup failed');
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='flex items-center justify-center mb-8'>
          <div className='relative w-10 h-10 mr-2'>
            <Image src='/wevoro.png' alt='Wevoro' fill className='object-contain' />
          </div>
          <span className='text-xl font-bold text-gray-900'>Wevoro</span>
        </div>

        <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8'>
          {done ? (
            <div className='text-center'>
              <CheckCircle2 className='w-14 h-14 text-emerald-500 mx-auto mb-4' />
              <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                Super admin ready
              </h1>
              <p className='text-gray-500 mb-6'>
                The account <b>{email}</b> can now sign in to the admin panel.
              </p>
              <Link href='/admin/login'>
                <Button className='w-full h-12 rounded-xl gap-2 font-semibold'>
                  Go to admin login <ArrowRight className='w-4 h-4' />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className='flex flex-col items-center text-center mb-6'>
                <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3'>
                  <ShieldCheck className='w-6 h-6 text-primary' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Create super admin
                </h1>
                <p className='text-sm text-gray-500 mt-1'>
                  Set up a super admin account for the Wevoro admin panel.
                </p>
              </div>

              <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1.5 block'>
                    Email
                  </label>
                  <Input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='you@example.com'
                    className='rounded-xl h-12 bg-[#f9f9f9]'
                    required
                  />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1.5 block'>
                    Password
                  </label>
                  <Input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='At least 6 characters'
                    className='rounded-xl h-12 bg-[#f9f9f9]'
                    required
                  />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1.5 block'>
                    Setup key
                  </label>
                  <Input
                    type='text'
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    placeholder='Provided setup key'
                    className='rounded-xl h-12 bg-[#f9f9f9]'
                    required
                  />
                  <p className='text-xs text-gray-400 mt-1'>
                    You need the setup key to create a super admin.
                  </p>
                </div>

                <Button
                  type='submit'
                  disabled={loading}
                  className='w-full h-12 rounded-xl gap-2 font-semibold mt-2'
                >
                  {loading && <Loader2 className='w-4 h-4 animate-spin' />}
                  Create super admin
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SuperSetupPage = () => (
  <Suspense fallback={null}>
    <SuperSetupForm />
  </Suspense>
);

export default SuperSetupPage;
