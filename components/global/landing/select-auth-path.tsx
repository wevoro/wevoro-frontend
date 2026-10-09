import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SelectAuthPath({
  children,
  type,
}: {
  children: React.ReactNode;
  type: 'Register' | 'Login';
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className='w-max'>
        <DropdownMenuLabel>{type} as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {type === 'Register' && (
            <>
              <Link href='/caregiver/signup'>
                <DropdownMenuItem className='cursor-pointer'>
                  <span>Caregiver</span>
                </DropdownMenuItem>
              </Link>
              <Link href='/agency/signup'>
                <DropdownMenuItem className='cursor-pointer'>
                  <span>Agency</span>
                </DropdownMenuItem>
              </Link>
            </>
          )}
          {type === 'Login' && (
            <>
              <Link href='/caregiver/login'>
                <DropdownMenuItem className='cursor-pointer'>
                  <span>Caregiver</span>
                </DropdownMenuItem>
              </Link>
              <Link href='/agency/login'>
                <DropdownMenuItem className='cursor-pointer'>
                  <span>Agency</span>
                </DropdownMenuItem>
              </Link>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
