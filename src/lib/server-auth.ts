// src/lib/server-auth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from './prisma';
import { checkAccess, Role } from './rbac';

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    avatar: string | null;
}

/**
 * Get the current authenticated user on the server
 * Returns null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            isActive: true,
            deletedAt: true,
        },
    });

    if (!user || !user.isActive || user.deletedAt) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        avatar: user.avatar,
    };
}

/**
 * Require authentication - redirects to signin if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getAuthUser();

    if (!user) {
        redirect('/signin');
    }

    return user;
}

/**
 * Require a specific role or higher - redirects to unauthorized if access denied
 * @param allowedRoles - Array of roles that can access, e.g. ['admin', 'superadmin']
 */
export async function requireRoles(allowedRoles: Role[]): Promise<AuthUser> {
    const user = await requireAuth();

    if (!allowedRoles.includes(user.role)) {
        redirect('/unauthorized');
    }

    return user;
}

/**
 * Require access to a specific resource - redirects to unauthorized if access denied
 * @param resource - The resource being accessed (e.g., 'admin', 'admin-users')
 */
export async function requireAccess(resource: string): Promise<AuthUser> {
    const user = await requireAuth();

    const hasAccess = checkAccess(user.role, resource);

    if (!hasAccess) {
        redirect('/unauthorized');
    }

    return user;
}
