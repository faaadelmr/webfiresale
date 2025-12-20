// src/app/api/signup/route.ts
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields (name, email, password) are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
        { status: 400 }
      )
    }

    // Check if user already exists (excluding soft-deleted users)
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        isActive: true,  // Only consider active users
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with default role 'customer'
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        provider: 'credentials',
        role: 'customer', // Default role for new users
      },
    })

    // Return success response (without password)
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}