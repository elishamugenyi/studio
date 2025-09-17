import { Users, ListTodo, BarChart3, AlertTriangle, UserPlus, FileText, GanttChartSquare } from 'lucide-react';
import OverviewStats from '../overview-stats';
import TasksTable from '../tasks-table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import DashboardPage from '../dashboard-page';

const navItems = [
  { href: '#', icon: UserPlus, label: 'Request For Developer' },
  { href: '#', icon: FileText, label: 'Reports' },
  { href: '#', icon: GanttChartSquare, label: 'Project Progress' },
];

const teamMembers = [
    { name: 'Mike Chen', tasksCompleted: 8, capacity: 80 },
    { name: 'Laura Smith', tasksCompleted: 6, capacity: 60 },
    { name: 'David Lee', tasksCompleted: 9, capacity: 95 },
];

export default function TeamLeadDashboard() {
  return (
    <DashboardPage navItems={navItems}>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <OverviewStats
              title="Team Members"
              value={teamMembers.length.toString()}
              description="Active on your projects"
              Icon={Users}
            />
            <OverviewStats
              title="Open Tasks"
              value="15"
              description="Across all team projects"
              Icon={ListTodo}
            />
            <OverviewStats
              title="Projects On Track"
              value="3"
              description="Out of 4 total"
              Icon={BarChart3}
            />
            <OverviewStats
              title="Risks Identified"
              value="1"
              description="In Project Orion"
              Icon={AlertTriangle}
            />
          </div>
          <div className="grid gap-4 md:gap-8 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="font-headline">Team Capacity</CardTitle>
                <CardDescription>Current task load and capacity for each team member.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMembers.map(member => (
                    <div key={member.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-muted-foreground">{member.capacity}%</span>
                        </div>
                        <Progress value={member.capacity} aria-label={`${member.name} capacity`} />
                    </div>
                ))}
              </CardContent>
            </Card>
            <TasksTable />
          </div>
        </div>
      </main>
    </DashboardPage>
  );
}
