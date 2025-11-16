// src/app/page.tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200">
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

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="hero-content text-center max-w-md">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold">WebFireSale</h1>
            <p className="py-6 text-lg">Next.js Authentication Demo built with NextAuth, Prisma, and PostgreSQL</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn btn-primary btn-wide">
                Get Started
              </Link>
              <Link href="/signin" className="btn btn-ghost btn-wide">
                Sign In
              </Link>
            </div>
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