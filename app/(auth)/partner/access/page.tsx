'use client';

import { useState } from 'react';
import { useAuthContext } from '@/lib/contexts';

/**
 * SCRUM-99 (Phase 1): passwordless agency login/signup — email + emailed code.
 * Additive route (/partner/access); the existing password /partner/login is
 * untouched. Two steps in one screen: enter company email -> enter the code.
 */
export default function PartnerAccessPage() {
  const { handleRequestCode, handleVerifyCode } = useAuthContext();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          Welcome
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          {step === 'email'
            ? 'Log in with your company email — no password needed.'
            : `Enter the 6-digit code we sent to ${email}`}
        </p>

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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-3 transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Continue'}
            </button>
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
