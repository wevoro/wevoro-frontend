import { MoreHorizontal, Pencil, RotateCw, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OfferRequestModal } from './offer-request-modal';
import { ProRequestModal } from './pro-request-modal';
import { useUserContext } from '@/lib/contexts';

export function OfferDropdown({
  offer,
  handleRemove,
}: {
  offer: any;
  handleRemove: (id: string, partnerId: string) => void;
}) {
  const { user } = useUserContext();
  const isPartner = user?.role === 'partner';
  const canUpdate =
    offer.status !== 'rejected' && offer.status !== 'onboarded';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <MoreHorizontal className='w-6 h-6 cursor-pointer' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {canUpdate && isPartner && (
            <OfferRequestModal offerData={offer} proUser={offer.pro}>
              <DropdownMenuItem
                className='cursor-pointer'
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <Pencil className='size-4' />
                <span>Update</span>
              </DropdownMenuItem>
            </OfferRequestModal>
          )}
          {canUpdate && !isPartner && (
            <ProRequestModal offer={offer}>
              <DropdownMenuItem
                className='cursor-pointer'
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <RotateCw className='size-4' />
                <span>Update Requirements</span>
              </DropdownMenuItem>
            </ProRequestModal>
          )}
          {(canUpdate || isPartner) && <DropdownMenuSeparator />}
          <DropdownMenuItem
            className='cursor-pointer text-red-600 focus:text-red-600'
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
