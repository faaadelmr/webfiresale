
import { checkAccess, Role } from '@/lib/rbac';

describe('RBAC', () => {
    describe('checkAccess', () => {
        it('allows superadmin to access everything', () => {
            expect(checkAccess('superadmin', 'anything')).toBe(true);
            expect(checkAccess('superadmin', 'admin-users')).toBe(true);
        });

        it('allows admin to access allowed resources', () => {
            expect(checkAccess('admin', 'admin')).toBe(true);
            expect(checkAccess('admin', 'admin-products')).toBe(true);
            expect(checkAccess('admin', 'admin-orders')).toBe(true);
        });

        it('denies admin from accessing restricted resources', () => {
            expect(checkAccess('admin', 'admin-users')).toBe(false);
            expect(checkAccess('admin', 'admin-settings')).toBe(false);
        });

        it('allows customer to access profile only', () => {
            expect(checkAccess('customer', 'profile')).toBe(true);
            expect(checkAccess('customer', 'admin')).toBe(false);
        });

        it('denies unknown role', () => {
            expect(checkAccess('hacker' as Role, 'profile')).toBe(false);
        });
    });
});
