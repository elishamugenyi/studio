import { GitBranch, ListTodo, Clock, CheckCircle2 } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { tasks } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import OverviewStats from '../overview-stats';

export default function DeveloperDashboard() {
  const myTasks = tasks.slice(0, 5);

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <OverviewStats
                title="My Active Tasks"
                value={myTasks.filter(t => t.status === 'In Progress').length.toString()}
                description="Tasks currently assigned to you"
                Icon={ListTodo}
            />
            <OverviewStats
                title="Pending PRs"
                value="3"
                description="Pull requests awaiting review"
                Icon={GitBranch}
            />
            <OverviewStats
                title="Tasks Due Soon"
                value="2"
                description="In the next 7 days"
                Icon={Clock}
            />
            <OverviewStats
                title="Completed This Week"
                value="5"
                description="+10% from last week"
                Icon={CheckCircle2}
            />
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Tasks</CardTitle>
                <CardDescription>All tasks assigned to you across projects.</CardDescription>
            </CardHeader>
            <CardContent>
            <ul className="space-y-4">
              {myTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border bg-background/30 p-4 transition-all hover:bg-muted/50"
                >
                  <div className="grid gap-1">
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Project: {task.project}
                    </p>
                  </div>
                  <div className='flex items-center gap-4'>
                    <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>
                        {task.priority}
                    </Badge>
                    <div className="text-sm text-muted-foreground">Due: {task.dueDate}</div>
                  </div>
                </li>
              ))}
            </ul>
            </CardContent>
        </Card>
    </div>
  )
}
