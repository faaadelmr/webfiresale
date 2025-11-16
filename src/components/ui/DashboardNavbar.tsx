// src/components/ui/DashboardNavbar.tsx
'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface DashboardNavbarProps {
  user: {
    name: string | null | undefined;
    email: string | null | undefined;
  };
}

export default function DashboardNavbar({ user }: DashboardNavbarProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/signin' });
  };

  return (
    <div className="navbar bg-base-100 shadow-md">
      <div className="flex-1">
        <Link href="/dashboard" className="btn btn-ghost text-xl">WebFireSale</Link>
      </div>
      <div className="flex-none">
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-lg font-bold">{user.name?.charAt(0)}</span>
              </div>
            </div>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li><a>Settings</a></li>
            <li>
              <button 
                onClick={handleSignOut}
                className="btn btn-ghost w-full text-left"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}