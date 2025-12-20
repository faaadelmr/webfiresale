// src/app/admin/users/page.tsx
import { requireAccess } from '@/lib/server-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import UserListClient from './UserListClient';

export default async function UserListPage() {
  // Require admin-users access (superadmin only)
  await requireAccess('admin-users');

  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-base-200">
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="hero bg-base-100 rounded-box shadow-md mb-6">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
                <p className="py-6">Meng-akomodir seluruh pengguna, penggantian role serta reset password</p>
              </div>
            </div>
          </div>

          <UserListClient session={session} />
        </div>
      </main>
    </div>
  );
}