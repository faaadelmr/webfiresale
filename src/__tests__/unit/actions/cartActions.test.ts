/**
 * @jest-environment node
 */
import { getUserCartAction, addToCartAction } from '@/actions/cartActions';
import * as cartDb from '@/lib/cart-db';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {}
}));
jest.mock('@/lib/cart-db', () => ({
    getOrCreateCart: jest.fn(),
    addItemToCart: jest.fn(),
    formatCartForFrontend: jest.fn(val => val),
}));
// Explicitly mock prisma to avoid initialization errors if cart-db imports it
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn(),
        cart: { findUnique: jest.fn() }
    },
}));

describe('Cart Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserCartAction', () => {
        it('should return cart when authenticated', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
            (cartDb.getOrCreateCart as jest.Mock).mockResolvedValue({ id: 'cart-1', items: [] });

            const result = await getUserCartAction();

            expect(getServerSession).toHaveBeenCalled();
            expect(cartDb.getOrCreateCart).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({ id: 'cart-1', items: [] });
        });

        it('should throw error when not authenticated', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);

            await expect(getUserCartAction()).rejects.toThrow('User not authenticated');
        });
    });

    describe('addToCartAction', () => {
        it('should add item to cart', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
            (cartDb.addItemToCart as jest.Mock).mockResolvedValue({ id: 'cart-1', items: ['new-item'] });

            const result = await addToCartAction('prod-1', 1, 100);

            expect(cartDb.addItemToCart).toHaveBeenCalledWith('user-1', 'prod-1', 1, 100, undefined);
            expect(result).toEqual({ id: 'cart-1', items: ['new-item'] });
        });
    });
});
