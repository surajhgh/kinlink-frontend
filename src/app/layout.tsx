import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { FamilyProvider } from '@/lib/family-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'KinLink',
  description: 'Connect with your family',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="flex flex-col min-h-screen">
        <SessionProvider>
          <FamilyProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </FamilyProvider>
          <Toaster position="top-right" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}

