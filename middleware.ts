// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkAccess } from '@/lib/rbac';

// Define protected routes that need role-based access control
const protectedRoutes = [
  '/profile',
  '/admin',
];

// Define route-to-resource mapping for ACL
const routeToResourceMap: Record<string, string> = {
  '/profile': 'profile',
  '/admin': 'admin',
  '/admin/users': 'admin-users',
  '/admin/products': 'admin-products',
  '/admin/orders': 'admin-orders',
  '/admin/auction': 'admin-auction',
  '/admin/flashsale': 'admin-flashsale',
  '/admin/shipping': 'admin-shipping',
  '/admin/settings': 'admin-settings',
};

export default withAuth(
  // Custom middleware function that runs after authentication
  async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Log every request to confirm middleware is running
    console.log(`[Middleware] Request: ${pathname}`);

    // Get the user's role from the session token
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    console.log(`[Middleware] Token:`, JSON.stringify({ role: token?.role, email: token?.email }));

    const userRole = token?.role as string;

    // If no role is defined, the user shouldn't be accessing protected routes
    if (!userRole) {
      console.log(`[Middleware] No role found, redirecting to signin`);
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Check if user is marked as inactive in the token (set during login)
    if (token?.isActive === false) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    if (isProtectedRoute) {
      // Determine the resource based on the path
      let resource: string | undefined;

      // Check for the most specific match first (longest path first)
      const sortedRoutes = Object.keys(routeToResourceMap).sort((a, b) => b.length - a.length);

      for (const route of sortedRoutes) {
        if (pathname === route || pathname.startsWith(route + '/')) {
          resource = routeToResourceMap[route];
          break;
        }
      }

      // If no specific resource found, use the base route
      if (!resource) {
        const baseRoute = protectedRoutes.find(route => pathname === route || pathname.startsWith(route + '/'));
        if (baseRoute) {
          resource = baseRoute.replace('/', '');
        }
      }

      // If we have a resource to check, validate access
      if (resource) {
        const hasAccess = checkAccess(userRole as any, resource);

        console.log(`[Middleware] User role: ${userRole}, Resource: ${resource}, Access: ${hasAccess}`);

        if (!hasAccess) {
          // Redirect to unauthorized page if access is denied
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }

    // Allow the request to proceed if all checks pass
    return NextResponse.next();
  },
  {
    // Specify which pages to protect
    pages: {
      signIn: '/signin',
    },
  }
);

// Define which routes the middleware should run on
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