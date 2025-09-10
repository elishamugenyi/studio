import { DollarSign, ListTodo, BarChart3, Users } from 'lucide-react';
import OverviewStats from '../overview-stats';
import ProgressChart from '../progress-chart';
import TasksTable from '../tasks-table';
import ModuleReview from './module-review';

export default function CeoDashboard() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <OverviewStats
          title="Total Revenue"
          value="$1,329,290"
          description="+20.1% from last month"
          Icon={DollarSign}
        />
        <OverviewStats
          title="Active Projects"
          value="12"
          description="+2 from last month"
          Icon={BarChart3}
        />
        <OverviewStats
          title="Tasks Completed"
          value="532"
          description="+120 this month"
          Icon={ListTodo}
        />
        <OverviewStats
          title="Team Members"
          value="25"
          description="3 new hires"
          Icon={Users}
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-1 xl:grid-cols-7">
        <ProgressChart />
        <TasksTable />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-1 xl:grid-cols-1">
        <ModuleReview />
      </div>
    </div>
  );
}
