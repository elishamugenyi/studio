'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser, UserRole } from '@/hooks/use-user';
import {
  LayoutDashboard,
  FileCheck,
  FolderCheck,
  CircleDollarSign,
  CheckSquare,
  ListChecks,
  UserPlus,
  FileText,
  GanttChartSquare,
  FolderGit2,
  Blocks,
  CreditCard,
  Trophy,
  Users,
  UserCog,
  FilePlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const roleNavItems: Record<UserRole, NavItem[]> = {
  'CEO': [
    { href: '/dashboard/submitted-requests', icon: FileCheck, label: 'Submitted Requests' },
    { href: '/dashboard/approved-projects', icon: FolderCheck, label: 'Approved Projects' },
    { href: '/dashboard/finance-report', icon: CircleDollarSign, label: 'Finance Report' },
    { href: '/dashboard/completed-projects', icon: CheckSquare, label: 'Completed Projects' },
    { href: '/dashboard/completed-modules', icon: ListChecks, label: 'Completed Modules' },
  ],
  'Team Lead': [
    { href: '/dashboard/request-developer', icon: UserPlus, label: 'Request For Developer' },
    { href: '/dashboard/my-created-projects', icon: FilePlus, label: 'My Created Projects' },
    { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
    { href: '/dashboard/project-progress', icon: GanttChartSquare, label: 'Project Progress' },
  ],
  'Developer': [
    { href: '/dashboard/my-projects', icon: FolderGit2, label: 'My Projects' },
    { href: '/dashboard/modules', icon: Blocks, label: 'Modules' },
    { href: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
    { href: '/dashboard/achievements', icon: Trophy, label: 'Achievements' },
  ],
  'Finance': [],
  'Planner': [],
  'Admin': [
      { href: '/dashboard/admin', icon: UserCog, label: 'User Management'},
  ]
};

export default function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = user ? roleNavItems[user.role] || [] : [];
  
  const Wrapper = isMobile ? 'div' : 'aside';
  const wrapperClass = isMobile
    ? 'flex h-full max-h-screen flex-col gap-2'
    : 'hidden border-r bg-card md:block';

  return (
    <Wrapper className={wrapperClass}>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-primary">
                <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3.366 6.332A.75.75 0 0 0 3 6.963v10.074a.75.75 0 0 0 .366.631l8.256 4.73A.75.75 0 0 0 12 22.128a.75.75 0 0 0 .378-.128l8.256-4.73a.75.75 0 0 0 .366-.63V6.963a.T5.T5 0 0 0-.366-.631L12.378 1.602ZM12 3.123l6.845 3.91-3.423 1.956L12 7.033 8.577 9.006 5.155 7.033 12 3.123Z M4.5 8.356l3.75 2.143v3.8l-3.75-2.143v-3.8Zm4.5 6.283v3.8l3-1.714v-3.8l-3 1.714Zm.75-5.955 3-1.714v3.8l-3 1.714v-3.8Zm4.5 5.955v3.8l3-1.714v-3.8l-3 1.714Zm.75 5.253-6.845-3.911 3.423-1.956 3.422 1.956-6.844 3.911Z" />
              </svg>
              <span>TPM</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-2 px-2 text-sm font-medium lg:px-4">
            <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  pathname === '/dashboard' && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
        </nav>
    </Wrapper>
  );
}
