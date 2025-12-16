// src/components/ui/DashboardNavbar.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/signin' });
  };

  // Determine menu items based on user role
  const getMenuItems = () => {
    if (!user?.role) return [];

    switch (user.role) {
      case 'customer':
        return [
          { label: 'Home', href: '/' },
          { label: 'Profile', href: '/profile' },
          { label: 'Settings', href: '/settings' },
          { label: 'Logout', onClick: handleSignOut },
        ];
      case 'admin':
        return [
          { label: 'Admin Dashboard', href: '/admin' },
          { label: 'Profile', href: '/profile' },
          { label: 'Settings', href: '/settings' },
          { label: 'Logout', onClick: handleSignOut },
        ];
      case 'superadmin':
        return [
          { label: 'Admin Dashboard', href: '/admin' },
          { label: 'User Management', href: '/admin/users' },
          { label: 'Profile', href: '/profile' },
          { label: 'Settings', href: '/settings' },
          { label: 'Logout', onClick: handleSignOut },
        ];
      default:
        return [{ label: 'Logout', onClick: handleSignOut }];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="navbar bg-base-100 shadow-md">
      <div className="flex-1">
        <Link href={user?.role === 'customer' ? '/' : '/admin'} className="btn btn-ghost text-xl">WebFireSale</Link>
      </div>
      <div className="flex-none">
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-lg font-bold">{user?.name?.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            {menuItems.map((item, index) => (
              item.href ? (
                <li key={index}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ) : (
                <li key={index}>
                  <button
                    onClick={item.onClick}
                    className="btn btn-ghost w-full text-left"
                  >
                    {item.label}
                  </button>
                </li>
              )
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}