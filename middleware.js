import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Public routes that everyone can access
    const publicRoutes = ['/', '/api/auth/signin'];
    
    // If user is not authenticated and trying to access protected routes
    if (!token && !publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // If user is authenticated
    if (token) {
      // Customer restricted routes
      const customerRestrictedRoutes = [
        '/dashboard',
        '/dashboard/products',
        '/dashboard/orders',
        // Add seller/admin specific routes here
      ];
      
      // If customer tries to access restricted routes for sellers/admins
      if (token.role === 'CUSTOMER' && customerRestrictedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      // Add your route protection logic here based on user role
      // For example: if (token.role !== 'ADMIN' && pathname.startsWith('/admin')) {
      //   return NextResponse.redirect(new URL('/', req.url));
      // }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // The token will be available if the user is authenticated
        // We'll handle specific route authorization in the middleware function above
        return true; // Allow all authenticated users to pass, then handle specific protections in middleware
      }
    }
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};