'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MoreVertical, Eye, RefreshCw, Trash2, AlertCircle, Hourglass, CloudUpload, MoveUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CredentialStatus } from '@/lib/credential-config';

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getExpirationInfo(expirationDate?: string) {
  if (!expirationDate) return { band: 'gray' as const, days: 0, hrs: 0, min: 0, expired: false, hasExpiration: false };

  const now = new Date();
  const expDate = new Date(expirationDate);
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const diffHrs = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const diffMin = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

  if (diffMs <= 0) {
    return { band: 'red' as const, days: 0, hrs: 0, min: 0, expired: true, hasExpiration: true };
  }

  // BUG-07: Color bands per spec
  // Green — Verified, 60+ days until expiration
  // Yellow — Verified, 30-60 days until expiration
  // Red — Verified, under 30 days or expired
  let band: 'green' | 'yellow' | 'red' = 'green';
  if (diffDays >= 60) band = 'green';
  else if (diffDays >= 30) band = 'yellow';
  else band = 'red';

  return { band, days: diffDays, hrs: diffHrs, min: diffMin, expired: false, hasExpiration: true };
}

// Color configs for each band
const BAND_COLORS = {
  green: {
    border: 'border-gray-200',
    bg: 'bg-white',
    countdownText: 'text-emerald-600',
    countdownBg: 'bg-emerald-50',
  },
  yellow: {
    border: 'border-gray-200',
    bg: 'bg-white',
    countdownText: 'text-amber-600',
    countdownBg: 'bg-amber-50',
  },
  red: {
    border: 'border-gray-200',
    bg: 'bg-white',
    countdownText: 'text-red-600',
    countdownBg: 'bg-red-50',
  },
  gray: {
    border: 'border-gray-200',
    bg: 'bg-white',
    countdownText: 'text-gray-500',
    countdownBg: 'bg-gray-50',
  },
};

interface CredentialStatusCardProps {
  credential: CredentialStatus;
  onUpdateVerification?: () => void;
  onRemove?: () => void;
  index?: number;
  // SCRUM-63: agency view reuses this exact card as a read-only, subtraction-based
  // variant of the caregiver card — same structure/styling/copy, minus the
  // caregiver-only elements (Verified-by-Wevoro line, three-dot menu, editability).
  readOnly?: boolean;
}

const CredentialStatusCard: React.FC<CredentialStatusCardProps> = ({
  credential,
  onUpdateVerification,
  onRemove,
  index = 0,
  readOnly = false,
}) => {
  const doc = credential.document;
  const state = credential.state;
  const isVerified = state === 'verified';
  const isPending = state === 'pending';
  const isRejected = state === 'rejected';

  const expiration = useMemo(
    () => getExpirationInfo(doc?.credentialExpirationDate),
    [doc?.credentialExpirationDate]
  );

  // Determine band color
  const bandKey = isVerified
    ? expiration.band
    : isPending
    ? 'gray' as const
    : 'red' as const;

  const colors = BAND_COLORS[bandKey];

  // Status badge config
  const statusConfig = isVerified
    ? { icon: <ShieldCheck className='w-3.5 h-3.5' />, text: 'VERIFIED', bg: 'bg-emerald-100 text-emerald-700' }
    : isRejected
    ? { icon: <AlertCircle className='w-3.5 h-3.5' />, text: 'REJECTED', bg: 'bg-red-100 text-red-700' }
    : { icon: <Hourglass className='w-3.5 h-3.5' />, text: 'PENDING', bg: 'bg-amber-100 text-amber-700' };

  // Two-digit pad for countdown
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`relative rounded-2xl border overflow-hidden ${colors.border} ${colors.bg} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className='p-5'>
        {/* Top row: verification info + expiration countdown + menu.
            readOnly (agency): drop the "Verified by Wevoro on…" line and the
            three-dot menu — only the expiration countdown remains. */}
        {(!readOnly || (isVerified && expiration.hasExpiration)) && (
        <div className={`flex items-start ${readOnly ? 'justify-end' : 'justify-between'} mb-3`}>
          {!readOnly && (
          <p className='text-xs text-gray-400'>
            {isVerified
              ? `Verified by Wevoro on ${formatDate(doc?.reviewedAt)}`
              : isPending
              ? `Uploaded on ${formatDate(doc?.createdAt)}`
              : `Rejected — please re-upload`}
          </p>
          )}
          <div className='flex items-center gap-2'>
            {/* Expiration countdown (reference design style) */}
            {isVerified && expiration.hasExpiration && (
              <div className='flex items-center gap-1'>
                <span className='text-xs text-gray-400 mr-1'>Expires On</span>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${colors.countdownBg} ${colors.countdownText}`}>
                  {pad(expiration.days)}
                </span>
                <span className='text-[10px] text-gray-400'>days</span>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${colors.countdownBg} ${colors.countdownText}`}>
                  {pad(expiration.hrs)}
                </span>
                <span className='text-[10px] text-gray-400'>hrs</span>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${colors.countdownBg} ${colors.countdownText}`}>
                  {pad(expiration.min)}
                </span>
                <span className='text-[10px] text-gray-400'>min</span>
              </div>
            )}
            {/* Three-dot menu (caregiver-only) */}
            {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors'>
                  <MoreVertical className='w-4 h-4 text-gray-400' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem onClick={onUpdateVerification} className='gap-2 cursor-pointer'>
                  {isPending || isRejected ? (
                    <>
                      <CloudUpload className='w-4 h-4' />
                      Re-upload Document
                    </>
                  ) : (
                    <>
                      <RefreshCw className='w-4 h-4' />
                      Update Verification
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRemove} className='gap-2 cursor-pointer text-red-600 focus:text-red-600'>
                  <Trash2 className='w-4 h-4' />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
          </div>
        </div>
        )}

        {/* Credential name + badge */}
        <div className='flex items-center gap-3 mb-2'>
          <h3 className='text-lg font-bold text-gray-900'>{credential.label}</h3>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg}`}>
            {statusConfig.icon}
            {statusConfig.text}
          </span>
        </div>

        {/* Credential ID */}
        {isVerified && doc?.credentialIdNumber && (
          <p className='text-xs text-gray-400 mb-3'>ID: {doc.credentialIdNumber}</p>
        )}

        {/* Rejection reason */}
        {isRejected && doc?.rejectionReason && (
          <div className='mb-4 p-3 rounded-xl bg-red-100/50 border border-red-200'>
            <p className='text-xs font-semibold text-red-700 mb-1'>Rejection Reason:</p>
            <p className='text-xs text-red-600'>{doc.rejectionReason}</p>
          </div>
        )}

        {/* Metadata row (reference design: issued date, expiration date, issuing org) */}
        {isVerified && (
          <div className='flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 text-xs text-gray-500'>
            <div className='flex items-center gap-1.5'>
              <span className='text-gray-400'>⊕</span>
              <span className='font-medium uppercase tracking-wider text-[10px] text-gray-400'>ISSUED DATE</span>
              <span className='text-gray-700 font-medium'>{formatDate(doc?.credentialIssueDate)}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-gray-400'>⊕</span>
              <span className='font-medium uppercase tracking-wider text-[10px] text-gray-400'>EXPIRATION DATE</span>
              <span className='text-gray-700 font-medium'>{formatDate(doc?.credentialExpirationDate)}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-gray-400'>⊞</span>
              <span className='font-medium uppercase tracking-wider text-[10px] text-gray-400'>ISSUING ORGANIZATION</span>
              <span className='text-gray-700 font-medium'>{doc?.issuingOrganization || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Pending info */}
        {isPending && (
          <p className='text-xs text-amber-600 mb-4'>
            Your document is being reviewed by the Wevoro team. You&apos;ll be notified once it&apos;s processed.
          </p>
        )}

        {/* Action buttons */}
        <div className='flex justify-end gap-2'>
          {/* View Credential */}
          <a href={doc?.url} target='_blank' rel='noopener noreferrer'>
            <Button variant='outline' size='sm' className='gap-2 rounded-xl'>
              <Eye className='w-4 h-4' />
              View Credential
              <MoveUpRight className='w-3 h-3' />
            </Button>
          </a>
          {/* Re-upload for rejected (caregiver-only) */}
          {!readOnly && isRejected && (
            <Button
              variant='default'
              size='sm'
              className='gap-2 rounded-xl'
              onClick={onUpdateVerification}
            >
              <CloudUpload className='w-4 h-4' />
              Re-upload
            </Button>
          )}
          {/* Update for pending (caregiver-only) */}
          {!readOnly && isPending && (
            <Button
              variant='outline'
              size='sm'
              className='gap-2 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50'
              onClick={onUpdateVerification}
            >
              <RefreshCw className='w-4 h-4' />
              Update
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CredentialStatusCard;
