
'use client';

import { useUser } from '@/hooks/use-user';
import CeoDashboard from '@/components/dashboard/ceo';
import DeveloperDashboard from '@/components/dashboard/developer';
import TeamLeadDashboard from '@/components/dashboard/team-lead';
import FinanceDashboard from '@/components/dashboard/finance';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSuggestions from '@/components/dashboard/dashboard-suggestions';

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
      <>
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
      </>
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
        );
    }
  };

  return (
    <>
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold font-headline">
                    Welcome, {user.name}!
                </h1>
                <p className="text-muted-foreground">Here's your overview for today.</p>
            </div>
            <DashboardSuggestions role={user.role} />
        </div>
        {renderDashboard()}
    </>
  );
}
