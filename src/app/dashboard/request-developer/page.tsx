
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
import { Send, Loader2 } from 'lucide-react';
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
  developerName: z.string({ required_error: "Please select a developer." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function RequestDeveloperPage() {
  const { toast } = useToast();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoadingDevs, setIsLoadingDevs] = useState(true);

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
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
        const response = await fetch('/api/request_submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to submit request.');
        }
        
        toast({
            title: 'Request Submitted!',
            description: `Your request for project "${data.name}" has been sent for approval.`,
        });
        form.reset();

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: 'Submission Failed',
            description: error.message,
        });
    }
  };

  return (
    <Card className="w-full max-w-4xl bg-card">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Request a Developer</CardTitle>
        <CardDescription>Fill out the form below to request a developer for a new project.</CardDescription>
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
                  name="developerName"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-primary font-semibold">Assign Developer</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingDevs || developers.length === 0}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder={isLoadingDevs ? "Loading developers..." : "Select a developer"} />
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
                      </FormItem>
                  )}
              />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingDevs}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
