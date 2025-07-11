'use client';

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Briefcase,
  Building2,
  FileBadge,
  LayoutDashboardIcon,
  MessageCircleQuestion,
} from 'lucide-react';
import Logo from '../logo';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const items = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboardIcon,
  },
  {
    title: "Pro's",
    url: '/admin/pros',
    icon: FileBadge,
  },
  {
    title: 'Partners',
    url: '/admin/partners',
    icon: Building2,
  },

  {
    title: 'User’s Feedback',
    url: '/admin/feedbacks',
    icon: MessageCircleQuestion,
    disabled: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className='bg-white p-8 pb-0'>
        <Logo />
      </SidebarHeader>
      <SidebarContent className='bg-white p-8'>
        <SidebarGroup className='p-0'>
          <SidebarGroupContent>
            <SidebarMenu className='list-none pl-0'>
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem
                    key={item.title}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link
                      href={item.url}
                      className={cn(
                        'flex items-center gap-6 py-3 rounded-lg transition-colors',
                        {
                          'text-primary font-bold': isActive,
                          'text-[#1C1C1C] hover:text-primary hover:font-bold':
                            !isActive,
                          'pointer-events-none opacity-50': item.disabled,
                        }
                      )}
                    >
                      <item.icon className={cn('w-6 h-6')} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
