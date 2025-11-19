// src/app/api/users/route.ts
import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { isValidEmail, isValidRole, sanitizeInput } from '@/lib/security';
import bcrypt from 'bcryptjs';
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
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        phone: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
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

export async function POST(request: NextRequest) {
  try {
    // Only allow superadmin to create users
    await requireRole('superadmin');

    const { name, email, password, role, phone, firstName, lastName, gender, dateOfBirth } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return new Response(JSON.stringify({
        error: 'Name, email, and password are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate role if provided
    if (role && !isValidRole(role)) {
      return new Response(JSON.stringify({
        error: 'Invalid role specified'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if user already exists (excluding soft-deleted users)
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        isActive: true,  // Only consider active users
      },
    });

    if (existingUser) {
      return new Response(JSON.stringify({
        error: 'User with this email already exists'
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Sanitize inputs
    const sanitizedInputs = {
      name: sanitizeInput(name),
      email,
      password: hashedPassword,
      role: role || 'customer', // Default to customer if no role specified
      phone: phone ? sanitizeInput(phone) : undefined,
      firstName: firstName ? sanitizeInput(firstName) : undefined,
      lastName: lastName ? sanitizeInput(lastName) : undefined,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };

    // Create the user
    const user = await prisma.user.create({
      data: {
        ...sanitizedInputs,
        provider: 'credentials', // Since we're setting a password, it's a credentials user
      },
    });

    // Return the created user (without password)
    const { password: _, ...userWithoutPassword } = user;

    return new Response(JSON.stringify(userWithoutPassword), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to create user'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}