// src/app/dashboard/users/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardNavbar from '@/components/ui/DashboardNavbar';
import UserListClient from './UserListClient';

export default async function UserListPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is a superadmin
  if (!session?.user || session.user.role !== 'superadmin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-base-200">
      <DashboardNavbar />
      
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="hero bg-base-100 rounded-box shadow-md mb-6">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="py-6">Manage all users in the system</p>
              </div>
            </div>
          </div>

          <UserListClient session={session} />
        </div>
      </main>
    </div>
  );
}