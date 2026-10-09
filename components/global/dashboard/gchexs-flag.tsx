'use client';
import React from 'react';
import moment from 'moment';
import { ShieldX } from 'lucide-react';
import type { GchexsStatus } from '@/app/types/types';

interface GchexsFlagProps {
  status: GchexsStatus;
  documentUrl?: string;
  isEditable?: boolean;
  onEdit?: () => void;
  showPrompt?: boolean;
  /** professionalInfo.gchexsUpdatedAt — design shows "Completed on <date>". */
  completedAt?: string;
  /**
   * SCRUM-193: the reviewStatus of the uploaded GCHEXS Confirmation document.
   * Omitted when this view has no access to it (the agency/admin read-only
   * view), in which case the line reads exactly as it did before.
   */
  reviewStatus?: 'pending' | 'approved' | 'rejected';
}

/**
 * SCRUM-193: what WeVoro has actually done with the uploaded confirmation,
 * worded and coloured exactly as the Credentials widget words it for the same
 * document (REVIEW_LOOK in credentials-panel.tsx).
 *
 * "GCHEXS Completed on <date>" is only the caregiver's own answer plus the day
 * they answered it — nothing on this line has ever been a verification. The
 * qualifier was dropped as soon as a file was attached, which is precisely the
 * state in which the document is waiting for review, so the section read as a
 * finished background check while the Credentials widget still showed the same
 * document as Pending. The two now say the same thing.
 */
const CONFIRMATION_LOOK: Record<
  NonNullable<GchexsFlagProps['reviewStatus']>,
  { label: string; color: string }
> = {
  approved: { label: 'Reviewed by WeVoro', color: '#1A7A3C' },
  pending: { label: 'Pending WeVoro review', color: '#7A5600' },
  rejected: { label: 'Not confirmed by WeVoro', color: '#A32219' },
};

/**
 * SCRUM-66: GCHEXS Background Check Self-Report Flag
 * Displays as a pill/badge in the identity block area.
 *
 * Variants:
 * - Yes + document: Green pill "GCHEXS Completed" + View link, followed by
 *   SCRUM-193's review state of that document when the caller knows it
 * - Yes, no document: Green pill "GCHEXS Completed (Self-Reported)"
 * - No: Grey pill "GCHEXS Not Completed"
 * - Not Set + showPrompt: Inline prompt to answer
 */
const GchexsFlag: React.FC<GchexsFlagProps> = ({
  status,
  documentUrl,
  isEditable = false,
  onEdit,
  showPrompt = false,
  completedAt,
  reviewStatus,
}) => {
  const confirmation = reviewStatus ? CONFIRMATION_LOOK[reviewStatus] : null;
  if (status === 'not_set') {
    if (!showPrompt) return null;

    // The prompt carries its own heading, so the section hides its title in
    // this state and the card is the whole block.
    return (
      <div className='flex flex-col gap-4 rounded-xl border border-[#DFE2E0] p-5 sm:flex-row sm:items-center sm:justify-between md:p-6'>
        <div className='min-w-0'>
          <p className='text-[17px] md:text-[20px] font-semibold text-[#1C1C1C]'>
            Background check
          </p>
          <p className='mt-1 text-[14px] md:text-[15px] text-[#5E6864]'>
            Have you completed Georgia&apos;s GCHEXS fingerprinting?
          </p>
        </div>
        {isEditable && onEdit && (
          <button
            onClick={onEdit}
            className='inline-flex h-[44px] shrink-0 items-center justify-center rounded-lg bg-[#008000] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#026a02]'
          >
            Answer Now
          </button>
        )}
      </div>
    );
  }

  if (status === 'yes') {
    return (
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <p className='text-sm md:text-base text-[#5E6864]'>
          Have you completed Georgia&apos;s GCHEXS fingerprinting?{' '}
          <span className='text-[#008000]'>
            GCHEXS Completed
            {completedAt && ` on ${moment(completedAt).format('MMM D, YYYY')}`}
            {!documentUrl && ' (Self-Reported)'}
          </span>
          {/* SCRUM-193: the review state of the uploaded confirmation, in the
              Credentials widget's own words, so a self-report with a file
              waiting for review no longer reads as a completed check. */}
          {confirmation && (
            <span className='font-medium' style={{ color: confirmation.color }}>
              {' · '}
              {confirmation.label}
            </span>
          )}
        </p>
        {(documentUrl || (isEditable && onEdit)) && (
          <div className='flex items-center gap-3 flex-shrink-0'>
            {documentUrl && (
              <a
                href={documentUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center justify-center h-[37px] px-4 rounded-lg border border-[#DFE2E0] bg-white text-sm font-medium text-[#008000] hover:bg-gray-50'
              >
                View
              </a>
            )}
            {isEditable && onEdit && (
              <button
                onClick={onEdit}
                className='inline-flex items-center justify-center h-[37px] px-4 rounded-lg border border-[#DFE2E0] bg-white text-sm font-medium text-[#1C1C1C] hover:bg-gray-50'
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // status === 'no'
  return (
    <div className='inline-flex items-center gap-1.5'>
      <div className='inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1'>
        <ShieldX className='size-3.5 text-gray-500' />
        <span className='text-[11px] font-medium text-gray-600'>
          GCHEXS Not Completed
        </span>
      </div>
      {isEditable && onEdit && (
        <button
          onClick={onEdit}
          className='text-[10px] text-gray-400 hover:text-gray-600 underline'
        >
          Edit
        </button>
      )}
    </div>
  );
};

export default GchexsFlag;
