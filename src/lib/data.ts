export type Task = {
  id: string;
  title: string;
  project: string;
  status: 'Done' | 'In Progress' | 'Backlog';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
};

export const tasks: Task[] = [
  { id: 'TASK-8782', title: 'Implement user authentication', project: 'Phoenix', status: 'In Progress', priority: 'High', dueDate: '2024-08-15' },
  { id: 'TASK-7878', title: 'Design dashboard UI', project: 'Phoenix', status: 'Done', priority: 'Medium', dueDate: '2024-07-30' },
  { id: 'TASK-4582', title: 'Setup database schema', project: 'Orion', status: 'In Progress', priority: 'High', dueDate: '2024-08-20' },
  { id: 'TASK-6811', title: 'API endpoint for tasks', project: 'Orion', status: 'Backlog', priority: 'Medium', dueDate: '2024-09-01' },
  { id: 'TASK-1352', title: 'Fix login page CSS', project: 'Vega', status: 'Done', priority: 'Low', dueDate: '2024-07-25' },
  { id: 'TASK-9842', title: 'Write API documentation', project: 'Phoenix', status: 'Backlog', priority: 'Medium', dueDate: '2024-09-10' },
  { id: 'TASK-3334', title: 'Refactor payment gateway', project: 'Odyssey', status: 'In Progress', priority: 'High', dueDate: '2024-08-25' },
  { id: 'TASK-5432', title: 'Client-side form validation', project: 'Vega', status: 'Done', priority: 'Medium', dueDate: '2024-08-01' },
];

export type Project = {
  name: string;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Off Track';
  team: string[];
  budget: number;
  spent: number;
};

export const projects: Project[] = [
    { name: 'Project Phoenix', progress: 75, status: 'On Track', team: ['Samantha Ray', 'Mike Chen'], budget: 100000, spent: 65000 },
    { name: 'Project Orion', progress: 40, status: 'At Risk', team: ['Samantha Ray', 'Mike Chen'], budget: 150000, spent: 80000 },
    { name: 'Project Vega', progress: 95, status: 'On Track', team: ['Samantha Ray'], budget: 80000, spent: 75000 },
    { name: 'Project Odyssey', progress: 20, status: 'Off Track', team: ['Mike Chen'], budget: 200000, spent: 50000 },
];

export type Notification = {
    id: string;
    title: string;
    description: string;
    time: string;
};

export const notifications: Notification[] = [
    { id: '1', title: 'Task Completed', description: 'Mike Chen completed "Design dashboard UI".', time: '15m ago' },
    { id: '2', title: 'New Task Assigned', description: 'You have been assigned "API endpoint for tasks".', time: '1h ago' },
    { id: '3', title: 'Project Update', description: 'Project Orion is now "At Risk".', time: '3h ago' },
    { id: '4', title: 'Module Approved', description: 'CEO Alex Thompson approved the "User Authentication" module.', time: '1d ago' },
];

export const financialData = [
  { month: 'January', revenue: 4000, expenses: 2400 },
  { month: 'February', revenue: 3000, expenses: 1398 },
  { month: 'March', revenue: 5000, expenses: 7800 },
  { month: 'April', revenue: 4780, expenses: 3908 },
  { month: 'May', revenue: 6890, expenses: 4800 },
  { month: 'June', revenue: 5390, expenses: 3800 },
  { month: 'July', revenue: 7490, expenses: 4300 },
];
