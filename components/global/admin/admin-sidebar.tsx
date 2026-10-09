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
  DollarSign,
  FileBadge,
  LayoutDashboardIcon,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Logo from '../logo';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/lib/contexts';
import { SHOW_AI_AUTOMATION_PAGE } from '@/lib/feature-flags';

const items = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboardIcon,
  },
  {
    title: 'Agencies',
    url: '/admin/agencies',
    icon: Building2,
  },
  {
    title: 'Caregivers',
    url: '/admin/caregivers',
    icon: FileBadge,
  },
  {
    title: 'Schedules',
    url: '/admin/schedules',
    icon: Briefcase,
    disabled: true,
  },
  {
    title: "User's Feedback",
    url: '/admin/feedbacks',
    icon: MessageCircleQuestion,
    disabled: false,
  },
  // SCRUM-113: per-packet pricing. The whole /admin area is already role-gated,
  // and the backend gates the endpoints with auth(ADMIN), which also admits
  // super_admin — so this is the founder/admin-only section the ticket asks for.
  {
    title: 'Pricing',
    url: '/admin/pricing',
    icon: DollarSign,
  },
];

// Super Admin panel: visible only to super_admin.
const superAdminItems = [
  {
    title: 'Admins',
    url: '/admin/admins',
    icon: ShieldCheck,
  },
];

// How much of the credential review the AI does. Last in the list, below the
// Super Admin panel, because it is a platform-wide switch rather than a place
// an admin works day to day. Gated by auth(ADMIN) on the backend like Pricing.
const aiItems = [
  {
    title: 'AI Automation',
    url: '/admin/ai-automation',
    icon: Sparkles,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { user } = useUserContext();

  const ai = SHOW_AI_AUTOMATION_PAGE ? aiItems : [];
  const navItems =
    user?.role === 'super_admin'
      ? [...items, ...superAdminItems, ...ai]
      : [...items, ...ai];

  return (
    <Sidebar>
      <SidebarHeader className='bg-white p-8 pb-0'>
        <Logo />
      </SidebarHeader>
      <SidebarContent className='bg-white p-8'>
        <SidebarGroup className='p-0'>
          <SidebarGroupContent>
            <SidebarMenu className='list-none pl-0'>
              {navItems.map((item: any) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem
                    key={item.title}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link
                      href={item.url}
                      className={cn(
                        // SCRUM-113 design: the active item is a light-green
                        // pill. The negative margin cancels the horizontal
                        // padding, so the pill has room without shifting any
                        // label from where it sits today.
                        'flex items-center gap-6 py-3 px-3 -mx-3 rounded-lg transition-colors',
                        {
                          'text-primary font-bold bg-[#E9F7EE]': isActive,
                          'text-tertiary hover:text-primary hover:font-bold':
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
