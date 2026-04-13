import { MoreHorizontal, Pencil, RotateCw, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function OfferDropdown({
  offer,
  handleRemove,
  handleUpdate,
}: {
  offer: any;
  handleRemove: (id: string, partnerId: string) => void;
  handleUpdate?: (offer: any) => void;
}) {
  const canUpdate =
    offer.status === 'pending' || offer.status === 'responded';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <MoreHorizontal className='w-6 h-6 cursor-pointer' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {canUpdate && handleUpdate && (
            <>
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => handleUpdate(offer)}
              >
                <Pencil className='size-4' />
                <span>Update</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            className='cursor-pointer text-red-500'
            onClick={() => handleRemove(offer._id, offer.partner._id)}
          >
            <Trash2 className='size-4' />
            <span>Remove</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
