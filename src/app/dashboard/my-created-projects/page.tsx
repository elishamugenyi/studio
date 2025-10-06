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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, Trash2, Loader2, AlertCircle, Edit, Save, X, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Project {
  projectid: number;
  name: string;
  description: string;
  developername: string;
  developeremail?: string;
  developerexpertise?: string;
  duration?: string;
  status: string;
  progress: number;
  total_modules: number;
  completed_modules: number;
  review?: string;
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
                    <AlertDialogTitle className="flex items-center gap-2"><AlertCircle /> Are you absolutely sure?</AlertDialogTitle>
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

function AppealProjectDialog({ project, onProjectUpdated }: { project: Project, onProjectUpdated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: project.name,
        description: project.description,
        duration: project.duration || '',
        appealresponse: '',
    });
    const { toast } = useToast();

    const handleAppeal = async () => {
        if (!formData.name.trim() || !formData.description.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name and description are required.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/project-appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.projectid,
                    name: formData.name,
                    description: formData.description,
                    duration: formData.duration,
                    appealresponse: formData.appealresponse,
                }),
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to submit appeal.');
            
            toast({ title: "Appeal Submitted", description: "Your project has been resubmitted for review." });
            onProjectUpdated();
            setIsOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Appeal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Appeal Rejected Project</DialogTitle>
                    <DialogDescription>
                        Review the rejection feedback and update your project details to address the concerns.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    {/* Show original review */}
                    {project.review && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="font-semibold text-red-800 mb-2">Rejection Feedback:</h4>
                            <p className="text-sm text-red-700 whitespace-pre-wrap">{project.review}</p>
                        </div>
                    )}

                    {/* Edit form */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Project Name</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter project name"
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your project"
                                rows={4}
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Duration</label>
                            <Input
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="e.g., 3 months, 6 weeks"
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Appeal Response (Optional)</label>
                            <Textarea
                                value={formData.appealresponse}
                                onChange={(e) => setFormData({ ...formData, appealresponse: e.target.value })}
                                placeholder="Address the feedback and explain any changes made..."
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button onClick={handleAppeal} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Submit Appeal
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditProjectDialog({ project, onProjectUpdated }: { project: Project, onProjectUpdated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState({
        name: project.name,
        description: project.description,
        duration: project.duration || '',
    });
    const { toast } = useToast();
    
    // No longer checking status - edit button always available

    const handleUpdate = async () => {
        if (!formData.name.trim() || !formData.description.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name and description are required.' });
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetch('/api/request_submit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.projectid,
                    name: formData.name,
                    description: formData.description,
                    duration: formData.duration,
                }),
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to update project.');
            
            toast({ title: "Project Updated", description: `"${formData.name}" has been updated successfully.` });
            onProjectUpdated();
            setIsOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon" 
                    title="Edit Project"
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Make changes to your project. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="name" className="text-right">
                            Name
                        </label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="description" className="text-right">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="col-span-3"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="duration" className="text-right">
                            Duration
                        </label>
                        <Input
                            id="duration"
                            value={formData.duration}
                            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                            className="col-span-3"
                            placeholder="e.g., 2 weeks, 1 month"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
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
                <TableCell colSpan={6} className="h-24 text-center">
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
                    <TableCell>
                        <div className="space-y-1">
                            <div className="font-medium">{project.developername || 'Not assigned'}</div>
                            {project.developeremail && (
                                <div className="text-xs text-muted-foreground">{project.developeremail}</div>
                            )}
                            {project.developerexpertise && (
                                <div className="text-xs text-blue-600">{project.developerexpertise}</div>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={
                            project.status === 'Approved' ? 'default' :
                            project.status === 'Rejected' ? 'destructive' :
                            'secondary'
                        }>{project.status}</Badge>
                    </TableCell>
                    <TableCell>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${Math.max(0, Math.min(100, project.progress || 0))}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-medium">{Math.max(0, Math.min(100, project.progress || 0))}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {project.completed_modules || 0} of {project.total_modules || 0} modules
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 overflow-visible">
                            {/* Show appeal button for rejected projects */}
                            {project.status === 'Rejected' && (
                                <AppealProjectDialog project={project} onProjectUpdated={fetchProjects} />
                            )}
                            {/* Always show edit button, but disable for approved/completed projects */}
                            <EditProjectDialog project={project} onProjectUpdated={fetchProjects} />
                            <DeleteProjectDialog project={project} onProjectDeleted={fetchProjects} />
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
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {renderContent()}
        </Table>
      </CardContent>
    </Card>
  );
}
