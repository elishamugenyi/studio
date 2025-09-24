
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderCheck, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Project {
  projectId: number;
  projectName: string;
  description: string;
  duration: string;
  developerName: string;
  developerEmail: string;
  teamLeadName: string | null;
  status: string;
  progress: number;
}

export default function ApprovedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [developerFilter, setDeveloperFilter] = useState('all');
  const [teamLeadFilter, setTeamLeadFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchApprovedProjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/approved_project');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch approved projects.');
        }
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovedProjects();
  }, [toast]);

  const uniqueDevelopers = useMemo(() => {
    const developerMap = new Map<string, Project>();
    projects.forEach(p => {
        if (!developerMap.has(p.developerEmail)) {
            developerMap.set(p.developerEmail, p);
        }
    });
    return Array.from(developerMap.values());
  }, [projects]);
  
  const uniqueTeamLeads = useMemo(() => [...new Set(projects.map(p => p.teamLeadName).filter(Boolean))] as string[], [projects]);
  const uniqueStatuses = useMemo(() => [...new Set(projects.map(p => p.status))], [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const nameMatch = project.projectName.toLowerCase().includes(nameFilter.toLowerCase());
      const developerMatch = developerFilter === 'all' || project.developerEmail === developerFilter;
      const teamLeadMatch = teamLeadFilter === 'all' || project.teamLeadName === teamLeadFilter;
      const statusMatch = statusFilter === 'all' || project.status === statusFilter;
      return nameMatch && developerMatch && teamLeadMatch && statusMatch;
    });
  }, [projects, nameFilter, developerFilter, teamLeadFilter, statusFilter]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <TableBody>
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                    No approved projects match your filters.
                </TableCell>
            </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {filteredProjects.map((project) => (
          <TableRow key={project.projectId}>
            <TableCell>
              <div className="font-medium">{project.projectName}</div>
              <div className="text-sm text-muted-foreground">{project.duration}</div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <div>{project.developerName}</div>
                <div className="text-xs text-muted-foreground">{project.developerEmail}</div>
            </TableCell>
            <TableCell className="hidden lg:table-cell">{project.teamLeadName || 'N/A'}</TableCell>
            <TableCell className="hidden sm:table-cell">
                <Badge variant={project.status === 'Approved' ? 'default' : 'secondary'}>{project.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm font-medium">{project.progress}%</span>
                <Progress value={project.progress} className="w-24" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <FolderCheck /> Approved Projects
        </CardTitle>
        <CardDescription>
          View, search, and filter all approved projects in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="relative flex-1 w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by project name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="pl-8 w-full"
                />
            </div>
            <Select value={developerFilter} onValueChange={setDeveloperFilter}>
                <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Filter by Developer" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Developers</SelectItem>
                    {uniqueDevelopers.map(dev => 
                        <SelectItem key={dev.developerEmail} value={dev.developerEmail}>
                            {dev.developerName} ({dev.developerEmail})
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
            <Select value={teamLeadFilter} onValueChange={setTeamLeadFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Team Lead" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Team Leads</SelectItem>
                    {uniqueTeamLeads.map(lead => <SelectItem key={lead} value={lead}>{lead}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="hidden md:table-cell">Developer</TableHead>
              <TableHead className="hidden lg:table-cell">Team Lead</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Progress</TableHead>
            </TableRow>
          </TableHeader>
          {renderContent()}
        </Table>
      </CardContent>
    </Card>
  );
}
