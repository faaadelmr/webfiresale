"use client";
import { CartProvider } from '@/context/cart-context';
import { ThemeProvider } from '@/context/ThemeContext';
import PeriodicProcessor from '@/components/PeriodicProcessor';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SessionProviderWrapper>
          <ThemeProvider>
            <CartProvider>
              <PeriodicProcessor />
              {children}
            </CartProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
