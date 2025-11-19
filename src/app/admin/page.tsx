// src/app/admin/page.tsx
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardNavbar from '@/components/ui/DashboardNavbar';

export default async function AdminPage() {
  try {
    // Check if the user has permission to access the admin section
    await requirePermission('admin');
  } catch (error) {
    // If the user doesn't have permission, redirect to unauthorized page
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
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="py-6">This is the admin section. Only users with admin or superadmin role can access this.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">User Management</h2>
                <p>Manage user accounts, roles, and permissions.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Manage Users</button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">System Configuration</h2>
                <p>Configure system settings and parameters.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Configure</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}