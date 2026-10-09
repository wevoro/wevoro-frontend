'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OnboardConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caregiverName: string;
  caregiverRole?: string | null;
  /** Active signing documents the agency has for this caregiver's role. */
  signingDocuments: number;
  submitting: boolean;
  onConfirm: () => void;
}

/**
 * SCRUM-141 / SCRUM-117 — the confirmation shown before an agency onboards a
 * caregiver. Faisal's A2 frame: the exchange in one sentence — the caregiver
 * signs, the agency gets the package — with "Not now" / "Send onboarding
 * request". When the agency has no documents for the caregiver's role (they
 * chose "Continue anyway" on the SCRUM-117 prompt), it says nothing will be
 * sent to sign.
 */
const OnboardConfirmModal: React.FC<OnboardConfirmModalProps> = ({
  open,
  onOpenChange,
  caregiverName,
  caregiverRole,
  signingDocuments,
  submitting,
  onConfirm,
}) => {
  const role = caregiverRole || 'CNA';
  /**
   * The profile answers a moment after the action bar appears, so an agency
   * that pressed Onboard straight away read "Onboard This caregiver?" and
   * "once This responds" — the placeholder, first-named. When the name is not
   * known yet the sentence uses a whole phrase and a pronoun instead.
   */
  const full = (caregiverName || '').trim();
  const known = !!full && full.toLowerCase() !== 'this caregiver';
  const who = known ? full : 'this caregiver';
  const first = known ? full.split(/\s+/)[0] : 'The caregiver';
  const signs = known ? `${first} signs` : 'they sign';
  const responds = known ? `${first} responds` : 'they respond';
  const docWord = signingDocuments === 1 ? 'document' : 'documents';

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className='max-w-[560px] gap-0 rounded-[18px] px-7 py-6'>
        <DialogTitle className='pr-8 text-[18px] font-semibold leading-6 text-[#1C1C1C]'>
          Onboard {who}?
        </DialogTitle>
        <DialogDescription className='mt-[18px] text-[14px] leading-[22px] text-[#6C6C6C]'>
          {signingDocuments > 0
            ? `${first} will be asked to sign the ${signingDocuments} ${docWord} your agency has uploaded. Once ${signs}, their credential package becomes available for you to download.`
            : `You have no ${role} documents, so nothing will be sent to sign. ${first} will be asked to respond, and once ${responds}, the credential package becomes available for you to download.`}
        </DialogDescription>
        <div className='mt-[18px] flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className='h-11 rounded-[10px] border-[#DFE2E0] px-5 text-[14px] font-medium text-[#1C1C1C]'
          >
            Not now
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting}
            className='h-11 gap-2 rounded-[10px] bg-[#008000] px-5 text-[14px] font-medium text-white hover:bg-[#016b01]'
          >
            {submitting && <Loader2 className='size-4 animate-spin' />}
            Send onboarding request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardConfirmModal;
