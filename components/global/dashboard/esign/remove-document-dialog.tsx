'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RemoveDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
  onRemoved: () => void;
}

/**
 * SCRUM-117: removal confirm.
 *
 * The wording matters here — removal is deliberately NOT a recall. Copies
 * already awaiting signature keep their snapshot and stay signable; only new
 * caregivers stop receiving the document. The toast offers Undo because the
 * backend soft-deletes (status: 'removed'), so restoring is a real operation
 * rather than a re-upload.
 */
const RemoveDocumentDialog: React.FC<RemoveDocumentDialogProps> = ({
  open,
  onOpenChange,
  document,
  onRemoved,
}) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/esign/documents/${document._id}`, {
        method: 'DELETE',
      });
      const body = await res.json();
      if (!res.ok || body?.status >= 400) {
        throw new Error(body?.message || 'Could not remove the document');
      }

      onRemoved();
      toast.success(`${document.title} removed`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const undo = await fetch(
                `/api/esign/documents/${document._id}/restore`,
                { method: 'PATCH' }
              );
              if (!undo.ok) throw new Error();
              toast.success(`${document.title} restored`);
              onRemoved();
            } catch {
              toast.error('Could not restore the document');
            }
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.message || 'Could not remove the document');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle className='text-[20px] font-semibold text-[#1C1C1C]'>
            Remove {document?.title}?
          </DialogTitle>
        </DialogHeader>

        <p className='text-[14px] leading-[22px] text-[#6C6C6C]'>
          New caregivers will no longer receive this document. Anyone already
          waiting to sign it keeps their copy &mdash; it is not withdrawn.
        </p>

        <div className='mt-2 flex items-center justify-end gap-3'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={removing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            disabled={removing}
            className='bg-[#E94435] text-white hover:bg-[#d13b2d]'
          >
            {removing ? 'Removing…' : 'Remove document'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveDocumentDialog;
