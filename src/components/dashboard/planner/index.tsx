import { Users, ListTodo, Calendar, BarChart3 } from 'lucide-react';
import OverviewStats from '../overview-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { tasks, projects } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export default function PlannerDashboard() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <OverviewStats
          title="Total Projects"
          value={projects.length.toString()}
          description="Across the organization"
          Icon={BarChart3}
        />
        <OverviewStats
          title="Total Tasks"
          value={tasks.length.toString()}
          description="In backlog and in progress"
          Icon={ListTodo}
        />
        <OverviewStats
          title="Upcoming Deadlines"
          value="5"
          description="In the next 30 days"
          Icon={Calendar}
        />
        <OverviewStats
          title="Available Developers"
          value="8"
          description="Not at full capacity"
          Icon={Users}
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">High-Priority Tasks</CardTitle>
            <CardDescription>Tasks that need immediate attention for planning.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {tasks.filter(t => t.priority === 'High').slice(0, 5).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="grid gap-1">
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Project: {task.project}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant={
                      task.status === 'Done' ? 'secondary' :
                      task.status === 'In Progress' ? 'default' : 'outline'
                    }>
                        {task.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">{task.dueDate}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline">Project Calendar</CardTitle>
                <CardDescription>Key dates and deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex justify-center items-center">
                <CalendarComponent
                    mode="multiple"
                    selected={[new Date(2024, 7, 15), new Date(2024, 7, 20), new Date(2024, 7, 25)]}
                    className="rounded-md border"
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
