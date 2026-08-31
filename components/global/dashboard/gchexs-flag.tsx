'use client';
import React from 'react';
import moment from 'moment';
import { ShieldX, HelpCircle } from 'lucide-react';
import type { GchexsStatus } from '@/app/types/types';

interface GchexsFlagProps {
  status: GchexsStatus;
  documentUrl?: string;
  isEditable?: boolean;
  onEdit?: () => void;
  showPrompt?: boolean;
  /** professionalInfo.gchexsUpdatedAt — design shows "Completed on <date>". */
  completedAt?: string;
}

/**
 * SCRUM-66: GCHEXS Background Check Self-Report Flag
 * Displays as a pill/badge in the identity block area.
 *
 * Variants:
 * - Yes + document: Green pill "GCHEXS Completed" + View link
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
}) => {
  if (status === 'not_set') {
    if (!showPrompt) return null;

    return (
      <div className='flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2'>
        <HelpCircle className='size-4 text-blue-500 flex-shrink-0' />
        <span className='text-xs text-blue-700'>
          Have you completed Georgia&apos;s GCHEXS fingerprinting?
        </span>
        {isEditable && onEdit && (
          <button
            onClick={onEdit}
            className='text-xs font-semibold text-blue-600 hover:text-blue-800 underline ml-1'
          >
            Answer now
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
