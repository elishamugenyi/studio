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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Project {
  projectid: number;
  name: string;
  description: string;
  developername: string;
  status: string;
}

function DeleteProjectDialog({ project, onProjectDeleted }: { project: Project, onProjectDeleted: () => void }) {
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const isConfirmationMatching = confirmationText === project.name;

    const handleDelete = async () => {
        if (!isConfirmationMatching) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/team-lead/projects?projectId=${project.projectid}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to delete project.');
            
            toast({ title: "Project Deleted", description: `"${project.name}" has been permanently deleted.` });
            onProjectDeleted();
            document.getElementById(`close-delete-dialog-${project.projectid}`)?.click();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert /> Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the project <span className="font-bold text-foreground">{project.name}</span> and all of its associated data. To confirm, please type the project name below.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input 
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type project name to confirm"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel id={`close-delete-dialog-${project.projectid}`}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={!isConfirmationMatching || isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Project
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default function MyCreatedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/team-lead/projects');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch projects.');
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [toast]);
  

  const renderContent = () => {
    if (isLoading) {
      return (
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-1/3" /></TableCell>
              <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (projects.length === 0) {
      return (
        <TableBody>
            <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                    You have not created any projects yet.
                </TableCell>
            </TableRow>
        </TableBody>
      );
    }

    return (
        <TableBody>
            {projects.map((project) => (
                <TableRow key={project.projectid}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{project.description}</TableCell>
                    <TableCell>{project.developername}</TableCell>
                    <TableCell>
                        <Badge variant={
                            project.status === 'Approved' ? 'default' :
                            project.status === 'Rejected' ? 'destructive' :
                            'secondary'
                        }>{project.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DeleteProjectDialog project={project} onProjectDeleted={fetchProjects} />
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
          <FilePlus /> My Created Projects
        </CardTitle>
        <CardDescription>
          A list of all project requests you have submitted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Assigned Developer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {renderContent()}
        </Table>
      </CardContent>
    </Card>
  );
}
