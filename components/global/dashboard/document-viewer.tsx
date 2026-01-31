'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Document {
  _id: string;
  user?: string;
  category?: string;
  documentType?: string;
  title?: string;
  privacy?: 'public' | 'private';
  url: string;
  consent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to detect if a URL points to a PDF
const isPdfUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith('.pdf') ||
    lowerUrl.includes('.pdf?') ||
    lowerUrl.includes('/pdf')
  );
};

interface DocumentViewerProps {
  /** Can pass a single document or an array of documents */
  documents: Document | Document[];
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  children?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  showFooter?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents: documentsProp,
  title = 'Document Viewer',
  confirmLabel = 'Confirm Onboarding',
  cancelLabel = 'Cancel',
  isConfirming = false,
  children,
  onConfirm,
  onCancel,
  showFooter,
}) => {
  // Normalize to array - supports both single document and array
  const documents = Array.isArray(documentsProp)
    ? documentsProp
    : [documentsProp];

  // Default showFooter: hide for single doc (view mode), show for multiple (slider mode)
  const shouldShowFooter = showFooter;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open]);

  const currentDocument = documents[currentIndex];
  const hasMultipleDocuments = documents.length > 1;
  const isPdf = isPdfUrl(currentDocument?.url || '');

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1));
  }, [documents.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0));
  }, [documents.length]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    setOpen(false);
  }, [onCancel]);

  const handleConfirmClick = useCallback(() => {
    setShowConfirmAlert(true);
  }, []);

  const handleConfirmOnboard = useCallback(() => {
    onConfirm?.();
    setShowConfirmAlert(false);
    setOpen(false);
  }, [onConfirm]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrevious, goToNext]);

  if (!documents.length) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className='max-w-3xl md:w-[90vw] p-0 gap-0 overflow-hidden'>
          {/* Header - Minimal */}
          <div className='flex items-center justify-between px-5 py-4 border-b'>
            <div>
              <h2 className='text-lg font-semibold'>{title}</h2>
              {currentDocument?.title && (
                <p className='text-sm text-muted-foreground mt-0.5'>
                  {currentDocument.title}
                </p>
              )}
            </div>
            {hasMultipleDocuments && (
              <span className='text-sm text-muted-foreground'>
                {currentIndex + 1} of {documents.length}
              </span>
            )}
          </div>

          {/* Document Display Area */}
          <div className='relative bg-muted/50'>
            {/* Navigation Buttons */}
            {hasMultipleDocuments && (
              <>
                <button
                  onClick={goToPrevious}
                  className={cn(
                    'absolute left-2 top-1/2 -translate-y-1/2 z-10',
                    'w-9 h-9 rounded-full bg-background border',
                    'flex items-center justify-center',
                    'hover:bg-accent transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                  aria-label='Previous document'
                >
                  <ChevronLeft className='h-5 w-5' />
                </button>
                <button
                  onClick={goToNext}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 z-10',
                    'w-9 h-9 rounded-full bg-background border',
                    'flex items-center justify-center',
                    'hover:bg-accent transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                  aria-label='Next document'
                >
                  <ChevronRight className='h-5 w-5' />
                </button>
              </>
            )}

            {/* Document Content */}
            <div className='flex items-center justify-center p-4 min-h-[60vh]'>
              {isPdf ? (
                <iframe
                  src={`${currentDocument.url}#toolbar=0&navpanes=0&scrollbar=0`}
                  className='w-full h-[60vh] rounded border bg-white'
                  title={
                    currentDocument.title || `Document ${currentIndex + 1}`
                  }
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentDocument?.url}
                  alt={currentDocument?.title || `Document ${currentIndex + 1}`}
                  className='max-w-full max-h-[60vh] rounded object-contain'
                />
              )}
            </div>
          </div>

          {/* Dot Indicators */}
          {hasMultipleDocuments && (
            <div className='flex justify-center gap-1.5 py-3 border-t'>
              {documents.map((doc, index) => (
                <button
                  key={doc._id || index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                  )}
                  aria-label={`Go to document ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Footer - Only shown when showFooter is true */}
          {shouldShowFooter && (
            <DialogFooter className='px-5 py-4 border-t gap-2 sm:gap-2 flex flex-row'>
              <Button
                variant='outline'
                className='flex-1 rounded-xl h-14'
                onClick={handleCancel}
                disabled={isConfirming}
              >
                {cancelLabel}
              </Button>
              <Button
                className='flex-1 rounded-xl h-14'
                onClick={handleConfirmClick}
                disabled={isConfirming}
              >
                {isConfirming ? 'Confirming...' : confirmLabel}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent className='rounded-2xl'>
          <AlertDialogHeader className='text-center sm:text-center'>
            <AlertDialogTitle className='text-xl'>
              Confirm Onboarding?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to onboard this pro. Would you like to proceed now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex flex-row gap-3 sm:flex-row'>
            <AlertDialogCancel
              className='flex-1 h-12 rounded-xl mt-0'
              disabled={isConfirming}
            >
              Later
            </AlertDialogCancel>
            <AlertDialogAction
              className='flex-1 h-12 rounded-xl'
              onClick={handleConfirmOnboard}
              disabled={isConfirming}
            >
              {isConfirming ? 'Processing...' : 'Onboard'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentViewer;
