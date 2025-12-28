import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/admin/vouchers - List all vouchers
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const status = searchParams.get('status') || '';

        const where: any = {};

        // Search by code or description
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filter by discount type
        if (type) {
            where.discountType = type;
        }

        // Filter by active status
        if (status === 'active') {
            where.isActive = true;
        } else if (status === 'inactive') {
            where.isActive = false;
        }

        const vouchers = await prisma.voucher.findMany({
            where,
            include: {
                _count: {
                    select: {
                        voucherUsages: true,
                        orders: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate usage statistics
        const vouchersWithStats = vouchers.map((voucher) => {
            const now = new Date();
            const isExpired = voucher.endDate < now;
            const isNotStarted = voucher.startDate > now;
            const usageCount = voucher._count.voucherUsages;
            const orderCount = voucher._count.orders;

            let statusText = 'Active';
            if (!voucher.isActive) {
                statusText = 'Inactive';
            } else if (isExpired) {
                statusText = 'Expired';
            } else if (isNotStarted) {
                statusText = 'Scheduled';
            } else if (voucher.usageLimit && usageCount >= voucher.usageLimit) {
                statusText = 'Used Up';
            }

            return {
                ...voucher,
                usageCount,
                orderCount,
                statusText,
            };
        });

        return NextResponse.json(vouchersWithStats);
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vouchers' },
            { status: 500 }
        );
    }
}

// POST /api/admin/vouchers - Create new voucher
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            code,
            description,
            discountType,
            discountValue,
            minPurchase,
            maxDiscount,
            usageLimit,
            usagePerUser,
            startDate,
            endDate,
            isActive,
            flashSaleOnly,
            auctionOnly,
            regularOnly,
        } = body;

        // Validate required fields
        if (!code || !discountType || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate discount value for PERCENTAGE and FIXED_AMOUNT
        if (discountType !== 'FREE_SHIPPING' && !discountValue) {
            return NextResponse.json(
                { error: 'Discount value is required for this discount type' },
                { status: 400 }
            );
        }

        // Validate percentage range
        if (discountType === 'PERCENTAGE' && (discountValue < 0 || discountValue > 100)) {
            return NextResponse.json(
                { error: 'Percentage must be between 0 and 100' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.voucher.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Voucher code already exists' },
                { status: 400 }
            );
        }

        // Create voucher
        const voucher = await prisma.voucher.create({
            data: {
                code: code.toUpperCase(),
                description,
                discountType,
                discountValue: discountValue ? parseFloat(discountValue) : null,
                minPurchase: minPurchase ? parseFloat(minPurchase) : null,
                maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                usagePerUser: usagePerUser ? parseInt(usagePerUser) : null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: isActive ?? true,
                flashSaleOnly: flashSaleOnly ?? false,
                auctionOnly: auctionOnly ?? false,
                regularOnly: regularOnly ?? false,
            },
        });

        return NextResponse.json(voucher, { status: 201 });
    } catch (error) {
        console.error('Error creating voucher:', error);
        return NextResponse.json(
            { error: 'Failed to create voucher' },
            { status: 500 }
        );
    }
}
