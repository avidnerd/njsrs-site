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
  
  
  if (pathname?.startsWith('/statement-sign') || pathname?.startsWith('/photo-release-sign')) {
    return (
      <>
        <main className="flex-grow">{children}</main>
        <Footer />
      </>
    );
  }
  
  
  return (
    <AuthProvider>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </AuthProvider>
  );
}
