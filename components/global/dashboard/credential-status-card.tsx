'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Clock, MoreVertical, Eye, RefreshCw, Trash2 } from 'lucide-react';
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
  if (!expirationDate) return { text: 'N/A', color: 'gray', band: 'gray' };
  
  const now = new Date();
  const expDate = new Date(expirationDate);
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs <= 0) {
    return { text: 'Expired', color: '#ef4444', band: 'red', days: 0, hrs: 0, min: 0 };
  }
  
  const text = `${diffDays} days ${diffHrs} hrs ${diffMin} min`;
  
  if (diffDays >= 60) {
    return { text, color: '#22c55e', band: 'green', days: diffDays, hrs: diffHrs, min: diffMin };
  } else if (diffDays >= 30) {
    return { text, color: '#eab308', band: 'yellow', days: diffDays, hrs: diffHrs, min: diffMin };
  } else {
    return { text, color: '#ef4444', band: 'red', days: diffDays, hrs: diffHrs, min: diffMin };
  }
}

interface CredentialStatusCardProps {
  credential: CredentialStatus;
  onUpdateVerification?: () => void;
  onRemove?: () => void;
  index?: number;
}

const CredentialStatusCard: React.FC<CredentialStatusCardProps> = ({
  credential,
  onUpdateVerification,
  onRemove,
  index = 0,
}) => {
  const doc = credential.document;
  const expiration = useMemo(
    () => getExpirationInfo(doc?.credentialExpirationDate),
    [doc?.credentialExpirationDate]
  );

  const bandBg = {
    green: 'bg-emerald-50 border-emerald-200',
    yellow: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200',
  }[expiration.band];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`relative bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${bandBg}`}
    >
      {/* Top row: Verified by + Expiration countdown */}
      <div className='flex items-start justify-between mb-3'>
        <p className='text-xs text-gray-400'>
          Verified by Wevoro on {formatDate(doc?.reviewedAt)}
        </p>
        <div className='flex items-center gap-2'>
          {/* Expiration countdown */}
          <div className='flex items-center gap-1.5 px-3 py-1.5 rounded-full' style={{ backgroundColor: `${expiration.color}15` }}>
            <Clock className='w-3.5 h-3.5' style={{ color: expiration.color }} />
            <span className='text-xs font-semibold' style={{ color: expiration.color }}>
              {expiration.text === 'Expired' ? 'Expired' : `Expires in ${expiration.text}`}
            </span>
          </div>
          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors'>
                <MoreVertical className='w-4 h-4 text-gray-400' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={onUpdateVerification} className='gap-2 cursor-pointer'>
                <RefreshCw className='w-4 h-4' />
                Update Verification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} className='gap-2 cursor-pointer text-red-600 focus:text-red-600'>
                <Trash2 className='w-4 h-4' />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Credential name + badge */}
      <div className='flex items-center gap-3 mb-4'>
        <h3 className='text-lg font-bold text-gray-900'>{credential.label}</h3>
        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold'>
          <ShieldCheck className='w-3.5 h-3.5' />
          VERIFIED
        </span>
      </div>

      {/* Metadata grid */}
      <div className='grid grid-cols-2 gap-x-6 gap-y-3 mb-4'>
        <div>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>ID</p>
          <p className='text-sm font-medium text-gray-800'>{doc?.credentialIdNumber || 'N/A'}</p>
        </div>
        <div>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Issued Date</p>
          <p className='text-sm font-medium text-gray-800'>{formatDate(doc?.credentialIssueDate)}</p>
        </div>
        <div>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Expiration Date</p>
          <p className='text-sm font-medium text-gray-800'>{formatDate(doc?.credentialExpirationDate)}</p>
        </div>
        <div>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Issuing Organization</p>
          <p className='text-sm font-medium text-gray-800'>{doc?.issuingOrganization || 'N/A'}</p>
        </div>
      </div>

      {/* View Credential button */}
      <div className='flex justify-end'>
        <a href={doc?.url} target='_blank' rel='noopener noreferrer'>
          <Button variant='outline' size='sm' className='gap-2 rounded-xl'>
            <Eye className='w-4 h-4' />
            View Credential
          </Button>
        </a>
      </div>
    </motion.div>
  );
};

export default CredentialStatusCard;
