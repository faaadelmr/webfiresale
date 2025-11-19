// src/app/api/users/[id]/restore/route.ts
import { NextRequest } from 'next/server';
import { requireRole, getCurrentSession } from '@/lib/auth';
import { restoreUser, isUserSoftDeleted } from '@/lib/admin-helpers';
import { isValidUserId } from '@/lib/security';
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

    // Check if user is soft deleted (otherwise, cannot restore)
    const isDeleted = await isUserSoftDeleted(userId);
    if (!isDeleted) {
      return new Response(JSON.stringify({ error: 'User is not soft-deleted' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Restore the user
    const updatedUser = await restoreUser(currentUserId, userId);

    return new Response(JSON.stringify({
      message: 'User restored successfully',
      user: { id: updatedUser.id, email: updatedUser.email, isActive: updatedUser.isActive }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error restoring user:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to restore user'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}