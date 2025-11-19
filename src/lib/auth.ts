// src/lib/auth.ts
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { checkAccess } from '@/lib/rbac'
import { Role } from '@/lib/rbac'

export async function validateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  // Check if this is a credentials user (has a password) before validating
  if (!user || !user.password) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password!)

  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    provider: user.provider,
    role: user.role,
  }
}

export async function findOrCreateOAuthUser(profile: any, provider: string) {
  // Try to find existing user by email or provider ID
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: profile.email },
        { providerId: profile.id?.toString() }
      ]
    }
  })

  if (user) {
    // Update existing user with provider info if needed
    if (!user.providerId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          providerId: profile.id?.toString(),
          provider,
          name: profile.name || profile.displayName || user.name,
        }
      })
    }
    return user
  }

  // Create new user with default role 'customer'
  user = await prisma.user.create({
    data: {
      name: profile.name || profile.displayName,
      email: profile.email,
      providerId: profile.id?.toString(),
      provider,
      role: 'customer', // Default role for new users
    }
  })

  return user
}

/**
 * Get the current session server-side
 * @returns The current session or null if not authenticated
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Require a specific role for server-side operations
 * @param requiredRole - The role required to perform the action
 * @throws Error if the user doesn't have the required role
 */
export async function requireRole(requiredRole: Role) {
  const session = await getCurrentSession();

  if (!session || !session.user?.role) {
    throw new Error('Authentication required');
  }

  if (session.user.role !== requiredRole) {
    throw new Error(`Access denied: Role '${requiredRole}' required`);
  }

  return session;
}

/**
 * Require specific permission based on ACL
 * @param resource - The resource that needs to be accessed
 * @throws Error if the user doesn't have permission to access the resource
 */
export async function requirePermission(resource: string) {
  const session = await getCurrentSession();

  if (!session || !session.user?.role) {
    throw new Error('Authentication required');
  }

  const hasAccess = checkAccess(session.user.role as Role, resource);

  if (!hasAccess) {
    throw new Error(`Access denied: Permission required for '${resource}'`);
  }

  return session;
}

/**
 * Check if the current user has a specific role
 * @param requiredRole - The role to check
 * @returns boolean indicating if the user has the role
 */
export async function hasRole(requiredRole: Role): Promise<boolean> {
  const session = await getCurrentSession();

  if (!session || !session.user?.role) {
    return false;
  }

  return session.user.role === requiredRole;
}

/**
 * Check if the current user has permission to access a specific resource
 * @param resource - The resource to check access for
 * @returns boolean indicating if the user has access
 */
export async function hasPermission(resource: string): Promise<boolean> {
  const session = await getCurrentSession();

  if (!session || !session.user?.role) {
    return false;
  }

  return checkAccess(session.user.role as Role, resource);
}