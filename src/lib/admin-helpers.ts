// src/lib/admin-helpers.ts
import { isValidEmail, isValidRole, isValidUserId, sanitizeInput } from './security';
import prisma from './prisma';
import bcrypt from 'bcryptjs';
import { Role } from './rbac';
import { requireRole } from './auth';

/**
 * Validates that a user can be modified by the current user
 * @param currentUserId - The ID of the current user making the request
 * @param targetUserId - The ID of the user being modified
 * @param role - The role being assigned (if applicable)
 * @throws Error if the operation is not allowed
 */
export function validateUserModification(currentUserId: string, targetUserId: string, role?: string) {
  // Prevent a user from modifying themselves in ways that would reduce their privileges
  if (currentUserId === targetUserId) {
    if (role && role !== 'superadmin') {
      throw new Error('Superadmin cannot change their own role to a lower role');
    }
  }
}

/**
 * Checks if a user is soft deleted
 * @param userId - The ID of the user to check
 * @returns boolean indicating if the user is soft deleted
 */
export async function isUserSoftDeleted(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return !user.isActive || user.deletedAt !== null;
}

/**
 * Soft deletes a user
 * @param currentUserId - The ID of the user performing the deletion
 * @param userId - The ID of the user to soft delete
 * @returns The updated user object
 */
export async function softDeleteUser(currentUserId: string, userId: string) {
  // Verify current user is superadmin
  await requireRole('superadmin');
  
  // Validate user IDs
  if (!isValidUserId(currentUserId) || !isValidUserId(userId)) {
    throw new Error('Invalid user ID');
  }
  
  // Prevent superadmin from soft-deleting themselves
  if (currentUserId === userId) {
    throw new Error('Superadmin cannot soft-delete themselves');
  }
  
  // Perform soft delete
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
  
  return updatedUser;
}

/**
 * Restores a soft-deleted user
 * @param currentUserId - The ID of the user performing the restoration
 * @param userId - The ID of the user to restore
 * @returns The updated user object
 */
export async function restoreUser(currentUserId: string, userId: string) {
  // Verify current user is superadmin
  await requireRole('superadmin');
  
  // Validate user IDs
  if (!isValidUserId(currentUserId) || !isValidUserId(userId)) {
    throw new Error('Invalid user ID');
  }
  
  // Restore user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true,
      deletedAt: null,
    },
  });
  
  return updatedUser;
}

/**
 * Purges users that have been soft deleted for more than 30 days
 * @returns The number of users purged
 */
export async function purgeOldDeletedUsers(): Promise<number> {
  // Find users that were soft deleted more than 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // First, get the IDs of users to delete for logging
  const usersToDelete = await prisma.user.findMany({
    where: {
      isActive: false,
      deletedAt: {
        lte: thirtyDaysAgo,
      },
    },
    select: {
      id: true,
    },
  });
  
  // Delete the users permanently
  const result = await prisma.user.deleteMany({
    where: {
      isActive: false,
      deletedAt: {
        lte: thirtyDaysAgo,
      },
    },
  });
  
  console.log(`Purged ${result.count} users that were soft deleted more than 30 days ago`);
  
  return result.count;
}

/**
 * Generates a random password
 * @param length - The length of the password to generate (default: 12)
 * @returns A randomly generated password
 */
export function generateRandomPassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

/**
 * Resets a user's password
 * @param currentUserId - The ID of the user performing the reset
 * @param userId - The ID of the user whose password to reset
 * @returns The new password (unhashed) for the user
 */
export async function resetUserPassword(currentUserId: string, userId: string): Promise<string> {
  // Verify current user is superadmin
  await requireRole('superadmin');

  // Validate user IDs
  if (!isValidUserId(currentUserId) || !isValidUserId(userId)) {
    throw new Error('Invalid user ID');
  }

  // Prevent superadmin from resetting their own password via this method
  if (currentUserId === userId) {
    throw new Error('Superadmin cannot reset their own password via admin endpoint');
  }

  // Generate a new random password
  const newPassword = generateRandomPassword();

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Store the temporary password in the tempPassword field for the user to see
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      tempPassword: newPassword, // Store the plain text temporary password
    },
  });

  // Return the new unhashed password so it can be communicated to the user
  return newPassword;
}

/**
 * Updates a user's profile information
 * @param currentUserId - The ID of the user performing the update
 * @param userId - The ID of the user to update
 * @param profileData - The profile data to update
 * @returns The updated user object
 */
export async function updateUserProfile(currentUserId: string, userId: string, profileData: {
  name?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: Date;
  isActive?: boolean;
}) {
  // Verify current user is superadmin
  await requireRole('superadmin');

  // Validate user IDs
  if (!isValidUserId(currentUserId) || !isValidUserId(userId)) {
    throw new Error('Invalid user ID');
  }

  // Sanitize inputs
  const sanitizedProfileData: any = {};

  if (profileData.name !== undefined) {
    sanitizedProfileData.name = sanitizeInput(profileData.name);
  }
  if (profileData.email) {
    // Validate email format
    if (!isValidEmail(profileData.email)) {
      throw new Error('Invalid email format');
    }

    // Check if email already exists for another user
    const existingUser = await prisma.user.findUnique({
      where: { email: profileData.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email already exists for another user');
    }

    sanitizedProfileData.email = profileData.email;
  }
  if (profileData.avatar) {
    sanitizedProfileData.avatar = profileData.avatar;
  }
  if (profileData.phone) {
    sanitizedProfileData.phone = sanitizeInput(profileData.phone);
  }
  if (profileData.firstName) {
    sanitizedProfileData.firstName = sanitizeInput(profileData.firstName);
  }
  if (profileData.lastName) {
    sanitizedProfileData.lastName = sanitizeInput(profileData.lastName);
  }
  if (profileData.gender) {
    sanitizedProfileData.gender = profileData.gender;
  }
  if (profileData.dateOfBirth) {
    sanitizedProfileData.dateOfBirth = profileData.dateOfBirth;
  }
  // isActive can be true or false, so we check for undefined specifically
  if (profileData.isActive !== undefined) {
    sanitizedProfileData.isActive = profileData.isActive;
  }

  // Update the user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: sanitizedProfileData,
  });

  return updatedUser;
}

/**
 * Updates a user's role
 * @param currentUserId - The ID of the user performing the update
 * @param userId - The ID of the user whose role to update
 * @param newRole - The new role to assign
 * @returns The updated user object
 */
export async function updateUserRole(currentUserId: string, userId: string, newRole: Role) {
  // Verify current user is superadmin
  await requireRole('superadmin');
  
  // Validate user IDs and role
  if (!isValidUserId(currentUserId) || !isValidUserId(userId)) {
    throw new Error('Invalid user ID');
  }
  
  if (!isValidRole(newRole)) {
    throw new Error('Invalid role specified');
  }
  
  // Prevent superadmin from changing their own role to a lower role
  if (currentUserId === userId && newRole !== 'superadmin') {
    throw new Error('Superadmin cannot change their own role to a lower role');
  }
  
  // Special handling: prevent a superadmin from demoting another superadmin
  // (In a real system, you might want multi-admin approval for this)
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (targetUser?.role === 'superadmin' && newRole !== 'superadmin') {
    // Additional check: if the target user is a different superadmin, we might want extra validation
    // For this implementation, we'll allow a superadmin to change another superadmin's role
  }
  
  // Update the user's role
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
  
  return updatedUser;
}