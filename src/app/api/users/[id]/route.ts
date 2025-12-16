// src/app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { requireRole, getCurrentSession } from '@/lib/auth';
import {
  updateUserProfile,
  updateUserRole,
  softDeleteUser,
  restoreUser,
  resetUserPassword,
  isUserSoftDeleted
} from '@/lib/admin-helpers';
import { isValidUserId } from '@/lib/security';
import prisma from '@/lib/prisma';

// GET /api/users/[id] - Get user by ID (only for superadmin)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require superadmin role
    await requireRole('superadmin');

    const { id: userId } = await params;
    
    // Validate user ID
    if (!isValidUserId(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Get user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        isVerified: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify(user), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch user' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// PATCH /api/users/[id] - Update user profile
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
    
    // Check if user is soft deleted
    const isDeleted = await isUserSoftDeleted(userId);
    if (isDeleted) {
      return new Response(JSON.stringify({ error: 'Cannot update soft-deleted user' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const profileData = await request.json();
    
    // Update user profile
    const updatedUser = await updateUserProfile(currentUserId, userId, profileData);
    
    // Return updated user info (without sensitive data)
    const { password, ...userWithoutPassword } = updatedUser;
    
    return new Response(JSON.stringify(userWithoutPassword), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to update user profile' 
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// DELETE /api/users/[id] - Soft delete user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if user is soft deleted already
    const isDeleted = await isUserSoftDeleted(userId);
    if (isDeleted) {
      return new Response(JSON.stringify({ error: 'User is already soft-deleted' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Soft delete user
    const updatedUser = await softDeleteUser(currentUserId, userId);

    return new Response(JSON.stringify({
      message: 'User soft deleted successfully',
      user: { id: updatedUser.id, email: updatedUser.email }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to soft delete user'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

