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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.credentialIdNumber.trim()) newErrors.credentialIdNumber = 'Required';
    if (!form.credentialIssueDate) newErrors.credentialIssueDate = 'Required';
    if (!form.credentialExpirationDate) newErrors.credentialExpirationDate = 'Required';
    if (!form.issuingOrganization.trim()) newErrors.issuingOrganization = 'Required';
    if (form.credentialIssueDate && form.credentialExpirationDate) {
      if (new Date(form.credentialExpirationDate) <= new Date(form.credentialIssueDate)) {
        newErrors.credentialExpirationDate = 'Must be later than Issue Date';
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
        }),
      });
      const data = await res.json();
      if (data.status === 200) {
        toast.success(`${credentialLabel} verified successfully!`);
        onSuccess(data.data);
        onOpenChange(false);
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch {
      toast.error('Verification failed. Please try again.');
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
            <DialogTitle>Verify {credentialLabel}</DialogTitle>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-2'>
          <div>
            <Label htmlFor='credentialIdNumber' className='text-sm font-medium'>Credential ID Number *</Label>
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
              <Label htmlFor='credentialExpirationDate' className='text-sm font-medium'>Expiration Date *</Label>
              <Input
                id='credentialExpirationDate'
                type='date'
                value={form.credentialExpirationDate}
                onChange={(e) => setForm({ ...form, credentialExpirationDate: e.target.value })}
                className='mt-1'
              />
              {errors.credentialExpirationDate && <p className='text-xs text-red-500 mt-1'>{errors.credentialExpirationDate}</p>}
            </div>
          </div>

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
            {loading ? 'Verifying...' : 'Verify Credential'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminVerifyModal;
