'use server';

import { requireRole, requirePermission } from '@/lib/auth';
import { isValidRole, isValidUserId, sanitizeInput } from '@/lib/security';
import prisma from '@/lib/prisma';

// Server action to delete a user - only for superadmin role
export async function deleteUser(userId: string) {
  try {
    // Only allow superadmin to delete users
    await requireRole('superadmin');

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }

    // Perform the user deletion
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true, message: `User ${deletedUser.name} has been deleted` };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Failed to delete user' };
  }
}

// Server action to update user role - only for superadmin role
export async function updateUserRole(userId: string, newRole: string) {
  try {
    // Only allow superadmin to update roles
    await requireRole('superadmin');

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }

    // Validate the new role
    if (!isValidRole(newRole)) {
      return { success: false, message: 'Invalid role specified' };
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return { success: true, message: `User ${updatedUser.name} role updated to ${newRole}` };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, message: 'Failed to update user role' };
  }
}

// Server action to update user profile - accessible by the user themselves or admin
export async function updateUserProfile(userId: string, profileData: any) {
  try {
    // Check if the user has permission to update a profile
    await requirePermission('profile');

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }

    // Sanitize profile data to prevent XSS or injection attacks
    const sanitizedProfileData = {
      ...profileData,
      name: profileData.name ? sanitizeInput(profileData.name) : undefined,
      firstName: profileData.firstName ? sanitizeInput(profileData.firstName) : undefined,
      lastName: profileData.lastName ? sanitizeInput(profileData.lastName) : undefined,
      phone: profileData.phone ? sanitizeInput(profileData.phone) : undefined,
      bio: profileData.bio ? sanitizeInput(profileData.bio) : undefined,
    };

    // Update the user's profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...sanitizedProfileData,
      },
    });

    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, message: 'Failed to update profile' };
  }
}