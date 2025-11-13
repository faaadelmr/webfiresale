'use client'; 

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { LuLayoutDashboard, LuShoppingBag, LuPackage } from 'react-icons/lu';

import { usePathname } from 'next/navigation'; 

export default function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // For customers, show only customer-friendly options
  if (userRole === 'CUSTOMER') {
    return (
      <nav className="space-y-4">
        <Link 
          href="/dashboard" 
          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
            pathname === '/dashboard' ? 'bg-indigo-600' : 'hover:bg-indigo-600' 
          }`}
        >
          <LuLayoutDashboard size={20} />
          <span>Dasbor</span>
        </Link>
        <Link 
          href="/orders" 
          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
            pathname === '/orders' ? 'bg-indigo-600' : 'hover:bg-indigo-600' 
          }`}
        >
          <LuPackage size={20} />
          <span>Pesanan Saya</span>
        </Link>
      </nav>
    );
  }

  // For admins/sellers, show all options
  return (
    <nav className="space-y-4">
      <Link 
        href="/dashboard" 
        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
          pathname === '/dashboard' ? 'bg-indigo-600' : 'hover:bg-indigo-600' 
        }`}
      >
        <LuLayoutDashboard size={20} />
        <span>Dasbor</span>
      </Link>
      <Link 
        href="/dashboard/products" 
        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
          pathname === '/dashboard/products' ? 'bg-indigo-600' : 'hover:bg-indigo-600' 
        }`}
      >
        <LuShoppingBag size={20} />
        <span>Produk Saya</span>
      </Link>
      <Link 
        href="/dashboard/orders" 
        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
          pathname === '/dashboard/orders' ? 'bg-indigo-600' : 'hover:bg-indigo-600' 
        }`}
      >
        <LuPackage size={20} />
        <span>Pesanan Saya</span>
      </Link>
    </nav>
  );
}