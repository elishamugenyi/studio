
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Loader2, FolderGit2, CheckCircle, Clock, Link, Trash2, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from '@/components/ui/label';

interface Module {
  moduleid: number;
  name: string;
  description: string;
  startdate: string;
  enddate: string;
  cost: number;
  currency: string;
  status: string;
  commitlink: string | null;
}

interface Project {
  projectid: number;
  name: string;
  description: string;
  duration: string;
  status: string;
  progress: number;
  modules: Module[];
}

const moduleSchema = z.object({
  name: z.string().min(3, "Module name is required."),
  description: z.string().min(10, "Description is required."),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date." }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date." }),
  cost: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Cost must be a positive number.")
  ),
  currency: z.string({ required_error: "Currency is required." }),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

function AddModuleForm({ projectId, onModuleAdded }: { projectId: number; onModuleAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      cost: 0,
      currency: "USD",
    }
  });

  const onSubmit = async (values: ModuleFormValues) => {
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, projectId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add module.');
      
      toast({ title: "Module Added", description: `Module "${values.name}" has been added.` });
      onModuleAdded();
      form.reset();
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error", description: error.message });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Module
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 mt-2 border rounded-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Name</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., API Integration" /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Describe the module's purpose..." /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="UGX">UGX</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Module
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function StartModuleButton({ module, onModuleUpdated }: { module: Module, onModuleUpdated: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleStart = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/modules', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: module.moduleid }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to start module.');

            toast({ title: 'Module Started!', description: `"${module.name}" is now in progress.` });
            onModuleUpdated();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Button 
            size="sm" 
            onClick={handleStart}
            disabled={isSubmitting || module.status !== 'Pending'}
            className="bg-blue-600 hover:bg-blue-700"
        >
            <Play className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Starting...' : 'Start'}
        </Button>
    );
}

function MarkCompleteDialog({ module, onModuleUpdated }: { module: Module, onModuleUpdated: () => void }) {
    const [commitLink, setCommitLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/modules', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: module.moduleid, status: 'Complete', commitLink }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to mark as complete.');

            toast({ title: 'Module Completed!', description: `"${module.name}" is now marked as complete.` });
            onModuleUpdated();
            document.getElementById(`close-dialog-${module.moduleid}`)?.click();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" disabled={module.status === 'Complete'}>
                    {module.status === 'Complete' ? <CheckCircle className="mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />}
                    {module.status === 'Complete' ? 'Completed' : 'Mark Completed'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Complete Module: {module.name}</DialogTitle>
                    <DialogDescription>Provide the commit link to mark this module as complete.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="commitLink">Commit Link</Label>
                    <Input id="commitLink" value={commitLink} onChange={(e) => setCommitLink(e.target.value)} placeholder="https://github.com/repo/commit/..." />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button id={`close-dialog-${module.moduleid}`} variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !commitLink}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/developer/my-projects');
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
        <FolderGit2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">No Projects Assigned</h2>
        <p className="text-muted-foreground">You are not currently assigned to any projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><FolderGit2 /> My Projects</h1>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {projects.map(project => (
          <AccordionItem value={`project-${project.projectid}`} key={project.projectid} className="border-b-0">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                    </div>
                    <AddModuleForm projectId={project.projectid} onModuleAdded={fetchProjects} />
                </div>
              </CardHeader>
              <CardContent>
                {project.modules.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="modules" className="border-b-0">
                            <AccordionTrigger>Show Modules ({project.modules.length})</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3 pt-2">
                                    {project.modules.map(module => (
                                        <div key={module.moduleid} className="p-3 border rounded-md flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{module.name}</p>
                                                <p className="text-sm text-muted-foreground">{module.description}</p>
                                                <div className="text-xs text-muted-foreground mt-1 space-x-4">
                                                    <span>{format(new Date(module.startdate), 'MMM d, yyyy')} - {format(new Date(module.enddate), 'MMM d, yyyy')}</span>
                                                    <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: module.currency }).format(module.cost)}</span>
                                                </div>
                                                {module.commitlink && (
                                                    <a href={module.commitlink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                                        <Link className="h-3 w-3" /> View Commit
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge 
                                                    variant={module.status === 'Complete' ? 'default' : 'secondary'}
                                                    className={
                                                        module.status === 'Complete' ? 'bg-green-600 hover:bg-green-700' :
                                                        module.status === 'Started' ? 'bg-blue-600 hover:bg-blue-700' :
                                                        module.status === 'Pending' ? 'bg-orange-600 hover:bg-orange-700' :
                                                        'bg-gray-600 hover:bg-gray-700'
                                                    }
                                                >
                                                    {module.status}
                                                </Badge>
                                                <div className="flex items-center gap-2">
                                                    {module.status === 'Pending' && (
                                                        <StartModuleButton module={module} onModuleUpdated={fetchProjects} />
                                                    )}
                                                    {module.status === 'Started' && (
                                                        <MarkCompleteDialog module={module} onModuleUpdated={fetchProjects} />
                                                    )}
                                                    {module.status === 'Complete' && (
                                                        <Button size="sm" disabled className="bg-green-600">
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Completed
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No modules have been added to this project yet.</p>
                )}
              </CardContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
