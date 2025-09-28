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
  developerIds: z.array(z.number()).nonempty({ message: "Please select at least one developer." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function RequestDeveloperPage() {
  const { toast } = useToast();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoadingDevs, setIsLoadingDevs] = useState(true);
  const [selectedDevIds, setSelectedDevIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/add_dev');
        if (!response.ok) throw new Error('Failed to fetch developers');
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
      developerIds: [],
    },
  });

  const handleAddDeveloper = (devIdStr: string) => {
    const devId = parseInt(devIdStr, 10);
    if (!selectedDevIds.includes(devId)) {
      const newSelected = [...selectedDevIds, devId];
      setSelectedDevIds(newSelected);
      form.setValue("developerIds", newSelected);
    }
  };

  const handleRemoveDeveloper = (devId: number) => {
    const newSelected = selectedDevIds.filter(id => id !== devId);
    setSelectedDevIds(newSelected);
    form.setValue("developerIds", newSelected);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const response = await fetch('/api/request_submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit project request.');
      }

      toast({
        title: 'Project Request Submitted!',
        description: `Your project request for ${data.developerIds.length} developer(s) has been sent.`,
      });

      form.reset();
      setSelectedDevIds([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl bg-card">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Request a Developer</CardTitle>
        <CardDescription>
          Fill out the form to request a developer for a new project. You can assign multiple developers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Phoenix" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detailed description..." {...field} />
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
                  <FormLabel>Estimated Duration</FormLabel>
                  <FormControl>
                    <Input placeholder="3 months" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="developerIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Developer(s)</FormLabel>
                  <Select onValueChange={handleAddDeveloper} disabled={isLoadingDevs || developers.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingDevs ? "Loading..." : "Select developers"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {developers.map(dev => (
                        <SelectItem key={dev.developerid} value={dev.developerid.toString()}>
                          {dev.firstname} {dev.lastname} - {dev.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedDevIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedDevIds.map(id => {
                        const dev = developers.find(d => d.developerid === id);
                        return dev ? (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {dev.firstname} {dev.lastname}
                            <button type="button" onClick={() => handleRemoveDeveloper(id)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
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
