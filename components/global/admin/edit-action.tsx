'use client';

import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { AdminEditUserModal } from './admin-edit-user-modal';

export default function EditAction({ data }: any) {
  return (
    <AdminEditUserModal data={data}>
      <Button
        variant='ghost'
        size='icon'
        className='text-gray-500 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl size-10'
      >
        <Pencil className='size-5' />
      </Button>
    </AdminEditUserModal>
  );
}
