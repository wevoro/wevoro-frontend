'use client';

import React, { useState } from 'react';
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
import { AlertTriangle } from 'lucide-react';

interface RemoveCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialName: string;
  onConfirm: () => void;
  loading?: boolean;
}

const RemoveCredentialDialog: React.FC<RemoveCredentialDialogProps> = ({
  open,
  onOpenChange,
  credentialName,
  onConfirm,
  loading,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center'>
              <AlertTriangle className='w-5 h-5 text-red-600' />
            </div>
            <AlertDialogTitle className='text-lg'>Remove {credentialName}?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className='text-sm text-gray-500 leading-relaxed'>
            Removing this credential will return it to Not Uploaded status. Your profile will
            become incomplete and you will lose any verification associated with this credential.
            Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className='bg-red-600 hover:bg-red-700 text-white'
          >
            {loading ? 'Removing...' : 'Yes, Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RemoveCredentialDialog;
