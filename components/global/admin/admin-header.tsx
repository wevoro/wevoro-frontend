'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useNotificationsContext } from '@/lib/contexts';
import { cn } from '@/lib/utils';
import { Bell, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React from 'react';

const AdminHeader = () => {
  const { isUnreadNotification } = useNotificationsContext();
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

        <Button
          // href={`${path}/profile`}
          variant='ghost'
          size='icon'
          className='rounded-full size-10 sm:size-16 mx-auto'
        >
          <img
            src={'/dummy-profile-pic.jpg'}
            alt='User'
            className='rounded-full w-full h-full object-cover'
          />
        </Button>
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
        'h-[45px] md:h-[50px] lg:h-[55px] 2xl:h-[65px] rounded-[12px] p-5 flex justify-start md:justify-center items-center gap-2 bg-accent text-[#6C6C6C] hover:text-white transition-colors duration-200 px-3 lg:px-4 text-xs xs:text-sm lg:text-lg font-medium',
        pathName === href && 'text-primary',
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </Button>
  );
}
