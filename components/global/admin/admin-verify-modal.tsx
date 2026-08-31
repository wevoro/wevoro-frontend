'use client';

import React, { useState } from 'react';
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
import { ShieldCheck } from 'lucide-react';
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
