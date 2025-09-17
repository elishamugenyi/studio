'use client';

import Link from 'next/link';
import {
  Bell,
  Menu,
  Search,
  Settings,
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Users,
  DollarSign,
  Code,
  Package2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUser, UserAvatar } from '@/hooks/use-user';
import { notifications } from '@/lib/data';
import { Badge } from '../ui/badge';

const mobileNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['CEO', 'Team Lead', 'Developer', 'Finance', 'Planner'] },
    { href: '#', icon: ListTodo, label: 'Tasks', roles: ['CEO', 'Team Lead', 'Developer'] },
    { href: '#', icon: BarChart3, label: 'Projects', roles: ['CEO', 'Team Lead', 'Developer'] },
    { href: '#', icon: Users, label: 'Team', roles: ['CEO', 'Team Lead'] },
    { href: '#', icon: DollarSign, label: 'Finance', roles: ['CEO', 'Finance'] },
    { href: '#', icon: Code, label: 'Modules', roles: ['CEO', 'Developer'] },
  ];

export default function AppHeader() {
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6 lg:border-0 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs bg-card">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">TPM</span>
            </Link>
            {mobileNavItems.filter(item => user && item.roles.includes(user.role)).map(item => (
                <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block w-full" />
      
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="h-5 w-5" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{notifications.length}</Badge>
                  <span className="sr-only">Toggle notifications</span>
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[350px]">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-1">
                  {notifications.slice(0, 4).map(notification => (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1">
                          <p className="font-semibold">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.description}</p>
                          <p className="text-xs text-muted-foreground/80">{notification.time}</p>
                      </DropdownMenuItem>
                  ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center">
                  View all notifications
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
              <UserAvatar />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name || "My Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.email && <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user.email}</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
