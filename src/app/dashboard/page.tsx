'use client';

import { useUser } from '@/hooks/use-user';
import CeoDashboard from '@/components/dashboard/ceo';
import DeveloperDashboard from '@/components/dashboard/developer';
import TeamLeadDashboard from '@/components/dashboard/team-lead';
import FinanceDashboard from '@/components/dashboard/finance';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardSuggestions from '@/components/dashboard/dashboard-suggestions';
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
      <div className="space-y-6 p-4">
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
        return <div>Invalid user role. Please log out and try again.</div>;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">
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
