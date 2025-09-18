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
import type { UserRole } from '@/hooks/use-user';
import { UserPlus } from 'lucide-react';

const roles: UserRole[] = ['Developer', 'Admin', 'CEO', 'Team Lead', 'Finance'];

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(roles, { required_error: "Please select a role." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddUserForm() {
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
    try {
      const response = await fetch('/api/reg_users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add user');
      }

      toast({
        title: 'User Added Successfully!',
        description: `${data.firstName} ${data.lastName} has been registered and can now complete their sign-up.`,
      });
      form.reset();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: 'Error Adding User',
            description: error.message || 'An unexpected error occurred.',
        });
    }
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
                            <Input placeholder="e.g., Alex" {...field} />
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
                            <Input placeholder="e.g., Thompson" {...field} />
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
                        <Input type="email" placeholder="e.g., alex.thompson@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-primary font-semibold">Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role for the user" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                            {role}
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
            Add User
          </Button>
        </div>
      </form>
    </Form>
  );
}