
/**
 * @jest-environment node
 */
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { createUserAction, updateUserAction } from '@/actions/userActions';
import * as security from '@/lib/security';
import * as auth from '@/lib/auth';
import prisma from '@/lib/prisma';

// Mock dependencies
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));

jest.mock('@/lib/auth', () => ({
    requireRole: jest.fn(),
    getCurrentSession: jest.fn(),
    requirePermission: jest.fn(),
}));

jest.mock('@/lib/security', () => ({
    isValidRole: jest.fn().mockReturnValue(true),
    isValidUserId: jest.fn().mockReturnValue(true),
    sanitizeInput: jest.fn(val => val),
    isValidEmail: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/admin-helpers', () => ({
    ...jest.requireActual('@/lib/admin-helpers'),
    generateRandomPassword: jest.fn().mockReturnValue('randomPass123'),
}));

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('User Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReset(prismaMock);
    });

    describe('createUserAction', () => {
        const validUserData = {
            name: 'Test',
            email: 'test@example.com',
            password: 'password123',
            role: 'customer'
        };

        it('should create a user when authenticated as superadmin', async () => {
            (auth.requireRole as jest.Mock).mockResolvedValue(true);
            (security.isValidEmail as jest.Mock).mockReturnValue(true);
            (security.isValidRole as unknown as jest.Mock).mockReturnValue(true);
            prismaMock.user.findFirst.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue({
                id: 'user-1',
                ...validUserData,
                password: 'hashed_password',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                providerId: null, // Fixed property
                provider: 'credentials',
                isVerified: false,
                deletedAt: null,
                preferences: null,
                tempPassword: null,
                role: 'customer',
                phone: null,
                gender: null,
                dateOfBirth: null,
                avatar: null
            } as any);

            const result = await createUserAction(validUserData);

            expect(auth.requireRole).toHaveBeenCalledWith('superadmin');
            expect(prismaMock.user.create).toHaveBeenCalledWith(expect.anything());
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
        });

        it('should fail if email already exists', async () => {
            (auth.requireRole as jest.Mock).mockResolvedValue(true);
            prismaMock.user.findFirst.mockResolvedValue({ id: 'existing' } as any);

            const result = await createUserAction(validUserData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('already exists');
        });
    });

    describe('updateUserAction', () => {
        it('should update user profile when superadmin', async () => {
            (auth.requireRole as jest.Mock).mockResolvedValue(true);
            (auth.getCurrentSession as jest.Mock).mockResolvedValue({ user: { id: 'admin-id', email: 'admin@test.com' } });
            prismaMock.user.findUnique.mockResolvedValue(null); // No email conflict
            prismaMock.user.update.mockResolvedValue({} as any);

            const result = await updateUserAction('target-user-id', { name: 'Updated Name' });

            expect(auth.requireRole).toHaveBeenCalledWith('superadmin');
            expect(prismaMock.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'target-user-id' }
                })
            );
            expect(result.success).toBe(true);
        });

        it('should prevent superadmin from changing their own role to non-superadmin', async () => {
            (auth.requireRole as jest.Mock).mockResolvedValue(true);
            const adminId = 'admin-id';
            (auth.getCurrentSession as jest.Mock).mockResolvedValue({ user: { id: adminId, email: 'admin@test.com' } });

            const result = await updateUserAction(adminId, { role: 'customer' });

            expect(result.success).toBe(false);
            expect(result.message).toContain('change your own role');
        });
    });
});
