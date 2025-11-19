// src/types/user.ts
export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
}