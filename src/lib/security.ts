// src/lib/security.ts
import { Role } from './rbac';

/**
 * Validates that a role is one of the allowed roles
 * @param role - The role to validate
 * @returns boolean indicating if the role is valid
 */
export function isValidRole(role: string): role is Role {
  const validRoles: Role[] = ['superadmin', 'admin', 'customer'];
  return validRoles.includes(role as Role);
}

/**
 * Sanitizes user input to prevent injection attacks
 * @param input - The input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates a user ID to ensure it matches the expected format
 * @param userId - The user ID to validate
 * @returns boolean indicating if the ID is valid
 */
export function isValidUserId(userId: string): boolean {
  // Assuming Prisma uses cuid format which starts with 'c' followed by 24 alphanumeric characters
  const cuidRegex = /^c[0-9a-z]{24}$/;
  return cuidRegex.test(userId);
}

/**
 * Validates an email address format
 * @param email - The email to validate
 * @returns boolean indicating if the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates product data
 * @param productData - The product data to validate
 * @returns An object with isValid boolean and error message if invalid
 */
export function isValidProductData(productData: any) {
  // Validate required fields
  if (!productData.name || typeof productData.name !== 'string' || productData.name.trim().length === 0) {
    return { isValid: false, error: 'Product name is required and must be a non-empty string' };
  }

  if (!productData.description || typeof productData.description !== 'string' || productData.description.trim().length === 0) {
    return { isValid: false, error: 'Product description is required and must be a non-empty string' };
  }

  if (!productData.image || typeof productData.image !== 'string' || productData.image.trim().length === 0) {
    return { isValid: false, error: 'Product image is required and must be a non-empty string' };
  }

  // Validate original price
  if (typeof productData.originalPrice === 'undefined' || productData.originalPrice === null) {
    return { isValid: false, error: 'Original price is required' };
  }

  const price = Number(productData.originalPrice);
  if (isNaN(price) || price < 0) {
    return { isValid: false, error: 'Original price must be a valid non-negative number' };
  }

  // Validate quantity
  if (typeof productData.quantityAvailable === 'undefined' || productData.quantityAvailable === null) {
    return { isValid: false, error: 'Quantity is required' };
  }

  const quantity = Number(productData.quantityAvailable);
  if (isNaN(quantity) || quantity < 0) {
    return { isValid: false, error: 'Quantity must be a valid non-negative number' };
  }

  // Validate weight
  if (typeof productData.weight === 'undefined' || productData.weight === null) {
    return { isValid: false, error: 'Weight is required' };
  }

  const weight = Number(productData.weight);
  if (isNaN(weight) || weight < 0) {
    return { isValid: false, error: 'Weight must be a valid non-negative number' };
  }

  // If all validations pass
  return { isValid: true };
}

/**
 * Generates a secure random token for various security purposes
 * @param length - The length of the token to generate
 * @returns A secure random token
 */
export async function generateSecureToken(length: number = 32): Promise<string> {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}