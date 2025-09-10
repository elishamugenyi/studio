import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tasks } from '@/lib/data';

export default function TasksTable() {
  return (
    <Card className="col-span-1 lg:col-span-3 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline">Recent Tasks</CardTitle>
        <CardDescription>An overview of the latest tasks across all projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead className="hidden sm:table-cell">Project</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.slice(0, 5).map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="font-medium">{task.title}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {task.id}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{task.project}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge
                    variant={
                      task.status === 'Done'
                        ? 'secondary'
                        : task.status === 'In Progress'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{task.dueDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
