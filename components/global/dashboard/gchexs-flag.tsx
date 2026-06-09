'use client';
import React from 'react';
import { ShieldCheck, ShieldX, Eye, HelpCircle } from 'lucide-react';
import type { GchexsStatus } from '@/app/types/types';

interface GchexsFlagProps {
  status: GchexsStatus;
  documentUrl?: string;
  isEditable?: boolean;
  onEdit?: () => void;
  showPrompt?: boolean;
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
      <div className='inline-flex items-center gap-1.5'>
        <div className='inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1'>
          <ShieldCheck className='size-3.5 text-emerald-600' />
          <span className='text-[11px] font-semibold text-emerald-700'>
            GCHEXS Completed{!documentUrl && ' (Self-Reported)'}
          </span>
          {documentUrl && (
            <a
              href={documentUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 hover:text-emerald-800 ml-1'
            >
              <Eye className='size-3' />
              View
            </a>
          )}
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
