import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/admin/vouchers/[id] - Get specific voucher
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const voucher = await prisma.voucher.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: {
                        voucherUsages: true,
                        orders: true,
                    },
                },
                voucherUsages: {
                    include: {
                        // Note: We don't have User relation on VoucherUsage, just userId
                    },
                    orderBy: {
                        usedAt: 'desc',
                    },
                    take: 10,
                },
            },
        });

        if (!voucher) {
            return NextResponse.json(
                { error: 'Voucher not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(voucher);
    } catch (error) {
        console.error('Error fetching voucher:', error);
        return NextResponse.json(
            { error: 'Failed to fetch voucher' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/vouchers/[id] - Update voucher
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
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

        // Check if voucher exists
        const existing = await prisma.voucher.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Voucher not found' },
                { status: 404 }
            );
        }

        // If code is being changed, check if new code already exists
        if (code && code !== existing.code) {
            const codeExists = await prisma.voucher.findUnique({
                where: { code: code.toUpperCase() },
            });

            if (codeExists) {
                return NextResponse.json(
                    { error: 'Voucher code already exists' },
                    { status: 400 }
                );
            }
        }

        // Validate percentage range
        if (discountType === 'PERCENTAGE' && discountValue && (discountValue < 0 || discountValue > 100)) {
            return NextResponse.json(
                { error: 'Percentage must be between 0 and 100' },
                { status: 400 }
            );
        }

        // Update voucher
        const voucher = await prisma.voucher.update({
            where: { id: params.id },
            data: {
                ...(code && { code: code.toUpperCase() }),
                ...(description !== undefined && { description }),
                ...(discountType && { discountType }),
                ...(discountValue !== undefined && { discountValue: discountValue ? parseFloat(discountValue) : null }),
                ...(minPurchase !== undefined && { minPurchase: minPurchase ? parseFloat(minPurchase) : null }),
                ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null }),
                ...(usageLimit !== undefined && { usageLimit: usageLimit ? parseInt(usageLimit) : null }),
                ...(usagePerUser !== undefined && { usagePerUser: usagePerUser ? parseInt(usagePerUser) : null }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(isActive !== undefined && { isActive }),
                ...(flashSaleOnly !== undefined && { flashSaleOnly }),
                ...(auctionOnly !== undefined && { auctionOnly }),
                ...(regularOnly !== undefined && { regularOnly }),
            },
        });

        return NextResponse.json(voucher);
    } catch (error) {
        console.error('Error updating voucher:', error);
        return NextResponse.json(
            { error: 'Failed to update voucher' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/vouchers/[id] - Delete (deactivate) voucher
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if voucher exists and get usage count
        const existing = await prisma.voucher.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: {
                        voucherUsages: true,
                        orders: true
                    },
                },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Voucher not found' },
                { status: 404 }
            );
        }

        // Check if used in Usages OR Orders
        if (existing._count.voucherUsages > 0 || existing._count.orders > 0) {
            // Soft delete if used
            const voucher = await prisma.voucher.update({
                where: { id: params.id },
                data: { isActive: false },
            });
            return NextResponse.json({
                message: 'Voucher dinonaktifkan karena sudah pernah digunakan pada pesanan',
                voucher
            });
        } else {
            // Hard delete if never used
            await prisma.voucher.delete({
                where: { id: params.id },
            });
            return NextResponse.json({
                message: 'Voucher berhasil dihapus permanen'
            });
        }
    } catch (error) {
        console.error('Error deleting voucher:', error);
        return NextResponse.json(
            { error: 'Failed to delete voucher' },
            { status: 500 }
        );
    }
}
