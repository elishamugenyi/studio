'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, User, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Module {
  moduleid: number;
  name: string;
  description: string;
  status: string;
  startdate: string;
  enddate: string;
  markedcompletedate?: string;
  commitlink?: string;
}

interface ProjectReport {
  projectid: number;
  project_name: string;
  project_description: string;
  project_status: string;
  createdby: number;
  developerid?: number;
  developer_name?: string;
  developer_email?: string;
  developer_expertise?: string;
  total_modules: number;
  completed_modules: number;
  started_modules: number;
  pending_modules: number;
  progress_percentage: number;
  module_details: Module[];
}

interface Developer {
  developerid: number;
  developer_name: string;
  developer_email: string;
}

interface Project {
  projectid: number;
  project_name: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedDeveloper !== 'all') {
          params.append('developerId', selectedDeveloper);
        }
        if (selectedProject !== 'all') {
          params.append('projectId', selectedProject);
        }

        const response = await fetch(`/api/team-lead/reports?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
          setDevelopers(data.developers || []);
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [selectedDeveloper, selectedProject]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Started':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Complete':
        return 'default';
      case 'Started':
        return 'secondary';
      case 'Pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Project Progress Reports
          </h1>
          <p className="text-muted-foreground">
            Track the progress of projects from developers by seeing completed and in-progress modules.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter reports by developer or project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Developer</label>
              <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
                <SelectTrigger>
                  <SelectValue placeholder="Select developer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Developers</SelectItem>
                  {developers.map((dev) => (
                    <SelectItem key={dev.developerid} value={dev.developerid.toString()}>
                      {dev.developer_name} ({dev.developer_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.projectid} value={project.projectid.toString()}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
            <p className="text-muted-foreground">
              No project progress data available for the selected filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={`${report.projectid}-${report.developerid || 'unassigned'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{report.project_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {report.project_description}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    report.project_status === 'Approved' ? 'default' :
                    report.project_status === 'Rejected' ? 'destructive' : 'secondary'
                  }>
                    {report.project_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Developer Info */}
                  {report.developer_name ? (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">{report.developer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.developer_email}
                          {report.developer_expertise && ` • ${report.developer_expertise}`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div className="text-muted-foreground">No developer assigned</div>
                    </div>
                  )}

                  {/* Progress Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{report.total_modules}</div>
                      <div className="text-sm text-muted-foreground">Total Modules</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{report.completed_modules}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{report.started_modules}</div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{report.pending_modules}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Overall Progress</span>
                      <span className="text-muted-foreground">{report.progress_percentage}%</span>
                    </div>
                    <Progress value={report.progress_percentage} className="h-2" />
                  </div>

                  {/* Module Details */}
                  {report.module_details && report.module_details.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">Module Details</h4>
                      <div className="grid gap-3">
                        {report.module_details.map((module) => (
                          <div
                            key={module.moduleid}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(module.status)}
                                <span className="font-medium">{module.name}</span>
                                <Badge variant={getStatusBadgeVariant(module.status)}>
                                  {module.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {module.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Start: {format(new Date(module.startdate), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {format(new Date(module.enddate), 'MMM dd, yyyy')}</span>
                                </div>
                                {module.markedcompletedate && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <span>Completed: {format(new Date(module.markedcompletedate), 'MMM dd, yyyy')}</span>
                                  </div>
                                )}
                              </div>
                              {module.commitlink && (
                                <div className="mt-2">
                                  <a
                                    href={module.commitlink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    View Commit →
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
