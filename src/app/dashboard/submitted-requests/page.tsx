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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, FileCheck, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
  projectid: number;
  name: string;
  description: string;
  duration: string;
  developername: string;
  review?: string;
}

export default function SubmittedRequestsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchPendingProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ceo_approve_project');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch pending projects.');
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

  useEffect(() => {
    fetchPendingProjects();
  }, []);

  const handleAction = async (projectId: number, status: 'Approved' | 'Rejected', review: string = '') => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/ceo_approve_project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, status, review }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${status.toLowerCase()} project.`);
      }

      toast({
        title: 'Success',
        description: `Project has been ${status.toLowerCase()}.`,
      });

      // Refresh the list
      fetchPendingProjects();
      setRejectionReason(''); // Reset reason
      if(selectedProject) {
        // Close dialog if open
        const closeButton = document.getElementById(`close-dialog-${selectedProject.projectid}`);
        closeButton?.click();
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="text-right"><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div></TableCell>
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
                    No pending requests at the moment.
                </TableCell>
            </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.projectid}>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="font-medium">{project.name}</div>
                {project.review && project.review.includes('APPEAL RESPONSE:') && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    <MessageSquare className="h-3 w-3" />
                    Appeal
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{project.duration}</div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{project.description}</TableCell>
            <TableCell className="hidden sm:table-cell">{project.developername}</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => handleAction(project.projectid, 'Approved')} disabled={isSubmitting}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Dialog onOpenChange={(open) => !open && setSelectedProject(null)}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" onClick={() => setSelectedProject(project)}>
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </DialogTrigger>
                  {selectedProject?.projectid === project.projectid && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Project: {project.name}</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for rejecting this project request. This feedback will be recorded.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="e.g., Project scope is not clear, budget is too high, etc."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost" id={`close-dialog-${project.projectid}`}>Cancel</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleAction(project.projectid, 'Rejected', rejectionReason)}
                          disabled={isSubmitting || !rejectionReason.trim()}
                        >
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Rejection'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  )}
                </Dialog>
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
            <FileCheck /> Submitted Project Requests
        </CardTitle>
        <CardDescription>
          Review, approve, or reject new project requests submitted by Team Leads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden sm:table-cell">Developer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {renderContent()}
        </Table>
      </CardContent>
    </Card>
  );
}
