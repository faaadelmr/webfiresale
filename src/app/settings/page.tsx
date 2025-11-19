// src/app/settings/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardNavbar from '@/components/ui/DashboardNavbar';
import SettingsClient from './SettingsClient';
import prisma from '@/lib/prisma';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  // Fetch user with provider info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      provider: true,
    }
  });

  if (!user) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-base-200">
      <DashboardNavbar />

      <main className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="hero bg-base-100 rounded-box shadow-md mb-6">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="py-6">Manage your account settings</p>
              </div>
            </div>
          </div>

          <SettingsClient user={user} />
        </div>
      </main>
    </div>
  );
}