'use client';

import { Button } from '@/components/ui/button';

import { Pencil } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import { useUIContext } from '@/lib/contexts';

export default function EditAction({ data, source }: any) {
  const { openEditModal, setAdminEditData } = useUIContext();

  const handleEdit = () => {
    setAdminEditData({ data, source });
    openEditModal(data, source);
  };

  return (
    <Button
      variant='ghost'
      size='icon'
      className='text-gray-500 hover:text-gray-600 bg-gray-50'
      onClick={handleEdit}
    >
      <Pencil className='size-5' />
    </Button>
  );
}
