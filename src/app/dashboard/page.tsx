// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../api/auth/[...nextauth]/route'
import DashboardNavbar from '@/components/ui/DashboardNavbar'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-base-200">
      <DashboardNavbar user={session.user!} />

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
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Quick Actions</h2>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Edit Profile</button>
                  <button className="btn btn-outline">Settings</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}