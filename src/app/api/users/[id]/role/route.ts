// src/app/api/users/[id]/role/route.ts
import { NextRequest } from 'next/server';
import { requireRole, getCurrentSession } from '@/lib/auth';
import { updateUserRole } from '@/lib/admin-helpers';
import { isValidRole, isValidUserId } from '@/lib/security';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get current session
    const session = await getCurrentSession();
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Require superadmin role
    await requireRole('superadmin');

    const currentUserId = session.user.id;
    const { id: userId } = await params;

    // Validate user IDs
    if (!isValidUserId(currentUserId) || !isValidUserId(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const { role } = await request.json();

    // Validate the new role
    if (!isValidRole(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role specified' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Update user role
    const updatedUser = await updateUserRole(currentUserId, userId, role);

    return new Response(JSON.stringify({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to update user role'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}