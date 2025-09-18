
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
import { useEffect, useState } from 'react';

interface TeamLead {
  teamleadid: number;
  firstname: string;
  lastname: string;
}

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().min(2, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  teamLeadId: z.string({ required_error: "Please select a Team Lead." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddDeveloperForm() {
  const { toast } = useToast();
  const [teamLeads, setTeamLeads] = useState<TeamLead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  useEffect(() => {
    const fetchTeamLeads = async () => {
      try {
        const response = await fetch('/api/add_team_lead');
        if (!response.ok) {
          throw new Error('Failed to fetch team leads.');
        }
        const data = await response.json();
        setTeamLeads(data.teamLeads || []);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching team leads",
          description: error.message || "Could not load team leads for selection.",
        });
      } finally {
        setIsLoadingLeads(false);
      }
    };
    fetchTeamLeads();
  }, [toast]);

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
      const response = await fetch('/api/add_dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            teamLeadId: parseInt(data.teamLeadId, 10)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add developer.');
      }

      toast({
        title: 'Developer Added Successfully!',
        description: `${data.firstName} ${data.lastName} has been added.`,
      });
      form.reset();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: 'Error Adding Developer',
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingLeads || teamLeads.length === 0}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingLeads ? "Loading leads..." : "Select a Team Lead"} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {teamLeads.map((lead) => (
                            <SelectItem key={lead.teamleadid} value={String(lead.teamleadid)}>
                                {lead.firstname} {lead.lastname}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting || isLoadingLeads}>
            <UserPlus className="mr-2" />
            Add Developer
          </Button>
        </div>
      </form>
    </Form>
  );
}
