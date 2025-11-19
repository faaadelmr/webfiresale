// src/app/unauthorized/page.tsx
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-2xl">Access Denied</h2>
          <p className="text-lg">You don't have permission to access this page.</p>
          <div className="card-actions mt-4">
            <Link href="/" className="btn btn-primary">Go Home</Link>
            <Link href="/signin" className="btn btn-outline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}