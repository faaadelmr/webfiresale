'use server';

import { requireRole, requirePermission, getCurrentSession } from '@/lib/auth';
import {
  isValidRole,
  isValidUserId,
  sanitizeInput,
  isValidEmail
} from '@/lib/security';
import {
  softDeleteUser as softDeleteUserService,
  restoreUser as restoreUserService,
  resetUserPassword as resetUserPasswordService,
  updateUserProfile as updateUserProfileService,
  updateUserRole as updateUserRoleService,
  isUserSoftDeleted,
  generateRandomPassword
} from '@/lib/admin-helpers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Server action to create a new user - only for superadmin role
export async function createUserAction(userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  avatar?: string;
}) {
  try {
    // Only allow superadmin to create users
    await requireRole('superadmin');

    const { name, email, password, role, phone, firstName, lastName, gender, dateOfBirth, avatar } = userData;

    // Validate required fields
    if (!name || !email || !password) {
      return { success: false, message: 'Name, email, and password are required' };
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    // Validate role if provided
    if (role && !isValidRole(role)) {
      return { success: false, message: 'Invalid role specified' };
    }

    // Check if user already exists (excluding soft-deleted users)
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        isActive: true,  // Only consider active users
      },
    });

    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
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
      avatar,
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

    return { success: true, message: 'User created successfully', user: userWithoutPassword };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create user' };
  }
}

// Server action to update a user profile - only for superadmin role
export async function updateUserAction(userId: string, profileData: any) {
  try {
    // Only allow superadmin to update user profiles
    await requireRole('superadmin');

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }

    // Get current session to check for self-modification
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    const currentUserId = session.user.id;

    // Check if this is a self-action
    if (currentUserId === userId) {
      // Prevent superadmin from modifying their own role
      if (profileData.role && profileData.role !== 'superadmin') {
        return { success: false, message: 'You cannot change your own role to a non-superadmin role' };
      }

      // Prevent superadmin from changing their own email
      if (profileData.email && profileData.email !== session.user.email) {
        return { success: false, message: 'You cannot change your own email address' };
      }

      // Prevent superadmin from deactivating themselves
      if (profileData.isActive === false) {
        return { success: false, message: 'You cannot deactivate your own account' };
      }
    }

    // Sanitize profile data to prevent XSS or injection attacks
    const sanitizedProfileData = {
      ...profileData,
      name: profileData.name ? sanitizeInput(profileData.name) : undefined,
      firstName: profileData.firstName ? sanitizeInput(profileData.firstName) : undefined,
      lastName: profileData.lastName ? sanitizeInput(profileData.lastName) : undefined,
      phone: profileData.phone ? sanitizeInput(profileData.phone) : undefined,
    };

    // Check if email is being changed and if it already exists for another user
    if (profileData.email && profileData.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: profileData.email },
      });

      if (existingUser && existingUser.id !== userId) {
        return { success: false, message: 'Email already exists for another user' };
      }
    }

    // Update the user's profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...sanitizedProfileData,
      },
    });

    return { success: true, message: 'User profile updated successfully' };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update profile' };
  }
}

// Server action to update user role - only for superadmin role
export async function changeUserRoleAction(userId: string, newRole: string) {
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

    // Get current session to check for self-modification
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    const currentUserId = session.user.id;

    // Prevent superadmin from changing their own role to a non-superadmin role
    if (currentUserId === userId && newRole !== 'superadmin') {
      return { success: false, message: 'You cannot change your own role to a non-superadmin role' };
    }

    // Special handling: prevent a superadmin from demoting another superadmin (for safety)
    // This might be configurable based on business requirements
    if (session.user.role === 'superadmin' && newRole !== 'superadmin') {
      // Check if the target user is also a superadmin
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (targetUser?.role === 'superadmin') {
        // Optionally, we could require multiple superadmin approvals for this action
        // For now, we'll allow it but we could add more complex logic here
      }
    }

    // Update the user's role
    const updatedUser = await updateUserRoleService(currentUserId, userId, newRole as any);

    return { success: true, message: `User role updated successfully` };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update user role' };
  }
}

// Server action to soft delete a user - only for superadmin role
export async function softDeleteUserAction(userId: string) {
  try {
    // Only allow superadmin to delete users
    await requireRole('superadmin');

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }

    // Get current session to check for self-deletion
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    const currentUserId = session.user.id;

    // Prevent superadmin from deleting themselves
    if (currentUserId === userId) {
      return { success: false, message: 'You cannot delete your own account' };
    }

    // Additional check: ensure this is a superadmin performing the action
    if (session.user.role !== 'superadmin') {
      return { success: false, message: 'Only superadmins can delete users' };
    }

    // Check if user is already soft-deleted
    const isDeleted = await isUserSoftDeleted(userId);
    if (isDeleted) {
      return { success: false, message: 'User is already soft-deleted' };
    }

    // Soft delete the user
    const updatedUser = await softDeleteUserService(currentUserId, userId);

    return { success: true, message: 'User soft deleted successfully' };
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to soft delete user' };
  }
}

// Server action to restore a soft-deleted user - only for superadmin role
export async function restoreUserAction(userId: string) {
  try {
    // Only allow superadmin to restore users
    await requireRole('superadmin');

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }

    // Check if user is soft-deleted
    const isDeleted = await isUserSoftDeleted(userId);
    if (!isDeleted) {
      return { success: false, message: 'User is not soft-deleted' };
    }

    // Get current session to pass to service
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    // Additional check: ensure this is a superadmin performing the action
    if (session.user.role !== 'superadmin') {
      return { success: false, message: 'Only superadmins can restore users' };
    }

    // Restore the user
    const updatedUser = await restoreUserService(session.user.id, userId);

    return { success: true, message: 'User restored successfully' };
  } catch (error) {
    console.error('Error restoring user:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to restore user' };
  }
}

// Server action to reset a user's password - only for superadmin role
export async function resetPasswordAction(userId: string) {
  try {
    // Only allow superadmin to reset passwords
    await requireRole('superadmin');

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }

    // Get current session to check for self-password reset
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    const currentUserId = session.user.id;

    // Prevent superadmin from resetting their own password via this method
    if (currentUserId === userId) {
      return { success: false, message: 'You cannot reset your own password from here' };
    }

    // Additional check: ensure this is a superadmin performing the action
    if (session.user.role !== 'superadmin') {
      return { success: false, message: 'Only superadmins can reset passwords' };
    }

    // Reset the user's password
    const newPassword = await resetUserPasswordService(currentUserId, userId);

    return { success: true, message: 'Password reset successfully', newPassword };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to reset password' };
  }
}

// Server action to get all users - only for superadmin role
export async function getAllUsersAction() {
  try {
    // Only allow superadmin to access this endpoint
    await requireRole('superadmin');

    // Get all users with specific fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
        tempPassword: true, // Include tempPassword field
        createdAt: true,
        updatedAt: true,
        avatar: true,
        phone: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to fetch users' };
  }
}

// Export a function to get a single user
export async function getUserByIdAction(userId: string) {
  try {
    // Only allow superadmin to access this endpoint
    await requireRole('superadmin');

    // Validate the user ID
    if (!isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID' };
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
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        isVerified: true,
        isActive: true,
        deletedAt: true,
        tempPassword: true, // Include tempPassword field
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to fetch user' };
  }
}

// Server action to change user's own password
export async function changePasswordAction(currentPassword: string, newPassword: string) {
  try {
    // Get current session to identify the user
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    const userId = session.user.id;

    // Validate inputs
    if (!newPassword) {
      return { success: false, message: 'New password is required' };
    }

    if (newPassword.length < 8 || newPassword.length > 12) {
      return { success: false, message: 'New password must be between 8 and 12 characters' };
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, provider: true }
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check if the user is using OAuth (provider exists and no password set)
    if (user.provider && user.provider !== 'credentials') {
      // This is an OAuth user setting a password for the first time
      // Skip current password validation
      if (!user.password) {
        // OAuth user setting initial password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and provider
        await prisma.user.update({
          where: { id: userId },
          data: {
            password: hashedNewPassword,
            provider: 'credentials' // Update provider to show they now have credentials
          }
        });

        return { success: true, message: 'Password set successfully! You can now login with credentials.' };
      }
    } else {
      // This is a regular credentials user - verify current password if provided
      if (!currentPassword) {
        return { success: false, message: 'Current password is required for credentials users' };
      }

      // Verify the current password
      const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password || '');
      if (!isValidCurrentPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }
    }

    // For existing credentials users with correct current password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to change password' };
  }
}

// Server action to delete user's own account (soft delete)
export async function deleteSelfAccountAction() {
  try {
    // Get current session to identify the user
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Prevent superadmin from deleting their own account via this method
    if (userRole === 'superadmin') {
      return { success: false, message: 'Superadmin cannot delete their own account' };
    }

    // Check if user is already soft-deleted
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, deletedAt: true }
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!user.isActive || user.deletedAt) {
      return { success: false, message: 'Account is already deleted' };
    }

    // Perform soft delete
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      }
    });

    return { success: true, message: 'Account deleted successfully' };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete account' };
  }
}