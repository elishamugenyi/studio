
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
import { Send } from 'lucide-react';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";


// Mock data for developers
const developers = [
    { id: '1', name: 'Mike Chen' },
    { id: '2', name: 'Laura Smith' },
    { id: '3', name: 'David Lee' },
    { id: '4', name: 'Sarah Jones' },
    { id: '5', name: 'Chris Green' },
];

const formSchema = z.object({
  projectName: z.string().min(3, { message: "Project name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  duration: z.string().min(1, { message: "Duration is required." }),
  developerId: z.string({ required_error: "Please select a developer." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function RequestDeveloperPage() {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        projectName: "",
        description: "",
        duration: "",
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // In a real app, you'd send this data to your API
    console.log(data);
    toast({
      title: 'Request Submitted!',
      description: `Your request for project "${data.projectName}" has been sent for approval.`,
    });
    form.reset();
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
                  name="projectName"
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
                  name="developerId"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-primary font-semibold">Assign Developer</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a developer from the list" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                              {developers.map((dev) => (
                                  <SelectItem key={dev.id} value={dev.id}>
                                  {dev.name}
                                  </SelectItem>
                              ))}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )}
              />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Send className="mr-2" />
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
