'use client';

import * as React from 'react';
import { Bell, Settings, Menu, LogOut, User } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
// SCRUM-205: avatar dropdown (top-right) so Sign Out is reachable from any
// authenticated screen — same component on the caregiver and agency surfaces.
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Logo from '../logo';
import { useParams, usePathname } from 'next/navigation';
import { useUserContext } from '@/lib/contexts';
import { useNotifications } from '@/app/apiHooks/useNotifications';
import { Notification } from '@/app/types/types';

export default function DashboardNav() {
  const { id } = useParams();
  const { user } = useUserContext();
  const { data: notifications } = useNotifications();
  const isUnreadNotification = React.useMemo(
    () => notifications?.filter((noti: Notification) => !noti.isRead) || [],
    [notifications],
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const path = user?.role === 'pro' ? '/pro' : '/partner';
  const pathName = usePathname();

  const isPublicProPage = pathName.includes('pro/') && id ? true : false;

  const items = [
    {
      href: `${path}/notifications`,
      icon: (
        <div className='relative'>
          <Bell className='h-5 w-5 md:h-4 md:w-4 lg:h-6 lg:w-6' />
          {isUnreadNotification?.length > 0 && (
            <div className='absolute top-0 right-0 w-2 h-2 bg-[#33B55B] rounded-full'></div>
          )}
        </div>
      ),
      label: 'Notifications',
    },

    {
      href: `${path}/settings`,
      icon: <Settings className='h-5 w-5 md:h-4 md:w-4 lg:h-6 lg:w-6' />,
      label: 'Settings',
    },
  ];

  return (
    <nav className='p-4 md:p-6 lg:px-10 bg-white fixed top-0 w-full z-50'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 lg:gap-8'>
          <Logo className='text-3xl lg:text-4xl' />
          <div className='hidden md:block'>{/* <UpgradeButton /> */}</div>
        </div>
        <div className='hidden md:flex items-center gap-2 lg:gap-8'>
          {!isPublicProPage || user?.role ? (
            <>
              {items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  pathName={pathName}
                >
                  {item.label}
                </NavItem>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label='Account menu'
                    className='rounded-full w-10 h-10 lg:w-16 lg:h-16 p-0 overflow-hidden'
                  >
                    <img
                      src={user?.personalInfo?.image || '/dummy-profile-pic.jpg'}
                      alt='Account'
                      className='rounded-full w-full h-full object-cover'
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel className='truncate'>
                    {user?.personalInfo?.firstName
                      ? `${user.personalInfo.firstName} ${user.personalInfo.lastName || ''}`.trim()
                      : user?.email || 'My account'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`${path}/profile`}
                      className='cursor-pointer flex items-center gap-2'
                    >
                      <User className='h-4 w-4' /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`${path}/settings`}
                      className='cursor-pointer flex items-center gap-2'
                    >
                      <Settings className='h-4 w-4' /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href='/logout'
                      className='cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600'
                    >
                      <LogOut className='h-4 w-4' /> Sign Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <NavItem
              href={`/partner/signup`}
              pathName={pathName}
              className='bg-primary text-white !px-10'
            >
              Signup Now!
            </NavItem>
          )}
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant='outline' size='icon' className='md:hidden w-8 h-8'>
              <Menu className='h-5 w-5' />
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='max-w-[300px]'>
            <SheetTitle />
            <nav className='flex flex-col space-y-4 mt-10'>
              {!isPublicProPage ? (
                <>
                  <Button
                    href={`${path}/profile`}
                    variant='ghost'
                    size='icon'
                    className='rounded-full w-20 h-20 mx-auto'
                  >
                    <img
                      src={user?.personalInfo?.image}
                      alt='User'
                      className='rounded-full w-full h-full object-cover'
                    />
                  </Button>

                  {/* <UpgradeButton /> */}

                  {items.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      pathName={pathName}
                    >
                      {item.label}
                    </NavItem>
                  ))}
                  {/* SCRUM-205: Sign Out reachable from the mobile menu too. */}
                  <NavItem
                    href='/logout'
                    icon={<LogOut className='h-5 w-5 md:h-4 md:w-4 lg:h-6 lg:w-6' />}
                    pathName={pathName}
                    className='text-red-600'
                  >
                    Sign Out
                  </NavItem>
                </>
              ) : (
                <NavItem
                  href={`/partner/signup`}
                  pathName={pathName}
                  className='bg-primary text-white !px-10'
                >
                  Signup Now!
                </NavItem>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon,
  children,
  pathName,
  className,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  pathName: string;
  className?: string;
}) {
  return (
    <Button
      href={href}
      className={cn(
        'h-[45px] md:h-[50px] lg:h-[55px] 2xl:h-[65px] rounded-[12px] p-5 flex justify-start md:justify-center items-center gap-2 bg-accent text-muted-foreground hover:text-white transition-colors duration-200 px-3 lg:px-4 text-base md:text-sm lg:text-lg font-medium',
        pathName === href && 'text-primary',
        className,
      )}
    >
      {icon}
      <span>{children}</span>
    </Button>
  );
}

// const UpgradeButton = () => {
//   return (
//     <Button className='flex items-center bg-secondary h-[50px] lg:h-[55px] 2xl:h-[65px] text-sm lg:text-lg font-medium rounded-[12px] px-3 lg:px-4'>
//       <Rocket className='mr-2 h-5 w-5 md:w-4 lg:w-6 lg:h-6 md:h-4  fill-current' />
//       Upgrade to Pro
//     </Button>
//   );
// };
