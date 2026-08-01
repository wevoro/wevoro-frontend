'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { getCredentialStatus } from '@/app/actions';
import CredentialStatusCard from './credential-status-card';
import type { CredentialStatus } from '@/lib/credential-config';

interface AgencyCredentialStatusProps {
  userId: string;
}

/**
 * SCRUM-63: agency's view of a caregiver's Credentials Status.
 *
 * This is a subtraction-based variant of the caregiver-side section
 * (credential-status-section.tsx): identical container, header, badges, card
 * structure, status bands, expiration countdown and copy — it reuses the same
 * CredentialStatusCard in `readOnly` mode, which removes only the caregiver-only
 * elements (the "Confirmed by Wevoro on …" line, the three-dot menu, and the
 * edit/re-upload actions).
 */
const AgencyCredentialStatus: React.FC<AgencyCredentialStatusProps> = ({
  userId,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [credentials, setCredentials] = useState<CredentialStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getCredentialStatus(userId).then((data) => {
      if (data) setCredentials(data);
      setLoading(false);
    });
  }, [userId]);

  // Show ALL uploaded credentials (verified, pending, rejected) — parity with
  // the caregiver section.
  const uploadedCredentials = (credentials ?? []).filter(
    (c: CredentialStatus) => c.state !== 'not_uploaded'
  );
  const verifiedCount = uploadedCredentials.filter((c) => c.state === 'verified').length;
  const pendingCount = uploadedCredentials.filter((c) => c.state === 'pending').length;
  const rejectedCount = uploadedCredentials.filter((c) => c.state === 'rejected').length;

  if (loading) {
    return (
      <div className='bg-white md:rounded-2xl px-4 p-6 md:p-8'>
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='w-6 h-6 text-gray-400 animate-spin' />
        </div>
      </div>
    );
  }

  // Match caregiver behavior: nothing uploaded => render nothing.
  if (uploadedCredentials.length === 0) return null;

  return (
    // White background container matching Personal/Professional Information sections
    <div className='bg-white md:rounded-2xl px-4 p-6 md:p-8'>
      <div className='flex flex-col gap-4'>
        {/* Section header — matches caregiver-side heading size, weight & badges */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className='flex items-center justify-between w-full group border-b pb-4'
        >
          <div className='flex items-center gap-2 flex-wrap'>
            <h2 className='text-lg md:text-2xl font-semibold text-tertiary'>
              Credentials Status
            </h2>
            <div className='flex items-center gap-1.5'>
              {verifiedCount > 0 && (
                <span className='text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium'>
                  {verifiedCount} confirmed
                </span>
              )}
              {pendingCount > 0 && (
                <span className='text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium'>
                  {pendingCount} pending
                </span>
              )}
              {rejectedCount > 0 && (
                <span className='text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium'>
                  {rejectedCount} rejected
                </span>
              )}
            </div>
          </div>
          {collapsed ? (
            <ChevronDown className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          ) : (
            <ChevronUp className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
          )}
        </button>

        {!collapsed && (
          <div className='grid gap-4'>
            {uploadedCredentials.map((cred: CredentialStatus, idx: number) => (
              <CredentialStatusCard
                key={cred.key}
                credential={cred}
                index={idx}
                readOnly
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyCredentialStatus;
