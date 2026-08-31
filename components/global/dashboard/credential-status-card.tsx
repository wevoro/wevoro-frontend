'use client';

// SCRUM-110: caregiver-facing credential card, rebuilt to the new design.
// One row per credential: name + status + privacy on the left, the live
// "Expires On" countdown and the view action on the right, and the extracted
// fields underneath.

import React, { useMemo } from 'react';
import {
  MoreVertical,
  RefreshCw,
  Trash2,
  CloudUpload,
  MoveUpRight,
  Globe,
  Lock,
  Clock,
  Calendar,
  Building2,
} from 'lucide-react';
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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getExpirationInfo(expirationDate?: string) {
  if (!expirationDate)
    return { band: 'gray' as const, days: 0, hrs: 0, min: 0, expired: false, hasExpiration: false };

  const now = new Date();
  const expDate = new Date(expirationDate);
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const diffHrs = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const diffMin = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

  if (diffMs <= 0) {
    return { band: 'red' as const, days: 0, hrs: 0, min: 0, expired: true, hasExpiration: true };
  }
  // Green 60+ days, yellow 30-60, red under 30.
  let band: 'green' | 'yellow' | 'red' = 'green';
  if (diffDays >= 60) band = 'green';
  else if (diffDays >= 30) band = 'yellow';
  else band = 'red';

  return { band, days: diffDays, hrs: diffHrs, min: diffMin, expired: false, hasExpiration: true };
}

/* ------------------------------------------------------------- statuses */

export type CardStatus =
  | 'confirmed'
  | 'expiresSoon'
  | 'expired'
  | 'notConfirmed'
  | 'pending';

const STATUS_STYLE: Record<CardStatus, { text: string; cls: string }> = {
  confirmed: { text: 'Confirmed', cls: 'bg-[#BBF8DC] text-[#008000]' },
  expiresSoon: { text: 'Expires Soon', cls: 'bg-[#FCFFDD] text-[#FAB607]' },
  expired: { text: 'Expired', cls: 'bg-[#FDE8E8] text-[#E94435]' },
  notConfirmed: { text: 'Not confirmed', cls: 'bg-[#FDE8E8] text-[#E94435]' },
  pending: { text: 'Pending review', cls: 'bg-[#FCFFDD] text-[#FAB607]' },
};

/** Resolve the badge a credential should carry. Exported so the PCA group can tint itself. */
export function resolveCardStatus(credential: CredentialStatus): CardStatus {
  const doc = credential.document;
  if (credential.state === 'rejected') return 'notConfirmed';
  if (credential.state !== 'verified') return 'pending';
  const exp = getExpirationInfo(doc?.credentialExpirationDate);
  if (!exp.hasExpiration || doc?.hasNoExpiration) return 'confirmed';
  if (exp.expired) return 'expired';
  if (exp.band === 'yellow' || exp.band === 'red') return 'expiresSoon';
  return 'confirmed';
}

/* --------------------------------------------------- per-credential fields */

interface FieldLabels {
  issued: string;
  expiration: string;
  issuer: string;
  viewAction: string;
}

const DEFAULT_FIELD_LABELS: FieldLabels = {
  issued: 'ISSUED DATE',
  expiration: 'EXPIRATION DATE',
  issuer: 'ISSUING ORGANIZATION',
  viewAction: 'View Credential',
};

const FIELD_LABELS_BY_KEY: Record<string, Partial<FieldLabels>> = {
  tb_tests: {
    issued: 'SERVICE DATE',
    expiration: 'INITIAL EXPIRATION',
    issuer: 'CLINIC / LAB',
    viewAction: 'View Record',
  },
  driver_license: { issuer: 'STATE' },
  auto_insurance: { issuer: 'CARRIER' },
};

function getFieldLabels(key?: string): FieldLabels {
  return { ...DEFAULT_FIELD_LABELS, ...(FIELD_LABELS_BY_KEY[key || ''] || {}) };
}

/** Extra identifier shown inline beside the ID (licence/policy number, TB result). */
function getInlineExtra(
  key: string | undefined,
  doc: CredentialStatus['document']
): { label: string; value: string; accent?: boolean } | null {
  if (!doc) return null;
  if (key === 'driver_license' && doc.credentialIdNumber)
    return { label: 'LICENSE NUMBER', value: doc.credentialIdNumber };
  if (key === 'auto_insurance' && doc.credentialIdNumber)
    return { label: 'POLICY NUMBER', value: doc.credentialIdNumber };
  if (key === 'tb_tests') return { label: 'INITIAL RESULT', value: 'Negative', accent: true };
  return null;
}

/* ------------------------------------------------------------ the card */

interface CredentialStatusCardProps {
  credential: CredentialStatus;
  onUpdateVerification?: () => void;
  onRemove?: () => void;
  index?: number;
  /** Agency view: same card, minus the caregiver-only controls. */
  readOnly?: boolean;
  /** Overrides the card heading (PCA parts render as "Written Exam (GACCP)"). */
  titleOverride?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Design hides the per-row menu; set true to bring it back. */
const SHOW_ROW_MENU = false;

const CredentialStatusCard: React.FC<CredentialStatusCardProps> = ({
  credential,
  onUpdateVerification,
  onRemove,
  readOnly = false,
  titleOverride,
}) => {
  const doc = credential.document;
  const status = useMemo(() => resolveCardStatus(credential), [credential]);
  const exp = useMemo(
    () => getExpirationInfo(doc?.credentialExpirationDate),
    [doc?.credentialExpirationDate]
  );
  const labels = getFieldLabels(credential.key);
  const extra = getInlineExtra(credential.key, doc);
  const badge = STATUS_STYLE[status];
  const isPublic = doc?.privacy === 'public';

  // The countdown shows dashes while a credential is still under review, and
  // for credentials that legitimately never expire.
  const showCounts = status !== 'pending';
  const noExpiry = doc?.hasNoExpiration || !exp.hasExpiration;
  const dash = !showCounts || noExpiry;

  return (
    <div className='rounded-xl border border-[#DFE2E0] bg-white px-5 py-4'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6'>
        {/* Left: name, status, ids, fields */}
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='text-base font-semibold leading-6 text-[#1C1C1C]'>
              {titleOverride || credential.label}
            </h3>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-[18px] ${badge.cls}`}
            >
              {badge.text}
            </span>
            <span
              title={isPublic ? 'Visible to agencies' : 'Private'}
              className='text-[#6C6C6C]'
            >
              {isPublic ? <Globe className='size-4' /> : <Lock className='size-4' />}
            </span>
          </div>

          {(doc?.wevoroCredentialId || doc?.credentialIdNumber || extra) && (
            <div className='mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#6C6C6C]'>
              {(doc?.wevoroCredentialId || doc?.credentialIdNumber) && (
                <span>ID: {doc?.wevoroCredentialId || doc?.credentialIdNumber}</span>
              )}
              {extra && (
                <span>
                  {extra.label}:{' '}
                  <span className={extra.accent ? 'font-medium text-[#008000]' : 'text-[#1C1C1C]'}>
                    {extra.value}
                  </span>
                </span>
              )}
            </div>
          )}

          {doc?.credentialIssueDate && (
            <div className='mt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs'>
              <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                <Clock className='size-3.5 shrink-0 text-[#9E9E9E]' />
                <span className='uppercase tracking-wide text-[#6C6C6C]'>{labels.issued}</span>
                <span className='text-[#1C1C1C]'>{formatDate(doc?.credentialIssueDate)}</span>
              </span>
              <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                <Calendar className='size-3.5 shrink-0 text-[#9E9E9E]' />
                <span className='uppercase tracking-wide text-[#6C6C6C]'>{labels.expiration}</span>
                <span className='text-[#1C1C1C]'>
                  {noExpiry ? 'No official expiration date' : formatDate(doc?.credentialExpirationDate)}
                </span>
              </span>
              {doc?.issuingOrganization && (
                <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                  <Building2 className='size-3.5 shrink-0 text-[#9E9E9E]' />
                  <span className='uppercase tracking-wide text-[#6C6C6C]'>{labels.issuer}</span>
                  <span className='text-[#1C1C1C]'>{doc.issuingOrganization}</span>
                </span>
              )}
            </div>
          )}

          {/* Why it was not confirmed */}
          {status === 'notConfirmed' && doc?.rejectionReason && (
            <div className='mt-3 rounded-lg bg-[#FDECEC] px-3 py-2'>
              <p className='text-xs font-semibold text-[#E94435]'>In-correct Information</p>
              <p className='mt-0.5 text-xs text-[#E94435]'>{doc.rejectionReason}</p>
              {doc.replacementRequested && (
                <p className='mt-1.5 inline-block rounded-full bg-[#FEF3D7] px-2 py-0.5 text-[11px] font-medium text-[#A9700B]'>
                  Replacement requested
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: countdown + action */}
        <div className='flex shrink-0 flex-wrap items-center gap-3'>
          <div className='flex items-center gap-1.5'>
            <span className='text-xs text-[#6C6C6C]'>Expires On</span>
            {[
              { v: exp.days, u: 'days' },
              { v: exp.hrs, u: 'hrs' },
              { v: exp.min, u: 'min' },
            ].map(({ v, u }) => (
              <React.Fragment key={u}>
                <span
                  className='inline-flex h-7 min-w-[34px] items-center justify-center rounded-md bg-[#F9F9FA] px-1.5 text-sm font-semibold text-[#1C1C1C]'
                >
                  {dash ? '–' : u === 'days' ? String(v).padStart(2, '0') : pad(v)}
                </span>
                <span className='text-[11px] text-[#6C6C6C]'>{u}</span>
              </React.Fragment>
            ))}
          </div>

          <a
            href={doc?.url || '#'}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#B0BCB8] bg-white px-3.5 text-[13px] font-medium text-[#1C1C1C] transition-colors hover:bg-gray-50'
          >
            {labels.viewAction}
            <MoveUpRight className='size-3.5' />
          </a>

          {/* NOTE: the design shows only "View Credential" here, so the
              three-dot menu is hidden. Re-upload / remove are still reachable
              from the Credentials side panel and the Completing Profile modal.
              Flip SHOW_ROW_MENU back to true to restore it inline. */}
          {SHOW_ROW_MENU && !readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='flex size-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100'>
                  <MoreVertical className='size-4 text-[#6C6C6C]' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem onClick={onUpdateVerification} className='cursor-pointer gap-2'>
                  {status === 'confirmed' || status === 'expiresSoon' ? (
                    <>
                      <RefreshCw className='size-4' /> Update Confirmation
                    </>
                  ) : (
                    <>
                      <CloudUpload className='size-4' /> Re-upload Document
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onRemove}
                  className='cursor-pointer gap-2 text-red-600 focus:text-red-600'
                >
                  <Trash2 className='size-4' /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};

export default CredentialStatusCard;
