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
      const label = document?.role ? `${document.role} document` : 'Document';
      toast.success(`${label} removed`, {
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
      <DialogContent className='sm:max-w-[560px] gap-5 rounded-2xl p-7 sm:rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='text-start text-[20px] font-semibold text-[#1C1C1C]'>
            Remove this document?
          </DialogTitle>
        </DialogHeader>

        <p className='text-[14px] leading-[22px] text-[#6C6C6C]'>
          New {document?.role ? `${document.role} ` : ''}caregivers will no
          longer receive this document to sign when they connect, until you add
          it again. Documents already awaiting signature will not be withdrawn.
        </p>

        <div className='flex items-center justify-end gap-3'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={removing}
            className='h-10 rounded-[10px] border-[#DFE2E0] px-5 text-[14px] font-semibold text-[#1C1C1C]'
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            disabled={removing}
            className='h-10 rounded-[10px] bg-[#E94435] px-5 text-[14px] font-semibold text-white hover:bg-[#d13b2d]'
          >
            {removing ? 'Removing…' : 'Remove document'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveDocumentDialog;
