'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CloudUpload, Lock, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const MEDICAL_DOCUMENT_TYPES = [
  { value: 'tb_tests', label: 'TB Tests' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'physical_results', label: 'Physical Results' },
  { value: 'other', label: 'Other' },
];

const NON_MEDICAL_DOCUMENT_TYPES = [
  { value: 'resume', label: 'Resume' },
  { value: 'driver_license', label: 'Driver License' },
  { value: 'certifications', label: 'Certifications' },
  { value: 'other', label: 'Other' },
];

interface Document {
  _id: string;
  title: string;
  category: string;
  documentType: string;
  privacy: string;
  url: string;
  consent: boolean;
}

interface UploadDocumentModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  category?: string;
  document?: Document; // For edit mode
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  children,
  category,
  document, // Existing document for editing
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    category: category || '',
    documentType: '',
    title: '',
    isPublic: false,
    consent: false,
    file: null as File | null,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!document;

  // Pre-populate form when editing
  useEffect(() => {
    if (document && open) {
      setFormData({
        category: document.category || '',
        documentType: document.documentType || '',
        title: document.title || '',
        isPublic: document.privacy === 'public',
        consent: document.consent || false,
        file: null,
      });
    }
  }, [document, open]);

  const documentTypes =
    formData.category === 'medical'
      ? MEDICAL_DOCUMENT_TYPES
      : formData.category === 'non_medical'
        ? NON_MEDICAL_DOCUMENT_TYPES
        : [];

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open && !isEditMode) {
      resetForm();
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      documentType: '', // Reset document type when category changes
    }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Validate file size (2MB max)
      if (droppedFile.size > 3 * 1024 * 1024) {
        toast.error('File size must be less than 3MB');
        return;
      }
      setFormData((prev) => ({ ...prev, file: droppedFile }));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (2MB max)
      if (selectedFile.size > 3 * 1024 * 1024) {
        toast.error('File size must be less than 3MB');
        return;
      }
      setFormData((prev) => ({ ...prev, file: selectedFile }));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const resetForm = () => {
    setFormData({
      category: category || '',
      documentType: '',
      title: '',
      isPublic: false,
      consent: false,
      file: null,
    });
  };

  const handleSubmit = async () => {
    // For edit mode, file is optional (keeps existing if not changed)
    if (!isEditMode && !formData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('documentType', formData.documentType);
      data.append('title', formData.title);
      data.append('isPublic', String(formData.isPublic));
      data.append('consent', String(formData.consent));

      // Add documentId if editing
      if (isEditMode) {
        data.append('documentId', document._id);
      }

      // Only append file if one was selected
      if (formData.file) {
        data.append('file', formData.file);
      }

      const response = await fetch('/api/user/document-upload', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (result.status === 200) {
        toast.success(
          isEditMode
            ? 'Document updated successfully!'
            : 'Document uploaded successfully!',
        );

        // Invalidate documents query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['documents'] });

        resetForm();
        setOpen(false);
      } else {
        toast.error(result.message || 'Failed to process document');
      }
    } catch (error: any) {
      console.error('Document operation error:', error);
      toast.error('Failed to process document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setOpen(false);
  };

  const isFormValid =
    formData.category &&
    formData.documentType &&
    formData.title &&
    formData.consent &&
    (isEditMode || formData.file); // File required only for create

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className='sm:max-w-[852px] md:p-9 rounded-xl max-h-[calc(100vh-4rem)] overflow-y-auto'>
        <DialogHeader className=''>
          <DialogTitle className='text-xl text-start md:text-2xl font-medium text-tertiary'>
            {isEditMode ? 'Update Document' : 'Upload Document'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-5'>
          {/* Category Select */}
          <div className='space-y-2'>
            <label className='text-base font-medium text-tertiary'>
              Category <span className='text-red-500'>*</span>
            </label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className='w-full h-14 rounded-lg border-gray-200'>
                <SelectValue placeholder='Select category' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='medical'>Medical Document</SelectItem>
                <SelectItem value='non_medical'>
                  Non-Medical Document
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document Type Select */}
          <div className='space-y-2'>
            <label className='text-base font-medium text-tertiary'>
              Document Type <span className='text-red-500'>*</span>
            </label>
            <Select
              value={formData.documentType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, documentType: value }))
              }
              disabled={!formData.category}
            >
              <SelectTrigger className='w-full h-14 rounded-lg border-gray-200'>
                <SelectValue placeholder='Select document type' />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title and Upload Area Container */}
          <div className='border border-gray-200 rounded-xl p-4 md:p-5 space-y-5'>
            {/* Title Input */}
            <div className='space-y-2'>
              <label className='text-base font-medium text-tertiary'>
                Title <span className='text-red-500'>*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder='Type here..'
                className='h-12'
              />
            </div>

            {/* File Upload Area */}
            <div
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
                flex flex-col items-center justify-center gap-4 border-primary
                ${isDragging || formData.file ? 'bg-primary/5' : 'hover:bg-primary/5'}
              `}
            >
              <input
                ref={fileInputRef}
                type='file'
                onChange={handleFileSelect}
                accept='.jpeg,.jpg,.png,.pdf'
                className='hidden'
              />
              <div className='w-10 h-10 rounded-full flex items-center justify-center'>
                <CloudUpload className='w-10 h-10 text-primary' />
              </div>
              {formData.file ? (
                <div className='text-center'>
                  <p className='text-base font-medium text-tertiary'>
                    {formData.file.name}
                  </p>
                  <p className='text-base md:text-lg text-muted-foreground'>
                    Click or drag to replace
                  </p>
                </div>
              ) : isEditMode && document ? (
                <div className='text-center'>
                  <p className='text-base font-medium text-tertiary'>
                    Current file will be kept
                  </p>
                  <p className='text-base md:text-lg text-muted-foreground'>
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className='text-center'>
                  <p className='text-base md:text-xl font-medium text-tertiary'>
                    Upload from your computer
                  </p>
                  <p className='text-xs md:text-sm text-muted-foreground'>
                    jpeg, png, pdf formats, up to 3MB.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Private Toggle */}
          <div className='border border-gray-200 rounded-xl p-4 md:p-5'>
            <div className='flex items-start justify-between'>
              <div className='flex items-start flex-col gap-2'>
                <div className='flex gap-2 items-center'>
                  {formData.isPublic ? (
                    <Globe className='w-5 h-5 text-tertiary' />
                  ) : (
                    <Lock className='w-5 h-5 text-tertiary' />
                  )}
                  <p className='text-base font-medium text-tertiary'>
                    {formData.isPublic ? 'Public' : 'Private'}
                  </p>
                </div>

                <p className='text-xs text-muted-foreground'>
                  {formData.isPublic
                    ? 'Visible to registered and logged-in verified agencies on the platform.'
                    : 'Only visible to expressly authorized, verified agencies, and only after your consent.'}
                </p>
              </div>

              <button
                type='button'
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isPublic: !prev.isPublic,
                  }))
                }
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${formData.isPublic ? 'bg-primary' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform
                    ${formData.isPublic ? 'translate-x-5' : 'translate-x-0.5'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className='flex items-center gap-4 py-2'>
            <Checkbox
              id='consent'
              checked={formData.consent}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  consent: checked as boolean,
                }))
              }
              className='mt-0.5 h-5 w-5 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary'
            />
            <label htmlFor='consent' className='text-base leading-snug'>
              <span className='text-tertiary'>
                I approve uploading a medical information voluntarily.
              </span>{' '}
              <span className='text-muted-foreground'>
                We do not share your data without your consent.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isLoading}
              className='flex-1 h-16 text-tertiary font-medium text-lg rounded-xl'
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant={'default'}
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className='flex-1 h-16 text-white font-medium text-lg rounded-xl'
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  {isEditMode ? 'Updating...' : 'Uploading...'}
                </>
              ) : isEditMode ? (
                'Update'
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDocumentModal;
