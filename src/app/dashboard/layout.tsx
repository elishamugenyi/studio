import AppHeader from '@/components/dashboard/header';
import { UserProvider } from '@/hooks/use-user';
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AppHeader />
      {children}
      <Toaster />
    </UserProvider>
  );
}
