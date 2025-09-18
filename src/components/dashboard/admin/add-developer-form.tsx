'use client';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { UserPlus } from 'lucide-react';

const teamLeads = [
    { id: '1', name: 'Samantha Ray' },
    { id: '2', name: 'John Doe' },
];

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().min(2, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  teamLeadId: z.string({ required_error: "Please select a Team Lead." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddDeveloperForm() {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // API call to be implemented later
    console.log(data);
    toast({
      title: 'Developer Added (Mock)!',
      description: `${data.firstName} ${data.lastName} has been added.`,
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-primary font-semibold">First Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Mike" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-primary font-semibold">Last Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Chen" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-primary font-semibold">Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="e.g., mike.chen@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="teamLeadId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-primary font-semibold">Assign Team Lead</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a Team Lead" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {teamLeads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                            {lead.name}
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
            <UserPlus className="mr-2" />
            Add Developer
          </Button>
        </div>
      </form>
    </Form>
  );
}