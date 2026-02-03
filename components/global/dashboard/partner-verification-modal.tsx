import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/lib/contexts';
import { CloudUpload } from 'lucide-react';
import React from 'react';

const PartnerVerificationModal = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { refetchUser } = useUserContext();
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    licenseNumber: '',
    ein: '',
    file: null as File | null,
    confirmed: false,
  });

  const [errors, setErrors] = React.useState({
    licenseNumber: '',
    ein: '',
    file: '',
    confirmed: '',
    general: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        setErrors({
          ...errors,
          file: 'File size must be less than 3MB',
        });
        return;
      }
      setFormData({ ...formData, file });
      setErrors({ ...errors, file: '' });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      licenseNumber: '',
      ein: '',
      file: '',
      confirmed: '',
      general: '',
    };

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
      isValid = false;
    }
    if (!formData.ein.trim()) {
      newErrors.ein = 'EIN is required';
      isValid = false;
    }
    if (!formData.file) {
      newErrors.file = 'Proof of licensure is required';
      isValid = false;
    }
    if (!formData.confirmed) {
      newErrors.confirmed = 'You must confirm the information';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, general: '' }));

    try {
      const data = new FormData();
      data.append('licenseNumber', formData.licenseNumber);
      data.append('ein', formData.ein);
      data.append('file', formData.file as Blob);

      const response = await fetch('/api/partner-verification', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      console.log('🚀 ~ handleSubmit ~ result:', result);

      if (response.ok) {
        setOpen(false);
        // Reset form or show success message
        setFormData({
          licenseNumber: '',
          ein: '',
          file: null,
          confirmed: false,
        });
        refetchUser();
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result.message || 'Verification failed',
        }));
      }
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({ ...prev, general: 'An error occurred' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[700px] p-8 gap-6'>
        <DialogHeader className='text-left'>
          <DialogTitle className='text-2xl font-medium'>
            Company / Agency Verification
          </DialogTitle>
        </DialogHeader>

        {errors.general && (
          <div className='bg-red-500/10 text-red-500 p-3 rounded-md text-sm font-medium'>
            {errors.general}
          </div>
        )}

        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium'>
              State License / Certification Number{' '}
              <span className='text-red-500'>*</span>
            </label>
            <Input
              placeholder='Enter license number'
              className={`h-12 ${errors.licenseNumber ? 'border-red-500' : ''}`}
              value={formData.licenseNumber}
              onChange={(e) => {
                setFormData({ ...formData, licenseNumber: e.target.value });
                if (e.target.value) setErrors({ ...errors, licenseNumber: '' });
              }}
            />
            {errors.licenseNumber && (
              <span className='text-xs text-red-500'>
                {errors.licenseNumber}
              </span>
            )}
          </div>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium'>
              EIN (Employer Identification Number){' '}
              <span className='text-red-500'>*</span>
            </label>
            <Input
              placeholder='## - #######'
              className={`h-12 ${errors.ein ? 'border-red-500' : ''}`}
              value={formData.ein}
              onChange={(e) => {
                setFormData({ ...formData, ein: e.target.value });
                if (e.target.value) setErrors({ ...errors, ein: '' });
              }}
            />
            {errors.ein && (
              <span className='text-xs text-red-500'>{errors.ein}</span>
            )}
          </div>

          <div>
            <label
              htmlFor='license-upload'
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-green-50/5 gap-2 cursor-pointer hover:bg-green-50/10 transition-colors ${
                errors.file ? 'border-red-500' : 'border-primary/40'
              }`}
            >
              <CloudUpload
                className={`w-8 h-8 ${
                  errors.file ? 'text-red-500' : 'text-green-600'
                }`}
              />
              <p className='font-semibold text-base'>
                {formData.file
                  ? formData.file.name
                  : 'Upload Proof of Licensure'}
              </p>
              <p className='text-xs text-muted-foreground'>
                jpeg, png, pdf formats, up to 3MB.
              </p>
              <input
                type='file'
                id='license-upload'
                className='hidden'
                onChange={handleFileChange}
                accept='.jpg,.jpeg,.png,.pdf'
              />
            </label>
            {errors.file && (
              <span className='text-xs text-red-500 mt-1 block'>
                {errors.file}
              </span>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 mt-2'>
              <Checkbox
                id='confirm'
                checked={formData.confirmed}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, confirmed: checked as boolean });
                  if (checked) setErrors({ ...errors, confirmed: '' });
                }}
              />
              <label
                htmlFor='confirm'
                className='text-sm text-muted-foreground font-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                <span className='font-medium text-foreground'>I confirm</span>{' '}
                this information is accurate and up to date.
              </label>
            </div>
            {errors.confirmed && (
              <span className='text-xs text-red-500 ml-6'>
                {errors.confirmed}
              </span>
            )}
          </div>
        </div>

        <div className='flex gap-3 mt-2 w-full'>
          <DialogClose asChild>
            <Button variant='outline' className='w-full h-12'>
              Cancel
            </Button>
          </DialogClose>
          <Button
            className='w-full h-12 '
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerVerificationModal;
