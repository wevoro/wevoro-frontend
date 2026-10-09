'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  isValidFileType,
  isValidFileSize,
  MAX_UPLOAD_MB,
} from '@/utils/download';
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
import { CloudUpload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  SUPPORTING_DOCUMENT_TITLES,
  type CertificatePart,
} from '@/lib/credential-config';
import { shortFileName } from '@/utils/file';

// SCRUM-61: credential rows use a different preset list (locked). Add More
// uses the supporting-document preset list only — credential titles never appear
// in the Add More dropdown.
const MEDICAL_DOCUMENT_TYPES = [
  { value: 'tb_tests', label: 'TB Tests' },
  { value: 'cpr_test', label: 'CPR Test' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'physical_results', label: 'Physical Results' },
  { value: 'other', label: 'Other' },
];

const NON_MEDICAL_DOCUMENT_TYPES = [
  { value: 'resume', label: 'Resume' },
  { value: 'driver_license', label: "Driver's License" },
  { value: 'auto_insurance', label: 'Auto Insurance' },
  { value: 'certifications', label: 'Certificate' },
  { value: 'other', label: 'Other' },
];

// SCRUM-97: name the actual size so caregivers know how far over they are,
// rather than just being told the upload was rejected.
const tooLargeMessage = (file: File) =>
  `This file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please upload a file under ${MAX_UPLOAD_MB}MB.`;

// SCRUM-177: the wording of the medical consent below. Sent with the consent so
// the backend can record WHICH text the caregiver agreed to; bump both together.
const CONSENT_VERSION = '2026-09-23';

// SCRUM-177: the one line that replaces the Private toggle. The caregiver's
// Documents section shows the same sentence and imports it from here, so the
// two cannot drift apart.
export const SHARING_NOTE =
  'Documents in your profile are shared with agencies you send your profile link to.';

interface Document {
  _id: string;
  title: string;
  category: string;
  documentType: string;
  privacy: string;
  url: string;
  consent: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  part?: CertificatePart;
}

interface UploadDocumentModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  category?: string;
  documentType?: string;
  defaultTitle?: string;
  /** SCRUM-61: when true, modal opens in Add More mode (default non_medical, supporting-doc list, unlocked). */
  addMore?: boolean;
  document?: Document; // For edit mode
  /**
   * SCRUM-165: which half of a PCA certificate this upload is. Only for
   * documentType 'certifications'; left out for every other credential.
   */
  part?: CertificatePart;
  /**
   * SCRUM-178: opened from a credential row's Update Verification / Re-upload
   * action, not as a plain metadata edit. The point of that action is to send a
   * fresh file, so one is required here even on a Confirmed credential.
   * Passed explicitly by the caller rather than read off `reviewStatus`, which
   * cannot tell an Update Verification apart from the Documents section editing
   * the title of that very same approved document.
   */
  updateVerification?: boolean;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  children,
  open: openProp,
  onOpenChange,
  category,
  documentType: defaultDocumentType,
  defaultTitle,
  addMore,
  document, // Existing document for editing
  part,
  updateVerification,
}) => {
  const queryClient = useQueryClient();
  // Supports both usages: uncontrolled (children act as the DialogTrigger, e.g.
  // the credentials panel) and controlled via `open`/`onOpenChange` (e.g. the
  // Rejected row's Re-upload CTA, which has no trigger child). These props were
  // declared but never read, so every controlled caller silently no-opped —
  // clicking Re-upload did nothing.
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  // SCRUM-61: Add More defaults Category to Non-Medical for the streamlined common case.
  const initialCategory = category || (addMore ? 'non_medical' : '');
  const [formData, setFormData] = useState({
    category: initialCategory,
    documentType: defaultDocumentType || '',
    title: defaultTitle || '',
    consent: false,
    file: null as File | null,
  });
  // SCRUM-60/44: credential rows lock both Category and Document Type.
  const isCredentialRow = !!defaultDocumentType && !addMore;
  const isMedicalCategory = formData.category === 'medical';
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!document;
  // A rejected credential is only cleared by a NEW file — the backend leaves the
  // verdict alone on a metadata-only edit. Submitting with "Current file will be
  // kept" therefore reported success while the credential stayed rejected and
  // the Completing Profile modal kept asking for a re-upload.
  const isRejectedReupload = isEditMode && document?.reviewStatus === 'rejected';
  // SCRUM-178 Scenario 2: Update Verification is the same story one state over.
  // The credential has to land back on Pending review, and document.service.ts
  // only resets reviewStatus when a file actually arrives — so on a Confirmed
  // credential the empty form sailed through isFormValid, showed the success
  // toast and left the credential Confirmed with its old file.
  const requiresNewFile =
    isEditMode && (!!updateVerification || isRejectedReupload);

  // Pre-populate form when editing
  useEffect(() => {
    if (document && open) {
      setFormData({
        category: document.category || '',
        documentType: document.documentType || '',
        title: document.title || '',
        consent: document.consent || false,
        file: null,
      });
    }
  }, [document, open]);

  // SCRUM-61: Add More draws from the supporting-document preset list ONLY
  // (no credential titles). Credential rows always use the full list because
  // their Document Title is pre-filled and locked anyway.
  const documentTypes = addMore
    ? SUPPORTING_DOCUMENT_TITLES
    : formData.category === 'medical'
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

    if (e.dataTransfer.files.length > 1) {
      toast.warning('Please upload one file at a time. Only the first file will be used.');
    }

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Validate file type
      if (!isValidFileType(droppedFile)) {
        toast.error('Invalid file type. Please upload a JPEG, PNG, or PDF file.');
        return;
      }
      if (!isValidFileSize(droppedFile)) {
        toast.error(tooLargeMessage(droppedFile));
        return;
      }
      setFormData((prev) => ({ ...prev, file: droppedFile }));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!isValidFileType(selectedFile)) {
        toast.error('Invalid file type. Please upload a JPEG, PNG, or PDF file.');
        return;
      }
      if (!isValidFileSize(selectedFile)) {
        toast.error(tooLargeMessage(selectedFile));
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
      documentType: defaultDocumentType || '',
      title: defaultTitle || '',
      consent: false,
      file: null,
    });
  };

  const handleSubmit = async () => {
    // For edit mode, file is optional (keeps existing if not changed) — except
    // on a rejected credential, where the existing file is the rejected one,
    // and on an Update Verification, which exists to send a newer one.
    if (!formData.file && (!isEditMode || requiresNewFile)) {
      toast.error(
        isRejectedReupload
          ? 'This document was rejected — please select a new file to replace it.'
          : requiresNewFile
            ? 'Updating this verification needs a new file — please select one to replace the current document.'
            : 'Please select a file to upload',
      );
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('documentType', formData.documentType);
      data.append('title', formData.title);
      // SCRUM-177 removed the Private choice, but the field stays on the wire:
      // /api/user/document-upload appends isPublic unconditionally, so leaving it
      // out sends the string "null" and the backend stores privacy 'private'.
      data.append('isPublic', 'true');
      data.append('consent', String(formData.consent));
      // SCRUM-177: record which consent wording was agreed to, for the audit.
      if (isMedicalCategory && formData.consent) {
        data.append('consentVersion', CONSENT_VERSION);
      }

      // Add documentId if editing
      if (isEditMode) {
        data.append('documentId', document._id);
      }

      // SCRUM-165: send the certificate half on create and on edit alike. A
      // re-upload of an existing sign-off that dropped it would reach the
      // backend as a plain certificate and could replace the written exam.
      const certificatePart = part ?? document?.part;
      if (certificatePart) {
        data.append('part', certificatePart);
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
        // ...and the credential list behind it. Without this the share box on
        // the profile kept saying "0 of 5 verified" after the fifth upload,
        // because only the Documents list was being told anything had changed.
        // refetchType 'all' so the readers that are mounted but behind this
        // modal refetch now rather than when they are next looked at.
        queryClient.invalidateQueries({
          queryKey: ['credentialStatus'],
          refetchType: 'all',
        });

        resetForm();
        setOpen(false);
      } else {
        toast.error(`${result.message || 'Failed'} (status: ${result.status})`);
      }
    } catch (error: any) {
      console.error('Document operation error:', error);
      toast.error(`Upload error: ${error.message || 'Unknown'}`);
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
    (isMedicalCategory ? formData.consent : true) &&
    (isEditMode && !requiresNewFile ? true : !!formData.file); // new file required on create, on a rejected re-upload and on an Update Verification (SCRUM-178)

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
              disabled={isCredentialRow}
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
              disabled={!formData.category || isCredentialRow}
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
              {/* SCRUM-44/178: a credential row locks the Document Title as well
                  as Category and Document Type — the title names the credential
                  the row stands for, and retyping it on an Update Verification
                  detached the file from its row. Add More and a supporting
                  document (no documentType prop) stay free to type. */}
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                disabled={isCredentialRow}
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
                <div className='w-full min-w-0 text-center'>
                  <p
                    title={formData.file.name}
                    className='mx-auto max-w-full break-all text-base font-medium text-tertiary'
                  >
                    {shortFileName(formData.file.name)}
                  </p>
                  <p className='text-base md:text-lg text-muted-foreground'>
                    Click or drag to replace
                  </p>
                </div>
              ) : requiresNewFile ? (
                // SCRUM-178: "Current file will be kept" must never show here —
                // it is what promised the caregiver a successful Update
                // Verification with nothing uploaded. An Update Verification is
                // not a rejection either, so only a rejected row is told so.
                <div className='text-center'>
                  <p className='text-base font-medium text-red-500'>
                    A new file is required
                  </p>
                  <p className='text-base md:text-lg text-muted-foreground'>
                    {isRejectedReupload
                      ? 'Click or drag to replace the rejected document'
                      : 'Click or drag to replace the current document'}
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
                    jpeg, png, pdf formats, up to {MAX_UPLOAD_MB}MB.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SCRUM-177: the Private toggle is gone from every entry point — the
              caregiver decides who sees a document by choosing who gets the
              profile link, not per file. This line stands in its place. */}
          <p className='text-xs text-muted-foreground'>{SHARING_NOTE}</p>

          {/* Consent Checkbox — only for medical documents. SCRUM-177: the
              consent text now runs to several lines, so the box aligns to the
              top of it rather than to its middle. */}
          {isMedicalCategory && (
          <div className='flex items-start gap-4 py-2'>
            <Checkbox
              id='consent'
              checked={formData.consent}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  consent: checked as boolean,
                }))
              }
              className='mt-0.5 h-5 w-5 shrink-0 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary'
            />
            {/* SCRUM-177: the consent now names what is shared and with whom.
                Still required before Upload for a medical document (isFormValid). */}
            <label htmlFor='consent' className='text-base leading-snug text-tertiary'>
              I authorize WeVoro to share this medical document, and the health
              information in it, with any agency I share my profile with. I
              understand that I choose who receives my profile.
            </label>
          </div>
          )}

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
