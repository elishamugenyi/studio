'use client';

import { GitBranch, ListTodo, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OverviewStats from '../overview-stats';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Module {
  moduleid: number;
  name: string;
  description: string;
  status: string;
  startdate: string;
  enddate: string;
  project_name: string;
  priority: string;
  dueDate: string;
}

interface ModuleStats {
  activeModules: number;
  pendingModules: number;
  dueSoon: number;
  completedThisWeek: number;
  completedLastWeek: number;
  percentageChange: number;
}

export default function DeveloperDashboard() {
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        const response = await fetch('/api/modules?dashboard=true');
        if (response.ok) {
          const data = await response.json();
          setModules(data.modules || []);
          setStats(data.stats || null);
        }
      } catch (error) {
        console.error('Error fetching module data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModuleData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-80 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <OverviewStats
                title="My Active Modules"
                value={stats?.activeModules?.toString() || '0'}
                description="Modules currently in progress"
                Icon={ListTodo}
            />
            <OverviewStats
                title="Pending Modules"
                value={stats?.pendingModules?.toString() || '0'}
                description="Modules awaiting start"
                Icon={GitBranch}
            />
            <OverviewStats
                title="Modules Due Soon"
                value={stats?.dueSoon?.toString() || '0'}
                description="Due within 7 days"
                Icon={Clock}
            />
            <OverviewStats
                title="Completed This Week"
                value={stats?.completedThisWeek?.toString() || '0'}
                description={stats?.percentageChange ? 
                  `${stats.percentageChange > 0 ? '+' : ''}${stats.percentageChange}% from last week` : 
                  'No previous data'
                }
                Icon={CheckCircle2}
            />
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Modules</CardTitle>
                <CardDescription>All modules assigned to you across projects.</CardDescription>
            </CardHeader>
            <CardContent>
            {modules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No modules assigned to you yet.
              </div>
            ) : (
              <ul className="space-y-4">
                {modules.map((module) => (
                  <li
                    key={module.moduleid}
                    className="flex items-center justify-between rounded-lg border bg-background/30 p-4 transition-all hover:bg-muted/50"
                  >
                    <div className="grid gap-1">
                      <p className="font-semibold">{module.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Project: {module.project_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Badge variant={
                        module.priority === 'High' ? 'destructive' : 
                        module.priority === 'Medium' ? 'default' : 'secondary'
                      }>
                          {module.priority}
                      </Badge>
                      <Badge variant={
                        module.status === 'Started' ? 'default' : 'outline'
                      }>
                          {module.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Due: {format(new Date(module.dueDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            </CardContent>
        </Card>
    </div>
  )
}
