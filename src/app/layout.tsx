import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { initDb } from '@/lib/dbInit';

export const metadata: Metadata = {
  title: 'TPM',
  description: 'Tekjuice Project Manager and Developer Assignment',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //Run DB initiliaser once on server (only if DATABASE_URL is available)
  try {
    await initDb({ drop: false }) //set drop true for clean slate on development
  } catch (error) {
    // Silently handle database initialization errors during build time
    console.log("Database initialization skipped during build time");
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
