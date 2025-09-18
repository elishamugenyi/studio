import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddUserForm from './add-user-form';
import AddTeamLeadForm from './add-team-lead-form';
import AddDeveloperForm from './add-developer-form';

export default function AdminDashboard() {
  return (
    <Tabs defaultValue="add-user" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="add-user">Add User</TabsTrigger>
        <TabsTrigger value="add-team-lead">Add Team Lead</TabsTrigger>
        <TabsTrigger value="add-developer">Add Developer</TabsTrigger>
      </TabsList>
      <TabsContent value="add-user">
        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>
              Create a new registered user. They will need to complete their sign-up to set a password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <AddUserForm />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="add-team-lead">
        <Card>
          <CardHeader>
            <CardTitle>Add New Team Lead</CardTitle>
            <CardDescription>
              Add a new Team Lead to the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <AddTeamLeadForm />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="add-developer">
        <Card>
          <CardHeader>
            <CardTitle>Add New Developer</CardTitle>
            <CardDescription>
              Add a new developer and assign them to a team lead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <AddDeveloperForm />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
