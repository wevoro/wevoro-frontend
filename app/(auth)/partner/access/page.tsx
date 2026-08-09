'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts';

/**
 * SCRUM-99 (Phase 1): passwordless agency login/signup — email + emailed code.
 * Additive route (/partner/access); the existing password /partner/login is
 * untouched. Two steps in one screen: enter company email -> enter the code.
 * `mode=signin` renders Faisal's "Welcome back" sign-in copy (from the share
 * preview's "Already have an account? Sign in"); without it, the brand-new
 * agency "Welcome" copy is shown. Both use the same passwordless email+code.
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

  // Preserve the share-link context when toggling between the two entry copies.
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
    step === 'code' ? 'Welcome' : isSignin ? 'Welcome back' : 'Welcome';
  const subtitle =
    step === 'code'
      ? `Enter the 6-digit code we sent to ${email}`
      : isSignin
        ? 'Log in to your account with your company email — no password needed.'
        : 'Log in with your company email — no password needed.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          {heading}
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">{subtitle}</p>

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
                className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            {isSignin && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepOnline}
                  onChange={(e) => setKeepOnline(e.target.checked)}
                  className="w-4 h-4 accent-green-700"
                />
                Keep me signed in
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-3 transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending…' : isSignin ? 'Login' : 'Continue'}
            </button>

            {isSignin ? (
              <p className="text-center text-sm text-gray-500">
                New to WeVoro?{' '}
                <Link
                  href={newAccountHref}
                  className="text-green-700 font-semibold underline"
                >
                  Create an account
                </Link>
              </p>
            ) : (
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link
                  href={signInHref}
                  className="text-green-700 font-semibold underline"
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
                className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-green-600"
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
  );
}
