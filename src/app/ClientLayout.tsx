"use client";
import { CartProvider } from '@/context/cart-context';
import PeriodicProcessor from '@/components/PeriodicProcessor';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SessionProviderWrapper>
          <CartProvider>
            <PeriodicProcessor />
            {children}
          </CartProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}