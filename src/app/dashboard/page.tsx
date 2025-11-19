// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../api/auth/[...nextauth]/route'
import { requirePermission } from '@/lib/auth'
import DashboardNavbar from '@/components/ui/DashboardNavbar'
import prisma from '@/lib/prisma'

export default async function DashboardPage() {
  try {
    // Check if the user has permission to access the dashboard
    await requirePermission('dashboard');
  } catch (error) {
    // If the user doesn't have permission, redirect to unauthorized page
    redirect('/unauthorized');
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  // Fetch user with addresses
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
    include: {
      addresses: true
    }
  })

  return (
    <div className="min-h-screen bg-base-200">
      <DashboardNavbar />

      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="hero bg-base-100 rounded-box shadow-md mb-6">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="py-6">Welcome, {session.user?.name}!</p>
                <p className="text-gray-500 mb-4">You are successfully logged in.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">User Information</h2>
                <div className="bg-base-200 p-4 rounded-lg">
                  <p><span className="font-semibold">Name:</span> {session.user?.name}</p>
                  <p><span className="font-semibold">Email:</span> {session.user?.email}</p>
                  <p><span className="font-semibold">Role:</span> {session.user?.role}</p>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Quick Actions</h2>
                <div className="card-actions justify-end">
                  <a href="/profile" className="btn btn-primary">Edit Profile</a>
                  <a href="/profile" className="btn btn-outline">Manage Address</a>
                  {session.user?.role === 'superadmin' && (
                    <a href="/dashboard/users" className="btn btn-secondary">Manage Users</a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          {user?.addresses && user.addresses.length > 0 && (
            <div className="mt-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Your Addresses</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.addresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <h3 className="font-semibold">{address.firstName} {address.lastName}</h3>
                          {address.isDefault && (
                            <span className="badge badge-primary">Default</span>
                          )}
                        </div>
                        <p>{address.street}</p>
                        <p>{address.city}, {address.state} {address.postalCode}</p>
                        <p>{address.country}</p>
                        {address.phone && <p>Phone: {address.phone}</p>}
                        {address.label && <p className="badge badge-secondary mt-1">{address.label}</p>}
                        {address.notes && <p className="text-sm text-gray-500 mt-1">{address.notes}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="card-actions justify-end mt-4">
                    <a href="/profile" className="btn btn-primary">Manage Addresses</a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}