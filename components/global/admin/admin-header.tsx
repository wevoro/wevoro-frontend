'use client';

import { useNotifications } from '@/app/apiHooks/useNotifications';
import { Notification } from '@/app/types/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Bell, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import React, { useMemo } from 'react';

const AdminHeader = () => {
  // const { isUnreadNotification } = useNotificationsContext();
  const { data: notifications } = useNotifications();
  const isUnreadNotification = useMemo(
    () => notifications?.filter((noti: Notification) => !noti.isRead) || [],
    [notifications],
  );
  const pathName = usePathname();

  const items = [
    {
      href: `/admin/notifications`,
      icon: (
        <div className='relative'>
          <Bell className='h-4 w-4 lg:h-6 lg:w-6' />

          {isUnreadNotification?.length > 0 && (
            <div className='absolute top-0 right-0 w-2 h-2 bg-[#33B55B] rounded-full'></div>
          )}
        </div>
      ),
      label: 'Notifications',
    },

    {
      href: `/admin/settings`,
      icon: <Settings className='h-4 w-4 lg:h-6 lg:w-6' />,
      label: 'Settings',
    },
  ];

  return (
    <header className='sticky top-0 z-50 bg-white flex justify-between h-auto p-4 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2'>
        <SidebarTrigger className='-ml-1 size-5 sm:size-7' />

        <Separator orientation='vertical' className='mr-2 h-4' />
      </div>
      <div className='flex items-center gap-2 sm:gap-8'>
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

        {/* SCRUM-205: this was a Button with its href commented out, so the
            admin avatar did nothing and an admin had no way to sign out at all.
            There is no /admin/profile page, so the menu offers Settings and
            Sign Out rather than linking somewhere that 404s. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Account menu'
              className='rounded-full size-10 sm:size-16 mx-auto p-0 overflow-hidden'
            >
              <img
                src={'/dummy-profile-pic.jpg'}
                alt='Account'
                className='rounded-full w-full h-full object-cover'
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-52'>
            <DropdownMenuItem asChild>
              <Link
                href='/admin/settings'
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
      </div>
    </header>
  );
};

export default AdminHeader;

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
        'h-[45px] md:h-[50px] lg:h-[55px] 2xl:h-[65px] rounded-[12px] p-5 flex justify-start md:justify-center items-center gap-2 bg-accent text-muted-foreground hover:text-white transition-colors duration-200 px-3 lg:px-4 text-xs xs:text-sm lg:text-lg font-medium',
        pathName === href && 'text-primary',
        className,
      )}
    >
      {icon}
      <span>{children}</span>
    </Button>
  );
}
