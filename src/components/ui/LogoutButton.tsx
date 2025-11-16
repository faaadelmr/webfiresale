// src/components/ui/LogoutButton.tsx
'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/signin');
  };

  return (
    <button 
      onClick={handleSignOut}
      className="btn btn-ghost"
    >
      Logout
    </button>
  );
}