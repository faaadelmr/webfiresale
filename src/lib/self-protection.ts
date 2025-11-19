// src/lib/self-protection.ts
import { getCurrentSession } from './auth';

/**
 * Validates that a user action is not targeting the user themselves in a restricted way
 * @param targetUserId - The ID of the user being targeted by the action
 * @param allowedForSelf - Whether the action is allowed to be performed on oneself
 * @returns boolean indicating if the action is valid
 */
export async function validateSelfAction(targetUserId: string, allowedForSelf: boolean = false): Promise<boolean> {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    throw new Error('User authentication required');
  }
  
  const currentUserId = session.user.id;
  
  // If this is an action on the current user
  if (currentUserId === targetUserId) {
    // If this action is not allowed for self, return false
    if (!allowedForSelf) {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks if the current user is trying to perform an action on themselves
 * @param targetUserId - The ID of the user being targeted by the action
 * @returns boolean indicating if the action is on the current user
 */
export async function isSelfAction(targetUserId: string): Promise<boolean> {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return false;
  }
  
  return session.user.id === targetUserId;
}

/**
 * Validates that the current user can perform an action on another user
 * @param targetUserId - The ID of the user being targeted by the action
 * @param actionDescription - A description of the action for error messages
 * @returns boolean indicating if the action is valid
 */
export async function canUserPerformActionOn(targetUserId: string, actionDescription: string): Promise<boolean> {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    throw new Error('User authentication required');
  }
  
  const currentUserId = session.user.id;
  
  // Prevent users from performing actions on themselves when not allowed
  if (currentUserId === targetUserId) {
    // Some actions might be allowed on self, others not
    // Here we can add custom logic based on the action
    switch (actionDescription) {
      case 'update_role':
        // A superadmin can be allowed to change their own role to another role
        // but we might want to restrict it
        if (session.user.role === 'superadmin') {
          return true;
        }
        // For non-superadmins, prevent role changes
        return false;
      case 'update_profile':
        // Users can generally update their own profile
        return true;
      case 'delete_user':
        // Users shouldn't be able to delete themselves through this path
        return false;
      case 'restore_user':
        // Users shouldn't restore themselves if deleted
        return false;
      case 'reset_password':
        // Users can reset their own password (in normal path) but not through admin path
        return false;
      default:
        return false;
    }
  }
  
  // For actions on other users, we rely on role checks
  return true;
}