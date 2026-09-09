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

  // SCRUM-63 Scenario 1 and 4: the agency sees ALL five required credentials,
  // including the ones the caregiver has not uploaded — that is the deliberate
  // Model C difference from the caregiver's own section, which lists only what
  // has been uploaded. An agency deciding whether to hire needs to see that a
  // TB Test is missing, not just be shown the four that exist. The card itself
  // renders the not-uploaded state as a name plus a badge with no metadata and
  // no View Credential action.
  const shownCredentials = credentials ?? [];
  const verifiedCount = shownCredentials.filter((c) => c.state === 'verified').length;
  const pendingCount = shownCredentials.filter((c) => c.state === 'pending').length;
  const rejectedCount = shownCredentials.filter((c) => c.state === 'rejected').length;
  const missingCount = shownCredentials.filter((c) => c.state === 'not_uploaded').length;

  if (loading) {
    return (
      <div className='bg-white md:rounded-2xl px-4 p-6 md:p-8'>
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='w-6 h-6 text-gray-400 animate-spin' />
        </div>
      </div>
    );
  }

  // Only when the caregiver has no configured credentials at all (no role yet)
  // is there nothing to show. A caregiver who has uploaded none of the five
  // still renders five not-uploaded cards, per SCRUM-63 Scenario 1.
  if (shownCredentials.length === 0) return null;

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
              {missingCount > 0 && (
                <span className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium'>
                  {missingCount} not uploaded
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
            {shownCredentials.map((cred: CredentialStatus, idx: number) => (
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
