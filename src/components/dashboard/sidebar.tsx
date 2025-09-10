'use client';

import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Users,
  DollarSign,
  Code,
  Settings,
  Package2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Logo from '../logo';
import { useUser } from '@/hooks/use-user';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['CEO', 'Team Lead', 'Developer', 'Finance'] },
  { href: '#', icon: ListTodo, label: 'Tasks', roles: ['CEO', 'Team Lead', 'Developer'] },
  { href: '#', icon: BarChart3, label: 'Projects', roles: ['CEO', 'Team Lead', 'Developer'] },
  { href: '#', icon: Users, label: 'Team', roles: ['CEO', 'Team Lead'] },
  { href: '#', icon: DollarSign, label: 'Finance', roles: ['CEO', 'Finance'] },
  { href: '#', icon: Code, label: 'Modules', roles: ['CEO', 'Developer'] },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-sidebar sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link href="/dashboard" className="mb-2">
            <Package2 className="h-6 w-6 text-primary" />
            <span className="sr-only">TekView</span>
          </Link>
          {navItems.filter(item => user && item.roles.includes(user.role)).map((item) => (
            <Tooltip key={item.label} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground hover:bg-sidebar-accent md:h-8 md:w-8',
                    pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
