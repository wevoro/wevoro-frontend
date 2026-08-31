'use client';

// SCRUM-109: admin "Mark document as not confirmed" flow.
// The admin picks one of the 9 rejection reasons, writes (or accepts) the
// caregiver-facing message, and optionally requests a replacement document.
// The AI may pre-select a reason and pre-fill the message, but the admin always
// makes the final decision ("training wheels" phase).

import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  RejectionReasonCode,
  getSelectableReasons,
  getFixedMessage,
  hasFixedMessage,
  isAiSuggestOnly,
} from '@/lib/rejection-reasons';

export interface AiSuggestion {
  reason: RejectionReasonCode;
  message?: string;
  /** 0–1, shown to the admin as context only. */
  confidence?: number;
}

interface MarkNotConfirmedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  /** Credential key from lib/credential-config (certifications, cpr_test, ...). */
  credentialKey?: string;
  credentialLabel: string;
  credentialIdNumber?: string;
  uploadedAt?: string;
  /** Optional AI pre-selection. Admin can always override. */
  aiSuggestion?: AiSuggestion;
  onSuccess: (data: any) => void;
}

function formatUploaded(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const MarkNotConfirmedModal: React.FC<MarkNotConfirmedModalProps> = ({
  open,
  onOpenChange,
  documentId,
  credentialKey,
  credentialLabel,
  credentialIdNumber,
  uploadedAt,
  aiSuggestion,
  onSuccess,
}) => {
  const reasons = useMemo(() => getSelectableReasons(credentialKey), [credentialKey]);

  const [reason, setReason] = useState<RejectionReasonCode | ''>('');
  const [message, setMessage] = useState('');
  const [requestReplacement, setRequestReplacement] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Seed from the AI suggestion each time the modal opens, but only if the
  // suggested reason is actually selectable for this credential.
  useEffect(() => {
    if (!open) return;
    const suggested = aiSuggestion?.reason;
    const allowed = suggested && reasons.some((r) => r.code === suggested);
    if (allowed) {
      setReason(suggested);
      setMessage(getFixedMessage(credentialKey, suggested) ?? aiSuggestion?.message ?? '');
    } else {
      setReason('');
      setMessage('');
    }
    setRequestReplacement(true);
    setError('');
  }, [open, aiSuggestion, credentialKey, reasons]);

  const fixedMessage = reason ? getFixedMessage(credentialKey, reason) : undefined;
  const messageLocked = !!fixedMessage;
  const escalatesToReview = reason ? isAiSuggestOnly(reason) : false;
  const usedAiSuggestion = !!aiSuggestion && reason === aiSuggestion.reason;

  const handleReasonChange = (value: string) => {
    const code = value as RejectionReasonCode;
    setReason(code);
    setError('');
    const fixed = getFixedMessage(credentialKey, code);
    if (fixed) {
      setMessage(fixed);
    } else if (hasFixedMessage(credentialKey, reason as RejectionReasonCode)) {
      // moving off a fixed-message reason: clear the locked text
      setMessage('');
    }
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError('Select a reason.');
      return;
    }
    if (!message.trim()) {
      setError('Write a message for the caregiver.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/document-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          reviewStatus: 'rejected',
          rejectionReasonCode: reason,
          rejectionReason: message.trim(),
          requestReplacement,
          // SCRUM-109: accuracy logging — did the admin keep the AI's suggestion?
          aiSuggestedReason: aiSuggestion?.reason ?? null,
          adminAgreedWithAi: aiSuggestion ? aiSuggestion.reason === reason : null,
        }),
      });
      const data = await res.json();
      if (data.status === 200) {
        toast.success(`${credentialLabel} marked as not confirmed`);
        onSuccess(data.data);
        onOpenChange(false);
      } else {
        toast.error(data.message || 'Could not submit the response');
      }
    } catch {
      toast.error('Could not submit the response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploaded = formatUploaded(uploadedAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>Mark document as not confirmed</DialogTitle>
          <DialogDescription className='text-gray-500'>
            Select a reason and tell the caregiver what needs to change.
          </DialogDescription>
        </DialogHeader>

        {/* Document summary */}
        <div className='flex items-start justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3'>
          <div className='min-w-0'>
            <p className='font-semibold text-gray-900'>{credentialLabel}</p>
            <p className='mt-0.5 truncate text-sm text-gray-500'>
              {credentialIdNumber ? `Certificate ID: ${credentialIdNumber}` : 'No certificate ID'}
              {uploaded ? ` · Uploaded ${uploaded}` : ''}
            </p>
          </div>
          <span className='shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600'>
            Pending review
          </span>
        </div>

        <div className='flex flex-col gap-4'>
          {/* Reason */}
          <div>
            <Label className='text-base font-semibold text-gray-900'>Reason for not confirming</Label>
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger className='mt-2 h-12 w-full rounded-xl'>
                <SelectValue placeholder='Select a reason' />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem
                    key={r.code}
                    value={r.code}
                    className='focus:bg-emerald-50 focus:text-emerald-700 data-[state=checked]:bg-emerald-50 data-[state=checked]:font-medium data-[state=checked]:text-emerald-700'
                  >
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {usedAiSuggestion && (
              <p className='mt-2 flex items-center gap-1.5 text-xs text-blue-600'>
                <Sparkles className='size-3.5' />
                Suggested by AI
                {typeof aiSuggestion?.confidence === 'number'
                  ? ` · ${Math.round(aiSuggestion.confidence * 100)}% confidence`
                  : ''}
                . You can change it.
              </p>
            )}

            {escalatesToReview && (
              <p className='mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700'>
                <AlertTriangle className='mt-0.5 size-3.5 shrink-0' />
                This reason always goes to a person to review. Nothing is sent to the caregiver
                automatically — write the message yourself.
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <Label htmlFor='caregiver-message' className='text-base font-semibold text-gray-900'>
              Message to caregiver
            </Label>
            <Textarea
              id='caregiver-message'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              readOnly={messageLocked}
              rows={4}
              placeholder='Tell the caregiver what needs to change.'
              className={`mt-2 rounded-xl ${messageLocked ? 'bg-gray-50 text-gray-600' : ''}`}
            />
            {messageLocked && (
              <p className='mt-1 text-xs text-gray-500'>
                This message is fixed for this reason and cannot be edited.
              </p>
            )}
          </div>

          {/* Replacement */}
          <label className='flex cursor-pointer items-start gap-3'>
            <Checkbox
              checked={requestReplacement}
              onCheckedChange={(v) => setRequestReplacement(v === true)}
              className='mt-0.5 size-5 rounded data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600'
            />
            <span>
              <span className='block font-semibold text-gray-900'>Request a replacement document</span>
              <span className='block text-sm text-gray-500'>
                The credential remains Not confirmed until the replacement is reviewed.
              </span>
            </span>
          </label>

          {error && <p className='text-sm text-red-500'>{error}</p>}
        </div>

        <DialogFooter className='gap-2 sm:gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className='rounded-xl px-8'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className='rounded-xl bg-red-500 px-8 text-white hover:bg-red-600'
          >
            {loading ? 'Submitting…' : 'Submit response'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkNotConfirmedModal;
