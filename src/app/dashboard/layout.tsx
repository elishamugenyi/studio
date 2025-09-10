import AppSidebar from '@/components/dashboard/sidebar';
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
      <div className="flex min-h-screen w-full flex-col bg-muted/20">
        <AppSidebar />
        <div className="flex flex-col sm:pl-14">
          <AppHeader />
          <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </UserProvider>
  );
}
