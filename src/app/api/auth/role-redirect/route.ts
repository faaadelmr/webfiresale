import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { authOptions } from '../[...nextauth]/route';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session) {
    const userRole = session.user?.role;

    // Redirect based on user role
    if (userRole === 'customer') {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
        },
      });
    } else {
      // Admin and superadmin users go to admin page
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/admin',
        },
      });
    }
  }

  // If no session, redirect to sign in
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/signin',
    },
  });
}