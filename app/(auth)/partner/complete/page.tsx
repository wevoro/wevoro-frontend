'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * SCRUM-99 (Phase 2): the simplified "Complete your agency account" form for
 * passwordless agencies (Flow 1 — direct sign-in with no share link). Four
 * fields the admin uses to verify the agency against the Georgia Home Care
 * Provider Registry + Secretary of State: contact name, agency name, city,
 * state — plus the CPR certifications this agency accepts. Submitting moves the
 * account to "Pending Verification"; the admin then confirms it, which is what
 * unlocks the sensitive-credential tier.
 */
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const CPR_PROVIDERS = [
  { value: 'red_cross', label: 'American Red Cross' },
  { value: 'aha', label: 'American Heart Association (AHA)' },
  { value: 'hsi', label: 'Health & Safety Institute (HSI)' },
  { value: 'any', label: 'Any accredited provider' },
];

export default function PartnerCompletePage() {
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cpr, setCpr] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleCpr = (value: string) => {
    setCpr((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !agencyName.trim() || !city.trim() || !state) {
      toast.error('Please fill in all four fields.', { position: 'top-center' });
      return;
    }
    setLoading(true);
    // Split the full name into first / last for the existing PersonalInfo shape.
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ');

    const response = await fetch('/api/partner/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        companyName: agencyName.trim(),
        city: city.trim(),
        state,
        acceptedCprProviders: cpr,
      }),
    });
    const data: any = await response.json();
    setLoading(false);

    if (data.status === 200) {
      toast.success('Submitted — your agency is now pending verification.', {
        position: 'top-center',
      });
      window.location.href = '/partner/profile';
      return;
    }
    toast.error(data.message || 'Something went wrong. Please try again.', {
      position: 'top-center',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          Complete your agency account
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          A few details so we can verify your agency. This unlocks full access to
          caregiver credentials once confirmed.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              required
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-green-600"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Agency Name
            </label>
            <input
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Sunrise Home Care LLC"
              required
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-green-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Atlanta"
                required
                className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-3 outline-none focus:border-green-600 bg-white"
              >
                <option value="">Select…</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              CPR certifications you accept{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="mt-2 flex flex-col gap-2">
              {CPR_PROVIDERS.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={cpr.includes(p.value)}
                    onChange={() => toggleCpr(p.value)}
                    className="w-4 h-4 accent-green-700"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-3 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Submitting…' : 'Submit for verification'}
          </button>
        </form>
      </div>
    </div>
  );
}
