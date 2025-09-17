
'use client';

import { useUser } from '@/hooks/use-user';
import CeoDashboard from '@/components/dashboard/ceo';
import DeveloperDashboard from '@/components/dashboard/developer';
import TeamLeadDashboard from '@/components/dashboard/team-lead';
import FinanceDashboard from '@/components/dashboard/finance';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-card lg:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-[60px] items-center border-b px-6">
                    <Skeleton className="h-8 w-24" />
                </div>
                <div className="flex-1 overflow-auto py-2 px-4 space-y-2">
                    <Skeleton className="h-8 rounded-lg" />
                    <Skeleton className="h-8 rounded-lg" />
                    <Skeleton className="h-8 rounded-lg" />
                </div>
            </div>
        </div>
        <div className="flex flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
                <div className="flex items-center gap-4 ml-auto">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </header>
            <main className="space-y-6 p-4 md:p-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-48" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="col-span-4 h-80 rounded-lg" />
                    <Skeleton className="col-span-3 h-80 rounded-lg" />
                </div>
            </main>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'CEO':
        return <CeoDashboard />;
      case 'Developer':
        return <DeveloperDashboard />;
      case 'Team Lead':
        return <TeamLeadDashboard />;
      case 'Finance':
        return <FinanceDashboard />;
      default:
        return (
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center">
              <h1 className="font-semibold text-lg md:text-2xl">Welcome</h1>
            </div>
            <div
              className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  Invalid user role.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please log out and try again.
                </p>
              </div>
            </div>
          </main>
        );
    }
  };

  return renderDashboard();
}
