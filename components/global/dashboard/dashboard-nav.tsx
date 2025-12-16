'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, FileText, Settings, Menu, Rocket } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Logo from '../logo';
import { useParams, usePathname } from 'next/navigation';
import { useNotificationsContext, useUserContext } from '@/lib/contexts';

export default function DashboardNav() {
  const { id } = useParams();
  const { user } = useUserContext();
  const { isUnreadNotification } = useNotificationsContext();
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

              <Button
                href={`${path}/profile`}
                variant='ghost'
                size='icon'
                className='rounded-full w-10 h-10 lg:w-16 lg:h-16'
              >
                <img
                  src={user?.personalInfo?.image || '/dummy-profile-pic.jpg'}
                  alt='User'
                  className='rounded-full w-full h-full object-cover'
                />
              </Button>
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
        'h-[45px] md:h-[50px] lg:h-[55px] 2xl:h-[65px] rounded-[12px] p-5 flex justify-start md:justify-center items-center gap-2 bg-accent text-[#6C6C6C] hover:text-white transition-colors duration-200 px-3 lg:px-4 text-base md:text-sm lg:text-lg font-medium',
        pathName === href && 'text-primary',
        className
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
