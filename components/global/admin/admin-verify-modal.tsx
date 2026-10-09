'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Sparkles, Loader2, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AdminVerifyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  credentialLabel: string;
  existingData?: {
    credentialIdNumber?: string;
    credentialIssueDate?: string;
    credentialExpirationDate?: string;
    issuingOrganization?: string;
    hasNoExpiration?: boolean;
  };
  onSuccess: (data: any) => void;
}

function toDateInputValue(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

const AdminVerifyModal: React.FC<AdminVerifyModalProps> = ({
  open,
  onOpenChange,
  documentId,
  credentialLabel,
  existingData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    credentialIdNumber: existingData?.credentialIdNumber || '',
    credentialIssueDate: toDateInputValue(existingData?.credentialIssueDate) || '',
    credentialExpirationDate: toDateInputValue(existingData?.credentialExpirationDate) || '',
    issuingOrganization: existingData?.issuingOrganization || '',
  });
  // SCRUM-109: "Reviewed, no fixed renewal" — some credentials genuinely have
  // no expiry (PCA written exam / practical sign-off, GCHEXS). Before this,
  // admins had to invent a date to get the form to submit.
  const [hasNoExpiration, setHasNoExpiration] = useState(
    existingData?.hasNoExpiration === true
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  // What the AI read off the file. A suggestion: it pre-fills the four fields
  // and lists what looked wrong; the admin still decides.
  const [ai, setAi] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  // An admin can switch AI assist off entirely on the AI Automation page. Then
  // the panel is not shown at all — an empty form is the point, not an error.
  const [aiOff, setAiOff] = useState(false);

  // SCRUM-182: what is on screen RIGHT NOW, for the AI read to check against
  // when its answer comes back. The read is asynchronous, so both questions it
  // has to ask — which credential is open, and has the admin typed a date yet —
  // must be answered when the answer lands, not when the request left.
  const currentDocumentIdRef = useRef(documentId);
  const formRef = useRef(form);
  useEffect(() => {
    currentDocumentIdRef.current = documentId;
  }, [documentId]);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const readWithAi = async (replaceExisting = false) => {
    const requestedFor = documentId;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch(`/api/admin/document-ai/${documentId}`, { method: 'POST' });
      const data = await res.json();
      // SCRUM-182: the modal is mounted once and reused for every credential,
      // and the automatic read below fires on open. Opening one credential and
      // then the next while the first is still being read used to land the
      // first document's extracted dates in the second one's form, so the admin
      // could confirm a date that belongs to another document.
      if (requestedFor !== currentDocumentIdRef.current) return;
      if (data.status !== 200 || !data.data) {
        setAiError(data.message || 'The document could not be read automatically');
        return;
      }
      if (data.data.disabled) {
        setAiOff(true);
        return;
      }
      const result = data.data;
      setAi(result);
      const f = result.fields || {};
      // Never overwrite what the admin has already typed, unless they asked for
      // a fresh read.
      setForm((prev) => ({
        credentialIdNumber: replaceExisting
          ? f.credentialIdNumber || ''
          : prev.credentialIdNumber || f.credentialIdNumber || '',
        credentialIssueDate: replaceExisting
          ? toDateInputValue(f.credentialIssueDate)
          : prev.credentialIssueDate || toDateInputValue(f.credentialIssueDate),
        credentialExpirationDate: replaceExisting
          ? toDateInputValue(f.credentialExpirationDate)
          : prev.credentialExpirationDate || toDateInputValue(f.credentialExpirationDate),
        issuingOrganization: replaceExisting
          ? f.issuingOrganization || ''
          : prev.issuingOrganization || f.issuingOrganization || '',
      }));
      // SCRUM-182: "no expiration" is a suggestion like the four fields above
      // and obeys the same sentence — it may fill a blank form, it may not
      // overwrite the admin, and only a fresh read the admin asked for replaces
      // what is there. This used to tick unconditionally, and because the read
      // starts automatically on open and answers a round-trip later, it landed
      // on top of an Expiration Date the admin had already typed: ticking the
      // box disables the date input, and Confirm then sends hasNoExpiration
      // with no date at all. The caregiver's card correctly showed "No official
      // expiration date" — the reported "admin set an expiry and the caregiver
      // does not see it", with the admin's date silently dropped.
      if (replaceExisting) {
        setHasNoExpiration(f.hasNoExpiration === true);
      } else if (f.hasNoExpiration && !formRef.current.credentialExpirationDate) {
        setHasNoExpiration(true);
      }
    } catch {
      setAiError('The document could not be read automatically');
    } finally {
      if (requestedFor === currentDocumentIdRef.current) setAiLoading(false);
    }
  };

  // Compared by value, so a parent re-render that rebuilds the same object does
  // not wipe what the admin is typing.
  const seed = useMemo(() => JSON.stringify(existingData || {}), [existingData]);

  // The modal is mounted once and reused for every credential, so state seeded
  // at mount kept the previous one's answers: the ID, dates and issuer entered
  // for the TB test were still in the form when the driver's licence was opened
  // next, and a careless Confirm would have written them to the wrong document.
  // Re-seed from this document every time the modal opens.
  useEffect(() => {
    if (!open) return;
    const data = JSON.parse(seed || '{}');
    setForm({
      credentialIdNumber: data.credentialIdNumber || '',
      credentialIssueDate: toDateInputValue(data.credentialIssueDate) || '',
      credentialExpirationDate: toDateInputValue(data.credentialExpirationDate) || '',
      issuingOrganization: data.issuingOrganization || '',
    });
    setHasNoExpiration(data.hasNoExpiration === true);
    setErrors({});
    setAi(null);
    setAiError('');
    setAiOff(false);
    // Nothing recorded yet means nobody has confirmed this document, and the
    // admin opened this modal in order to fill exactly these fields.
    if (!data.credentialIssueDate && !data.issuingOrganization) {
      void readWithAi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId, seed]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    // Credential ID is optional — TB tests and some CPR Tier 2 providers don't
    // print one, and a blank is a valid "reviewed, none provided" state.
    if (!form.credentialIssueDate) newErrors.credentialIssueDate = 'Required';
    if (!form.issuingOrganization.trim()) newErrors.issuingOrganization = 'Required';
    if (!hasNoExpiration) {
      if (!form.credentialExpirationDate) {
        newErrors.credentialExpirationDate = 'Required, or tick "no expiration"';
      } else if (form.credentialIssueDate) {
        if (new Date(form.credentialExpirationDate) <= new Date(form.credentialIssueDate)) {
          newErrors.credentialExpirationDate = 'Must be later than Issue Date';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/document-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          reviewStatus: 'approved',
          ...form,
          credentialExpirationDate: hasNoExpiration ? undefined : form.credentialExpirationDate,
          hasNoExpiration,
          // SCRUM-109 accuracy logging: what was suggested, and whether this
          // confirmation agrees with it.
          aiSuggestedReason: ai?.suggestedReasonCode || undefined,
          adminAgreedWithAi: ai ? ai.suggestion === 'approve' : undefined,
        }),
      });
      const data = await res.json();
      if (data.status === 200) {
        toast.success(`${credentialLabel} confirmed successfully!`);
        onSuccess(data.data);
        onOpenChange(false);
      } else {
        toast.error(data.message || 'Confirmation failed');
      }
    } catch {
      toast.error('Confirmation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center'>
              <ShieldCheck className='w-5 h-5 text-emerald-600' />
            </div>
            <DialogTitle>Confirm {credentialLabel}</DialogTitle>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-2'>
          {/* What the AI read. Suggestion only - the admin confirms. */}
          {!aiOff && (
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
            {aiLoading ? (
              <p className='flex items-center gap-2 text-sm text-gray-600'>
                <Loader2 className='size-4 animate-spin' /> Reading the document...
              </p>
            ) : aiError ? (
              <div className='flex items-start justify-between gap-3'>
                <p className='text-sm text-gray-600'>{aiError}</p>
                <button
                  type='button'
                  onClick={() => readWithAi(true)}
                  className='shrink-0 text-sm font-medium text-emerald-700 hover:underline'
                >
                  Try again
                </button>
              </div>
            ) : ai ? (
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between gap-3'>
                  <p className='flex items-center gap-2 text-sm font-medium text-gray-900'>
                    <Sparkles className='size-4 text-emerald-600' />
                    Read from the document
                    {typeof ai.confidence === 'number' && (
                      <span className='font-normal text-gray-500'>
                        ({Math.round(ai.confidence * 100)}% sure)
                      </span>
                    )}
                  </p>
                  <button
                    type='button'
                    onClick={() => readWithAi(true)}
                    className='shrink-0 text-sm font-medium text-emerald-700 hover:underline'
                  >
                    Read again
                  </button>
                </div>
                {ai.holderName && (
                  <p className='text-xs text-gray-600'>
                    Name on the document:{' '}
                    <span className='font-medium'>{ai.holderName}</span>
                  </p>
                )}
                {(ai.warnings || []).length > 0 ? (
                  <ul className='flex flex-col gap-1'>
                    {(ai.warnings || []).map((w: any) => (
                      <li
                        key={w.code}
                        className='flex items-start gap-2 text-xs text-amber-800'
                      >
                        <AlertTriangle className='mt-0.5 size-3.5 shrink-0 text-amber-600' />
                        <span>{w.detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='flex items-start gap-2 text-xs text-emerald-800'>
                    <Check className='mt-0.5 size-3.5 shrink-0 text-emerald-600' />
                    Nothing looked wrong. Check the fields below before confirming.
                  </p>
                )}
                <p className='text-[11px] text-gray-500'>
                  A suggestion only - check it against the document before you confirm.
                </p>
              </div>
            ) : (
              <div className='flex items-center justify-between gap-3'>
                <p className='text-sm text-gray-600'>
                  Fill these in from the document automatically.
                </p>
                <button
                  type='button'
                  onClick={() => readWithAi(true)}
                  className='flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline'
                >
                  <Sparkles className='size-4' /> Read with AI
                </button>
              </div>
            )}
          </div>
          )}

          <div>
            <Label htmlFor='credentialIdNumber' className='text-sm font-medium'>
              Credential ID Number <span className='text-gray-400'>(if the document has one)</span>
            </Label>
            <Input
              id='credentialIdNumber'
              value={form.credentialIdNumber}
              onChange={(e) => setForm({ ...form, credentialIdNumber: e.target.value })}
              placeholder='e.g., 5151516161'
              className='mt-1'
            />
            {errors.credentialIdNumber && <p className='text-xs text-red-500 mt-1'>{errors.credentialIdNumber}</p>}
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label htmlFor='credentialIssueDate' className='text-sm font-medium'>Issue Date *</Label>
              <Input
                id='credentialIssueDate'
                type='date'
                value={form.credentialIssueDate}
                onChange={(e) => setForm({ ...form, credentialIssueDate: e.target.value })}
                className='mt-1'
              />
              {errors.credentialIssueDate && <p className='text-xs text-red-500 mt-1'>{errors.credentialIssueDate}</p>}
            </div>
            <div>
              <Label htmlFor='credentialExpirationDate' className='text-sm font-medium'>
                Expiration Date {!hasNoExpiration && '*'}
              </Label>
              <Input
                id='credentialExpirationDate'
                type='date'
                value={hasNoExpiration ? '' : form.credentialExpirationDate}
                disabled={hasNoExpiration}
                onChange={(e) => setForm({ ...form, credentialExpirationDate: e.target.value })}
                className='mt-1 disabled:bg-gray-50 disabled:text-gray-400'
              />
              {errors.credentialExpirationDate && <p className='text-xs text-red-500 mt-1'>{errors.credentialExpirationDate}</p>}
            </div>
          </div>

          {/* SCRUM-109: no-expiration state, so admins stop inventing dates. */}
          <label className='flex cursor-pointer items-start gap-2.5'>
            <Checkbox
              checked={hasNoExpiration}
              onCheckedChange={(v) => {
                setHasNoExpiration(v === true);
                setErrors((prev) => ({ ...prev, credentialExpirationDate: '' }));
              }}
              className='mt-0.5 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600'
            />
            <span>
              <span className='block text-sm font-medium text-gray-900'>
                This credential has no expiration date
              </span>
              <span className='block text-xs text-gray-500'>
                Reviewed, no fixed renewal. It will not appear in expiry reminders.
              </span>
            </span>
          </label>

          <div>
            <Label htmlFor='issuingOrganization' className='text-sm font-medium'>Issuing Organization *</Label>
            <Input
              id='issuingOrganization'
              value={form.issuingOrganization}
              onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })}
              placeholder='e.g., GA CNA Registry'
              className='mt-1'
            />
            {errors.issuingOrganization && <p className='text-xs text-red-500 mt-1'>{errors.issuingOrganization}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className='gap-2'>
            <ShieldCheck className='w-4 h-4' />
            {loading ? 'Confirming...' : 'Confirm Credential'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminVerifyModal;
