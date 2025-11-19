// src/app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { isValidRole, isValidUserId } from '@/lib/security';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Only allow superadmin to access this endpoint
    await requireRole('superadmin');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Only allow superadmin to update users
    await requireRole('superadmin');

    const { userId, role } = await request.json();

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate the new role
    if (!isValidRole(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role specified' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Only allow superadmin to delete users
    await requireRole('superadmin');

    const { userId } = await request.json();

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}