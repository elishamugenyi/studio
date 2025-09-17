import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardSuggestions from './dashboard-suggestions';
import { useUser } from '@/hooks/use-user';
import AppHeader from './header';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
};

type DashboardPageProps = {
  navItems: NavItem[];
  children: React.ReactNode;
};

export default function DashboardPage({ navItems, children }: DashboardPageProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const isRequestDeveloperPage = pathname === '/dashboard/request-developer';
  
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-primary">
                <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3.366 6.332A.75.75 0 0 0 3 6.963v10.074a.75.75 0 0 0 .366.631l8.256 4.73A.75.75 0 0 0 12 22.128a.75.75 0 0 0 .378-.128l8.256-4.73a.75.75 0 0 0 .366-.63V6.963a.75.75 0 0 0-.366-.631L12.378 1.602ZM12 3.123l6.845 3.91-3.423 1.956L12 7.033 8.577 9.006 5.155 7.033 12 3.123Z M4.5 8.356l3.75 2.143v3.8l-3.75-2.143v-3.8Zm4.5 6.283v3.8l3-1.714v-3.8l-3 1.714Zm.75-5.955 3-1.714v3.8l-3 1.714v-3.8Zm4.5 5.955v3.8l3-1.714v-3.8l-3 1.714Zm.75 5.253-6.845-3.911 3.423-1.956 3.422 1.956-6.844 3.911Z" />
              </svg>
              <span>TPM</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-2 px-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex flex-col">
        <AppHeader />
         {isRequestDeveloperPage ? (
          children
        ) : (
          <main className="flex-1 overflow-auto">
            <div className="flex items-center justify-between p-4 md:p-6 pb-0">
                {user && (
                    <>
                        <div>
                            <h1 className="text-2xl font-bold font-headline">
                                Welcome, {user.name}!
                            </h1>
                            <p className="text-muted-foreground">Here's your overview for today.</p>
                        </div>
                        <DashboardSuggestions role={user.role} />
                    </>
                )}
            </div>
            {children}
          </main>
        )}
      </div>
    </div>
  );
}
