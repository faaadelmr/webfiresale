// src/app/api/users/[id]/reset-password/route.ts
import { NextRequest } from 'next/server';
import { requireRole, getCurrentSession } from '@/lib/auth';
import { resetUserPassword } from '@/lib/admin-helpers';
import { isValidUserId } from '@/lib/security';

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

    // Reset the user's password
    const newPassword = await resetUserPassword(currentUserId, userId);

    return new Response(JSON.stringify({
      message: 'Password reset successfully',
      newPassword,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to reset user password'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}