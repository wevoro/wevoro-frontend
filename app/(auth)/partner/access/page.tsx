'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts';

/**
 * SCRUM-99 — passwordless agency login/sign-up (email + emailed code) in Faisal's
 * two-column "Welcome back" layout (left photo panel + right form). `mode=signin`
 * shows the returning-agency copy; without it, the brand-new "Welcome" copy.
 * There is no password anywhere for agencies. /partner/login redirects here.
 */
export default function PartnerAccessPage() {
  const { handleRequestCode, handleVerifyCode } = useAuthContext();
  const searchParams = useSearchParams();
  const isSignin = searchParams.get('mode') === 'signin';
  const shareId = searchParams.get('shareId');
  const proId = searchParams.get('proId');

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [keepOnline, setKeepOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  // Preserve share-link context when toggling between the two entry copies.
  const linkParams = new URLSearchParams();
  if (shareId) linkParams.set('shareId', shareId);
  if (proId) {
    linkParams.set('proId', proId);
    linkParams.set('s', 'true');
  }
  const newAccountHref = `/partner/access${linkParams.toString() ? `?${linkParams.toString()}` : ''}`;
  const signInHref = `/partner/access?${linkParams.toString() ? `${linkParams.toString()}&` : ''}mode=signin`;

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setLoading(true);
    const ok = await handleRequestCode(value, 'partner');
    setLoading(false);
    if (ok) setStep('code');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    setLoading(true);
    await handleVerifyCode(email.trim(), code.trim(), 'partner');
    setLoading(false);
  };

  const heading =
    step === 'code' ? 'Verify your email' : isSignin ? 'Welcome back' : 'Welcome';
  const subtitle =
    step === 'code'
      ? `Enter the 6-digit code we sent to ${email}`
      : isSignin
        ? 'Log in to your account'
        : 'Log in with your company email — no password needed.';

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      {/* Left photo panel */}
      <div
        className="hidden lg:flex lg:w-1/3 bg-primary/20 bg-cover bg-no-repeat flex-col justify-between items-center text-white px-4 xl:px-14 pt-10"
        style={{
          backgroundImage: 'url(/partner_signin.svg)',
          backgroundPosition: 'center 20%',
        }}
      >
        <div className="flex flex-col items-center justify-between h-[90vh]">
          <Link
            href="/"
            className="text-primary text-[40px] 3xl:text-5xl font-light"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Wevoro
          </Link>
          <div className="xl:max-w-md mx-auto text-center">
            <p className="text-[28px] 2xl:text-[32px] mb-4 leading-[40px] xl:leading-[46px] font-bold">
              Review Professionals CNA&apos;s profiles
            </p>
            <p className="mb-10">
              Unlock your next opportunity in healthcare. Sign in and hire pros.
              It&apos;s fast, free, and puts you in control of your candidate
              journey.
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-2/3 bg-[#f9f9f9] flex items-center justify-center p-4 pt-24 lg:p-8 min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-[32px] font-semibold tracking-tight text-gray-900">
              {heading}
            </h1>
            <p className="text-base text-gray-600">{subtitle}</p>
          </div>

          {step === 'email' ? (
            <form onSubmit={sendCode} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Company Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                  required
                  className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-green-600 bg-white"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepOnline}
                  onChange={(e) => setKeepOnline(e.target.checked)}
                  className="w-4 h-4 accent-green-700"
                />
                Keep me signed in
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-3 transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending…' : isSignin ? 'Login' : 'Continue'}
              </button>

              {isSignin ? (
                <p className="text-center text-base text-gray-600">
                  New to WeVoro?{' '}
                  <Link
                    href={newAccountHref}
                    className="text-green-700 font-semibold underline underline-offset-4"
                  >
                    Create an account
                  </Link>
                </p>
              ) : (
                <p className="text-center text-base text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href={signInHref}
                    className="text-green-700 font-semibold underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={verify} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  6-digit code
                </label>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-green-600 bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-3 transition-colors disabled:opacity-60"
              >
                {loading ? 'Verifying…' : 'Log in'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                }}
                className="text-sm text-gray-500 underline mx-auto"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 right-6 text-sm text-gray-500">
        Need help?
      </div>
    </div>
  );
}
