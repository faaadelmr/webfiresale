// src/lib/rbac.ts
// Access Control List (ACL) configuration for role-based access control

// Define the ACL mapping: roles and their accessible resources
const ACL_BASE = {
  superadmin: ["*"], // Superadmin has access to everything
  admin: ["profile", "admin", "admin-products", "admin-orders", "admin-auction", "admin-flashsale", "admin-shipping"], // Admin can access most admin features except users and settings
  customer: ["profile"], // Customer can only access profile
};

// Override specific permissions for more granular control
// Superadmin has access to everything (via "*"), so no need to add specific permissions
// Admin and customer roles need explicit permissions for sub-routes
const ACL_EXTENDED: Record<string, Record<string, string[]>> = {
  admin: {
    'admin-users': [], // Admins CANNOT access user management (superadmin only)
    'admin-settings': [], // Admins CANNOT access settings (superadmin only)
    'admin-products': ['read', 'create', 'update', 'delete'],
    'admin-orders': ['read', 'update'],
    'admin-auction': ['read', 'create', 'update', 'delete'],
    'admin-flashsale': ['read', 'create', 'update', 'delete'],
    'admin-shipping': ['read', 'create', 'update', 'delete']
  },
  customer: {
    'admin': [],
    'admin-users': [],
    'admin-settings': [],
    'admin-products': [],
    'admin-orders': [],
    'admin-auction': [],
    'admin-flashsale': [],
    'admin-shipping': []
  }
};

// Define role types based on ACL keys
export type Role = keyof typeof ACL_BASE;

// Define resource types based on ACL values
export type Resource = string;

/**
 * Checks if a user with a given role has access to a specific resource
 * @param role - The user's role
 * @param resource - The resource being accessed (e.g., "admin", "profile")
 * @returns boolean indicating whether access is granted
 */
export function checkAccess(role: Role, resource: Resource): boolean {
  const permissions = ACL_BASE[role] as string[];

  // If the role doesn't exist in ACL, deny access
  if (!permissions) {
    return false;
  }

  // If the role has wildcard access ("*"), grant access to all resources
  if (permissions.includes("*")) {
    return true;
  }

  // Check if the specific resource is in the allowed permissions
  if (permissions.includes(resource)) {
    return true;
  }

  // Check extended ACL for more granular permissions
  const extendedPermissions = ACL_EXTENDED[role]?.[resource];
  if (extendedPermissions !== undefined) {
    return extendedPermissions.length > 0;
  }

  return false;
}

/**
 * Gets all resources accessible to a specific role
 * @param role - The user's role
 * @returns Array of accessible resources
 */
export function getAccessibleResources(role: Role): Resource[] {
  const permissions = ACL_BASE[role] as string[];

  if (!permissions) {
    return [];
  }

  if (permissions.includes("*")) {
    // If wildcard, return a special indicator
    return ["*"];
  }

  return permissions as Resource[];
}

// Export the ACL for reference if needed
export const ACL = ACL_BASE;