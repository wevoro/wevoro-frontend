import { Trash2, UserRoundX, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';
import { useState } from 'react';
import AdminAlertModal from './admin-alert-modal';

const TableDropdown = ({ data }: { data: any }) => {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<'block' | 'unblock' | 'remove'>(
    'block'
  );
  const isBlocked = data.status === 'blocked';
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl size-10'
          >
            <EllipsisVertical className='size-5' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {/* Blocking used to be a dead end: Block greyed out once blocked and
              nothing replaced it, so an admin could never restore the account. */}
          {isBlocked ? (
            <DropdownMenuItem
              className='flex items-center gap-2 cursor-pointer'
              onClick={() => {
                setAlertType('unblock');
                setOpen(true);
              }}
            >
              <UserRoundCheck className='size-4' /> Unblock
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className='flex items-center gap-2 cursor-pointer'
              onClick={() => {
                setAlertType('block');
                setOpen(true);
              }}
            >
              <UserRoundX className='size-4' /> Block
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className='flex items-center gap-2 cursor-pointer'
            onClick={() => {
              setAlertType('remove');
              setOpen(true);
            }}
          >
            <Trash2 className='size-4' /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AdminAlertModal
        open={open}
        setOpen={setOpen}
        alertType={alertType}
        data={data}
      />
    </>
  );
};

export default TableDropdown;
