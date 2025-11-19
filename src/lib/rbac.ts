// src/lib/rbac.ts
// Access Control List (ACL) configuration for role-based access control

// Define the ACL mapping: roles and their accessible resources
const ACL = {
  superadmin: ["*"], // Superadmin has access to everything
  admin: ["dashboard", "profile"], // Admin can access dashboard and profile
  customer: ["profile"], // Customer can only access profile
} as const;

// Define role types based on ACL keys
export type Role = keyof typeof ACL;

// Define resource types based on ACL values
export type Resource = string;

/**
 * Checks if a user with a given role has access to a specific resource
 * @param role - The user's role
 * @param resource - The resource being accessed (e.g., "dashboard", "profile")
 * @returns boolean indicating whether access is granted
 */
export function checkAccess(role: Role, resource: Resource): boolean {
  const permissions = ACL[role];
  
  // If the role doesn't exist in ACL, deny access
  if (!permissions) {
    return false;
  }

  // If the role has wildcard access ("*"), grant access to all resources
  if (permissions.includes("*")) {
    return true;
  }

  // Check if the specific resource is in the allowed permissions
  return permissions.includes(resource);
}

/**
 * Gets all resources accessible to a specific role
 * @param role - The user's role
 * @returns Array of accessible resources
 */
export function getAccessibleResources(role: Role): Resource[] {
  const permissions = ACL[role];
  
  if (!permissions) {
    return [];
  }

  if (permissions.includes("*")) {
    // If wildcard, return a special indicator
    return ["*"];
  }

  return [...permissions];
}

// Export the ACL for reference if needed
export { ACL };