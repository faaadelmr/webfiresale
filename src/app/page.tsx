// src/app/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import Link from 'next/link';
import DashboardNavbar from '@/components/ui/DashboardNavbar';

export default async function HomePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const session = await getServerSession(authOptions);
  const loginSuccess = searchParams['login'] === 'success';

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      {session?.user ? (
        <DashboardNavbar />
      ) : (
        <div className="navbar bg-base-100 shadow-md">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl">WebFireSale</a>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal px-1">
              <li><Link href="/signin">Sign In</Link></li>
              <li><Link href="/signup" className="btn btn-primary ml-2">Sign Up</Link></li>
            </ul>
          </div>
        </div>
      )}

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="hero-content text-center max-w-md">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold">WebFireSale</h1>
            <p className="py-6 text-lg">
              {session?.user ? `Welcome, ${session.user.name || session.user.email.split('@')[0]}!` : 'Next.js Authentication Demo built with NextAuth, Prisma, and PostgreSQL'}
            </p>

            {session?.user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session.user.role === 'customer' ? (
                  <p className="text-green-600 font-semibold">
                    {loginSuccess
                      ? 'Login successful! You are now logged in as a customer.'
                      : `Welcome back, ${session.user.name || session.user.email.split('@')[0]}!`}
                  </p>
                ) : (
                  <Link href="/dashboard" className="btn btn-primary btn-wide">
                    Go to Dashboard
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="btn btn-primary btn-wide">
                  Get Started
                </Link>
                <Link href="/signin" className="btn btn-ghost btn-wide">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <aside>
          <p>&copy; {new Date().getFullYear()} WebFireSale. All rights reserved.</p>
        </aside>
      </footer>
    </div>
  )
}