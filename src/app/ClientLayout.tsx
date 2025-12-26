"use client";
import { CartProvider } from '@/context/cart-context';
import { ThemeProvider } from '@/context/ThemeContext';
import PeriodicProcessor from '@/components/PeriodicProcessor';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { DeveloperEasterEgg } from '@/components/developer-easter-egg';
import { ReactNode } from 'react';
import { Header } from '@/components/header';
import { usePathname } from 'next/navigation';

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdminPage && <Header />}
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-base-100 text-base-content">
        <SessionProviderWrapper>
          <ThemeProvider>
            <CartProvider>
              <PeriodicProcessor />
              <DeveloperEasterEgg />
              <LayoutContent>{children}</LayoutContent>
            </CartProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
