"use client";

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ConditionalAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Skip AuthProvider and Header for statement-sign and photo-release-sign pages (they don't need authentication)
  if (pathname?.startsWith('/statement-sign') || pathname?.startsWith('/photo-release-sign')) {
    return (
      <>
        <main className="flex-grow">{children}</main>
        <Footer />
      </>
    );
  }
  
  // For all other pages, wrap with AuthProvider and include Header
  return (
    <AuthProvider>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </AuthProvider>
  );
}
