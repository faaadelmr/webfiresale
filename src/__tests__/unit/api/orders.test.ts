
/**
 * @jest-environment node
 */
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { POST } from '@/app/api/orders/route';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {}
}));
jest.mock('@/lib/region-utils', () => ({
    enrichAddressWithNames: jest.fn(addr => addr)
}));
jest.mock('@/lib/regions', () => ({
    mockRegions: { cities: [] }
}));

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('Order API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReset(prismaMock);
    });

    describe('POST /api/orders', () => {
        const validOrderData = {
            total: 100000,
            items: [
                { product: { id: 'prod-1', flashSalePrice: 50000 }, quantity: 2 }
            ],
            address: {
                id: 'addr-1',
                fullName: 'Test User',
                phone: '123456789',
                street: 'Test Street',
                provinceId: 'prov-1',
                cityId: 'city-1',
                districtId: 'dist-1',
                villageId: 'vill-1',
                label: 'Rumah',
                city: 'Test City' // Added mock city name
            },
            shippingCost: 15000
        };

        it('should create an order successfully', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

            // Mock transaction to return whatever the callback returns
            prismaMock.$transaction.mockImplementation(async (callback) => {
                return await callback(prismaMock);
            });

            prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);
            prismaMock.address.findUnique.mockResolvedValue({
                id: 'addr-1',
                name: 'Addr Name',
                // Mock address fields to avoid crash if they are accessed
            } as any);

            // Mock implicit create calls in transaction
            prismaMock.order.create.mockResolvedValue({
                id: 'order-1',
                totalAmount: { toString: () => '100000' }
            } as any);
            prismaMock.orderItem.create.mockResolvedValue({} as any);
            prismaMock.product.update.mockResolvedValue({} as any);
            prismaMock.flashSale.update.mockResolvedValue({} as any);
            prismaMock.stockReservation.updateMany.mockResolvedValue({} as any);
            prismaMock.auction.findFirst.mockResolvedValue(null); // Ensure no auction found for regular item

            const req = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(validOrderData)
            });

            const response = await POST(req);
            const body = await response.json();

            if (response.status !== 201) {
                console.log('TEST FAILURE DEBUG:', body);
            }

            expect(response.status).toBe(201);
            expect(body.message).toBe('Order created successfully');
            expect(prismaMock.order.create).toHaveBeenCalled();
        });

        it('should return 400 if items are missing', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

            const req = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify({ ...validOrderData, items: [] })
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });

        it('should return 401 if unauthorized', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);

            const req = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(validOrderData)
            });

            const response = await POST(req);
            expect(response.status).toBe(401);
        });
    });
});
