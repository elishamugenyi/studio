
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, X } from 'lucide-react';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';


interface Developer {
    developerid: number;
    firstname: string;
    lastname: string;
    email: string;
}

const formSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  duration: z.string().min(1, { message: "Duration is required." }),
  developerNames: z.array(z.string()).nonempty({ message: "Please select at least one developer." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function RequestDeveloperPage() {
  const { toast } = useToast();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoadingDevs, setIsLoadingDevs] = useState(true);
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);

  useEffect(() => {
    const fetchDevelopers = async () => {
        try {
            const response = await fetch('/api/add_dev');
            if (!response.ok) {
                throw new Error('Failed to fetch developers');
            }
            const data = await response.json();
            setDevelopers(data.developers || []);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not load developers.',
            });
        } finally {
            setIsLoadingDevs(false);
        }
    };
    fetchDevelopers();
  }, [toast]);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        description: "",
        duration: "",
        developerNames: [],
    }
  });
  
  const handleAddDeveloper = (devIdentifier: string) => {
    if (devIdentifier && !selectedDevelopers.includes(devIdentifier)) {
        const newSelected = [...selectedDevelopers, devIdentifier];
        setSelectedDevelopers(newSelected);
        form.setValue("developerNames", newSelected);
    }
  };
  
  const handleRemoveDeveloper = (devIdentifier: string) => {
    const newSelected = selectedDevelopers.filter(d => d !== devIdentifier);
    setSelectedDevelopers(newSelected);
    form.setValue("developerNames", newSelected);
  };


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    let successCount = 0;
    const totalRequests = data.developerNames.length;
    const errors: string[] = [];

    for (const developerName of data.developerNames) {
        try {
            const response = await fetch('/api/request_submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, developerName }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to submit request for ${developerName}.`);
            }
            successCount++;

        } catch (error: any) {
            errors.push(error.message);
        }
    }
    
    if (successCount > 0) {
        toast({
            title: 'Requests Submitted!',
            description: `${successCount} of ${totalRequests} project requests were successfully sent for approval.`,
        });
    }

    if (errors.length > 0) {
        toast({
            variant: "destructive",
            title: 'Some Submissions Failed',
            description: errors.join('\n'),
        });
    }

    if (successCount === totalRequests) {
        form.reset();
        setSelectedDevelopers([]);
    }
  };

  return (
    <Card className="w-full max-w-4xl bg-card">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Request a Developer</CardTitle>
        <CardDescription>Fill out the form below to request a developer for a new project. You can add multiple developers to create separate projects for each.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-primary font-semibold">Project Name</FormLabel>
                          <FormControl>
                              <Input placeholder="e.g., Project Phoenix" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-primary font-semibold">Description</FormLabel>
                          <FormControl>
                              <Textarea
                              placeholder="Provide a detailed description of the project, its goals, and requirements."
                              className="min-h-[120px]"
                              {...field}
                              />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-primary font-semibold">Estimated Duration</FormLabel>
                          <FormControl>
                              <Input placeholder="e.g., 3 months" {...field} />
                          </FormControl>
                          <FormDescription>
                              Provide an estimate like "2 weeks", "3 months", or "6 sprints".
                          </FormDescription>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="developerNames"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-primary font-semibold">Assign Developer(s)</FormLabel>
                        <Select onValueChange={handleAddDeveloper} disabled={isLoadingDevs || developers.length === 0}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingDevs ? "Loading developers..." : "Select developers to add..."} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {developers.map((dev) => (
                                    <SelectItem key={dev.developerid} value={`${dev.firstname} ${dev.lastname} - ${dev.email}`}>
                                        {dev.firstname} {dev.lastname} - <span className="text-muted-foreground">{dev.email}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        {selectedDevelopers.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {selectedDevelopers.map(dev => (
                                    <Badge key={dev} variant="secondary" className="flex items-center gap-1">
                                        {dev}
                                        <button onClick={() => handleRemoveDeveloper(dev)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </FormItem>
                  )}
              />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingDevs}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                Submit Request(s)
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
