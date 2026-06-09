'use client';
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GchexsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: 'yes' | 'no' | 'not_set';
  currentDocUrl?: string;
  onSave: (status: 'yes' | 'no', file?: File) => Promise<void>;
}

/**
 * SCRUM-66: GCHEXS Edit Modal
 * Allows caregiver to set/change their GCHEXS status
 * and optionally upload confirmation document
 */
const GchexsEditModal: React.FC<GchexsEditModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  currentDocUrl,
  onSave,
}) => {
  const [status, setStatus] = useState<'yes' | 'no'>(
    currentStatus === 'not_set' ? 'no' : currentStatus as 'yes' | 'no'
  );
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload a PDF, JPEG, or PNG file.');
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5 MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(status, file || undefined);
      toast.success('GCHEXS status updated successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to update GCHEXS status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b bg-gray-50'>
          <h3 className='text-lg font-semibold text-gray-900'>
            GCHEXS Background Check
          </h3>
          <button
            onClick={onClose}
            className='p-1 rounded-full hover:bg-gray-200 transition-colors'
          >
            <X className='size-5 text-gray-500' />
          </button>
        </div>

        {/* Body */}
        <div className='px-6 py-5 space-y-5'>
          {/* Question */}
          <div>
            <label className='block text-sm font-medium text-gray-800 mb-1'>
              Have you completed Georgia&apos;s GCHEXS fingerprinting?
            </label>
            <p className='text-xs text-gray-500 mb-3'>
              GCHEXS is the state&apos;s background check system. If you&apos;ve completed it
              for a prior employer, the result is portable. Agencies will see your
              answer to save time on their own checks.
            </p>

            <div className='flex gap-3'>
              <button
                onClick={() => setStatus('yes')}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                  status === 'yes'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setStatus('no')}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                  status === 'no'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* File upload (only when Yes) */}
          {status === 'yes' && (
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>
                Optional: upload your GCHEXS confirmation document
              </label>
              <p className='text-xs text-gray-500'>
                Accepted: PDF, JPEG, PNG (max 5 MB)
              </p>

              {file ? (
                <div className='flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2'>
                  <FileText className='size-4 text-green-600' />
                  <span className='text-sm text-green-700 flex-1 truncate'>
                    {file.name}
                  </span>
                  <button
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className='p-0.5 hover:bg-green-100 rounded'
                  >
                    <X className='size-3.5 text-green-600' />
                  </button>
                </div>
              ) : currentDocUrl ? (
                <div className='flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2'>
                  <FileText className='size-4 text-blue-600' />
                  <span className='text-sm text-blue-700 flex-1'>
                    Existing document attached
                  </span>
                  <a
                    href={currentDocUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-xs text-blue-600 underline'
                  >
                    View
                  </a>
                </div>
              ) : null}

              <button
                onClick={() => fileInputRef.current?.click()}
                className='flex items-center gap-2 w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors'
              >
                <Upload className='size-4' />
                {file || currentDocUrl ? 'Replace document' : 'Choose file'}
              </button>
              <input
                ref={fileInputRef}
                type='file'
                accept='.pdf,.jpg,.jpeg,.png'
                onChange={handleFileChange}
                className='hidden'
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className='bg-emerald-600 hover:bg-emerald-700 text-white'
          >
            {isLoading ? (
              <>
                <Loader2 className='size-4 mr-1.5 animate-spin' /> Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GchexsEditModal;
