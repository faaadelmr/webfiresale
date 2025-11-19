import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../[...nextauth]/route';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    // Redirect based on user role
    if (session.user.role === 'customer') {
      return Response.redirect(new URL('/?login=success', request.url));
    } else {
      // Superadmin and admin go to dashboard
      return Response.redirect(new URL('/dashboard', request.url));
    }
  } else {
    // If no session, redirect to sign in
    return Response.redirect(new URL('/signin', request.url));
  }
}