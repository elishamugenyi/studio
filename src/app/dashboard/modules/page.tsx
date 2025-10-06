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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Blocks, 
  Play, 
  CheckCircle, 
  Clock, 
  Link, 
  Loader2,
  Search,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

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
  markedcompletedate: string | null;
  project_name: string;
  project_description: string;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [commitLink, setCommitLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/modules?dashboard=true');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch modules.');
      }
      const data = await response.json();
      setModules(data.modules || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleStartModule = async (moduleId: number) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/modules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to start module.');

      toast({ title: 'Module Started!', description: 'Module has been marked as started.' });
      fetchModules();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteModule = async () => {
    if (!selectedModule || !commitLink.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Commit link is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          moduleId: selectedModule.moduleid, 
          status: 'Complete', 
          commitLink: commitLink.trim() 
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to complete module.');

      toast({ title: 'Module Completed!', description: `"${selectedModule.name}" has been marked as complete.` });
      fetchModules();
      setSelectedModule(null);
      setCommitLink('');
      document.getElementById(`close-dialog-${selectedModule.moduleid}`)?.click();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Started':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Pending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Blocks className="h-8 w-8" />
            My Modules
          </h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <Blocks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Modules Found</h3>
            <p className="text-muted-foreground">
              You don't have any modules assigned to you yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Blocks className="h-8 w-8" />
          My Modules
        </h1>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Modules</CardTitle>
          <CardDescription>Find modules by name, project, or description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      <Card>
        <CardHeader>
          <CardTitle>Modules ({filteredModules.length})</CardTitle>
          <CardDescription>Manage and track your assigned modules</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredModules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No modules match your search criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.map((module) => (
                  <TableRow key={module.moduleid}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{module.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {module.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{module.project_name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {module.project_description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusBadgeVariant(module.status)}
                        className={getStatusColor(module.status)}
                      >
                        {module.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(module.startdate), 'MMM d')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(module.enddate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span>{new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: module.currency 
                        }).format(module.cost)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {module.status === 'Pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartModule(module.moduleid)}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start
                          </Button>
                        )}
                        
                        {module.status === 'Started' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedModule(module)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Complete Module: {module.name}</DialogTitle>
                                <DialogDescription>
                                  Provide the commit link to mark this module as complete.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2">
                                <Label htmlFor="commitLink">Commit Link</Label>
                                <Input
                                  id="commitLink"
                                  value={commitLink}
                                  onChange={(e) => setCommitLink(e.target.value)}
                                  placeholder="https://github.com/repo/commit/..."
                                />
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button id={`close-dialog-${module.moduleid}`} variant="ghost">
                                    Cancel
                                  </Button>
                                </DialogClose>
                                <Button
                                  onClick={handleCompleteModule}
                                  disabled={isSubmitting || !commitLink.trim()}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Complete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {module.status === 'Complete' && (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                            {module.commitlink && (
                              <a
                                href={module.commitlink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                              >
                                <Link className="h-3 w-3" />
                                View Commit
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
