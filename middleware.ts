// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAccess } from '@/lib/rbac';

// Define protected routes that need role-based access control
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/profile',
  // Add other protected routes as needed
];

// Define route-to-resource mapping for ACL
const routeToResourceMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/admin': 'admin',
  '/profile': 'profile',
  // Add more mappings as needed
};

export default withAuth(
  // Custom middleware function that runs after authentication
  function middleware(request: NextRequest) {
    // Get the user's role from the session
    const token = request.nextauth.token;
    const userRole = token?.role as string;

    // If no role is defined, the user shouldn't be accessing protected routes
    if (!userRole) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Get the current path
    const pathname = request.nextUrl.pathname;

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );

    if (isProtectedRoute) {
      // Determine the resource based on the path
      let resource: string | undefined;
      
      // Check exact matches first
      if (pathname in routeToResourceMap) {
        resource = routeToResourceMap[pathname];
      } else {
        // Look for partial matches (e.g., /dashboard/settings matches /dashboard)
        for (const [route, res] of Object.entries(routeToResourceMap)) {
          if (pathname.startsWith(route + '/')) {
            resource = res;
            break;
          }
        }
        
        // If no specific resource found, use the base route
        if (!resource) {
          const baseRoute = protectedRoutes.find(route => pathname === route || pathname.startsWith(route + '/'));
          if (baseRoute) {
            // Get the resource name from the route (e.g., /dashboard -> dashboard)
            resource = baseRoute.replace('/', '');
          }
        }
      }

      // If we have a resource to check, validate access
      if (resource) {
        const hasAccess = checkAccess(userRole as any, resource);
        
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