// src/lib/auth.ts
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

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

  // Create new user
  user = await prisma.user.create({
    data: {
      name: profile.name || profile.displayName,
      email: profile.email,
      providerId: profile.id?.toString(),
      provider,
    }
  })

  return user
}