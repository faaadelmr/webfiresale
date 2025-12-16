import type {Metadata} from 'next';
import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'FireSale',
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
