import { UserProvider } from '@/hooks/use-user';
import { Toaster } from "@/components/ui/toaster";
import { FormProvider } from 'react-hook-form';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
        {children}
        <Toaster />
    </UserProvider>
  );
}
