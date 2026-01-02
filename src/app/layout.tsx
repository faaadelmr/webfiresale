import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from './ClientLayout';
import { NEXT_PUBLIC_APP_NAME } from '@/lib/app-config';

export const metadata: Metadata = {
  title: NEXT_PUBLIC_APP_NAME,
  description: 'Rebut barang yang kamu inginkan dengan cara lebih mudah dan effisien.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}
