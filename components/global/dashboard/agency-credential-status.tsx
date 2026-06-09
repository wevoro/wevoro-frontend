'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ShieldCheck, Clock, Eye, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCredentialStatus } from '@/app/actions';
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
    return { text: 'Expired', color: '#ef4444', band: 'red' };
  }
  const text = `${diffDays} days ${diffHrs} hrs ${diffMin} min`;
  if (diffDays >= 60) return { text, color: '#22c55e', band: 'green' };
  if (diffDays >= 30) return { text, color: '#eab308', band: 'yellow' };
  return { text, color: '#ef4444', band: 'red' };
}

const STATE_BADGES: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  verified: {
    label: 'VERIFIED',
    className: 'bg-emerald-100 text-emerald-700',
    icon: <ShieldCheck className='w-3.5 h-3.5' />,
  },
  pending: {
    label: 'PENDING REVIEW',
    className: 'bg-gray-100 text-gray-500',
    icon: <Loader2 className='w-3.5 h-3.5' />,
  },
  not_uploaded: {
    label: 'NOT UPLOADED',
    className: 'bg-gray-100 text-gray-400',
    icon: <Upload className='w-3.5 h-3.5' />,
  },
  rejected: {
    label: 'ACTION REQUIRED',
    className: 'bg-orange-100 text-orange-600',
    icon: <AlertCircle className='w-3.5 h-3.5' />,
  },
};

interface AgencyCredentialCardProps {
  credential: CredentialStatus;
  index: number;
}

function AgencyCredentialCard({ credential, index }: AgencyCredentialCardProps) {
  const doc = credential.document;
  const isVerified = credential.state === 'verified';
  const badge = STATE_BADGES[credential.state] || STATE_BADGES.not_uploaded;
  const expiration = useMemo(
    () => isVerified ? getExpirationInfo(doc?.credentialExpirationDate) : null,
    [isVerified, doc?.credentialExpirationDate]
  );

  const cardBorder = isVerified
    ? {
        green: 'border-emerald-200',
        yellow: 'border-amber-200',
        red: 'border-red-200',
        gray: 'border-gray-200',
      }[expiration?.band || 'gray']
    : 'border-gray-200';

  const cardBg = isVerified
    ? {
        green: 'bg-emerald-50/50',
        yellow: 'bg-amber-50/50',
        red: 'bg-red-50/50',
        gray: 'bg-white',
      }[expiration?.band || 'gray']
    : 'bg-gray-50/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={`relative rounded-2xl border p-5 transition-shadow hover:shadow-sm ${cardBorder} ${cardBg}`}
    >
      {/* Top row with expiration countdown (verified only) */}
      {isVerified && expiration && (
        <div className='flex justify-end mb-3'>
          <div className='flex items-center gap-1.5 px-3 py-1.5 rounded-full' style={{ backgroundColor: `${expiration.color}15` }}>
            <Clock className='w-3.5 h-3.5' style={{ color: expiration.color }} />
            <span className='text-xs font-semibold' style={{ color: expiration.color }}>
              {expiration.text === 'Expired' ? 'Expired' : `Expires in ${expiration.text}`}
            </span>
          </div>
        </div>
      )}

      {/* Credential name + state badge */}
      <div className='flex items-center gap-3 mb-3'>
        <h3 className={`text-base font-bold ${isVerified ? 'text-gray-900' : 'text-gray-500'}`}>
          {credential.label}
        </h3>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
          {badge.icon}
          {badge.label}
        </span>
      </div>

      {/* Metadata (verified only) */}
      {isVerified && doc && (
        <>
          <div className='grid grid-cols-2 gap-x-6 gap-y-3 mb-4'>
            <div>
              <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>ID</p>
              <p className='text-sm font-medium text-gray-800'>{doc.credentialIdNumber || 'N/A'}</p>
            </div>
            <div>
              <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Issued Date</p>
              <p className='text-sm font-medium text-gray-800'>{formatDate(doc.credentialIssueDate)}</p>
            </div>
            <div>
              <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Expiration Date</p>
              <p className='text-sm font-medium text-gray-800'>{formatDate(doc.credentialExpirationDate)}</p>
            </div>
            <div>
              <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Issuing Organization</p>
              <p className='text-sm font-medium text-gray-800'>{doc.issuingOrganization || 'N/A'}</p>
            </div>
          </div>
          <div className='flex justify-end'>
            <a href={doc.url} target='_blank' rel='noopener noreferrer'>
              <Button variant='outline' size='sm' className='gap-2 rounded-xl'>
                <Eye className='w-4 h-4' />
                View Credential
              </Button>
            </a>
          </div>
        </>
      )}
    </motion.div>
  );
}

interface AgencyCredentialStatusProps {
  userId: string;
}

const AgencyCredentialStatus: React.FC<AgencyCredentialStatusProps> = ({ userId }) => {
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

  const verifiedCount = credentials.filter((c) => c.state === 'verified').length;

  return (
    <div className='flex flex-col gap-4'>
      {/* Section header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className='flex items-center justify-between w-full group'
      >
        <div className='flex items-center gap-2'>
          <ShieldCheck className='w-5 h-5 text-primary' />
          <h2 className='text-lg font-semibold text-gray-900'>Credentials Status</h2>
          <span className='text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full'>
            {verifiedCount} of {credentials.length} verified
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
        ) : (
          <ChevronUp className='w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
        )}
      </button>

      {!collapsed && (
        <div className='grid gap-3'>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-6 h-6 text-gray-400 animate-spin' />
            </div>
          ) : (
            credentials.map((cred, idx) => (
              <AgencyCredentialCard key={cred.key} credential={cred} index={idx} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AgencyCredentialStatus;
