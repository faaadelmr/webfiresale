import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Decimal } from '@prisma/client/runtime/library';

// POST /api/vouchers/validate - Validate voucher code
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { code, cartItems, shippingCost } = body;

        if (!code) {
            return NextResponse.json(
                { valid: false, message: 'Voucher code is required' },
                { status: 400 }
            );
        }

        // Find voucher
        const voucher = await prisma.voucher.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                _count: {
                    select: { voucherUsages: true },
                },
            },
        });

        if (!voucher) {
            return NextResponse.json({
                valid: false,
                message: 'Kode voucher tidak valid',
            });
        }

        // Check if voucher is active
        if (!voucher.isActive) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher tidak aktif',
            });
        }

        // Check date validity (ignore time components for start date check to avoid timezone issues)
        const now = new Date();
        const startDate = new Date(voucher.startDate);
        const endDate = new Date(voucher.endDate);

        // Normalize to YYYY-MM-DD comparison for start date
        // If today is same as start date (ignoring time), it should be valid
        const nowString = now.toISOString().split('T')[0];
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];

        // If startDate is in the future (by date string), invalid
        if (startDateString > nowString) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher belum dapat digunakan',
            });
        }

        // If endDate is in the past (by date string), invalid. 
        // We allow usage ON the end date.
        if (endDateString < nowString) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher sudah kadaluarsa',
            });
        }

        // Check usage limit (treat 0 or null as unlimited)
        if (voucher.usageLimit && voucher.usageLimit > 0 && voucher._count.voucherUsages >= voucher.usageLimit) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher sudah mencapai batas penggunaan',
            });
        }

        // Check per-user usage limit
        if (voucher.usagePerUser && voucher.usagePerUser > 0) {
            const userUsageCount = await prisma.voucherUsage.count({
                where: {
                    voucherId: voucher.id,
                    userId: session.user.id,
                },
            });

            if (userUsageCount >= voucher.usagePerUser) {
                return NextResponse.json({
                    valid: false,
                    message: 'Anda sudah mencapai batas penggunaan voucher ini',
                });
            }
        }

        // Calculate cart total and check product types
        let cartTotal = 0;
        let hasFlashSale = false;
        let hasAuction = false;
        let hasRegular = false;

        // Track eligible total for discount calculation if restrictions apply
        let eligibleTotal = 0;

        for (const item of cartItems) {
            const price = typeof item.price === 'object' ? parseFloat(item.price.toString()) : parseFloat(item.price);
            const quantity = parseInt(item.quantity);
            const itemTotal = price * quantity;
            cartTotal += itemTotal;

            // Determine product type
            let isTypeMatch = false;

            if (item.flashSaleId) {
                hasFlashSale = true;
                // If voucher is specific, check match
                if (voucher.flashSaleOnly) isTypeMatch = true;
                if (!voucher.flashSaleOnly && !voucher.auctionOnly && !voucher.regularOnly) isTypeMatch = true; // All valid
            } else if (item.auctionId) {
                hasAuction = true;
                if (voucher.auctionOnly) isTypeMatch = true;
                if (!voucher.flashSaleOnly && !voucher.auctionOnly && !voucher.regularOnly) isTypeMatch = true;
            } else {
                hasRegular = true;
                if (voucher.regularOnly) isTypeMatch = true;
                if (!voucher.flashSaleOnly && !voucher.auctionOnly && !voucher.regularOnly) isTypeMatch = true;
            }

            if (isTypeMatch) eligibleTotal += itemTotal;
        }

        // Check minimum purchase
        if (voucher.minPurchase && parseFloat(voucher.minPurchase.toString()) > 0 && cartTotal < parseFloat(voucher.minPurchase.toString())) {
            return NextResponse.json({
                valid: false,
                message: `Minimum pembelian Rp ${parseFloat(voucher.minPurchase.toString()).toLocaleString('id-ID')}`,
            });
        }

        // Check product type restrictions
        if (voucher.flashSaleOnly && !hasFlashSale) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher ini hanya berlaku untuk produk flash sale',
            });
        }

        if (voucher.auctionOnly && !hasAuction) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher ini hanya berlaku untuk produk lelang',
            });
        }

        if (voucher.regularOnly && !hasRegular) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher ini hanya berlaku untuk produk regular',
            });
        }

        // Check per-user usage limit (moved and updated)
        if (voucher.usagePerUser && voucher.usagePerUser > 0 && session.user.id) {
            const userUsageCount = await prisma.voucherUsage.count({
                where: {
                    voucherId: voucher.id,
                    userId: session.user.id,
                },
            });

            if (userUsageCount >= voucher.usagePerUser) {
                return NextResponse.json(
                    { valid: false, message: 'Anda telah mencapai batas penggunaan voucher ini' },
                    { status: 400 }
                );
            }
        }

        // Calculate discount
        let discount = 0;

        if (voucher.discountType === 'PERCENTAGE') {
            const discountValue = parseFloat(voucher.discountValue?.toString() || '0');
            discount = (cartTotal * discountValue) / 100;

            // Apply max discount cap
            if (voucher.maxDiscount) {
                const maxDiscount = parseFloat(voucher.maxDiscount.toString());
                discount = Math.min(discount, maxDiscount);
            }
        } else if (voucher.discountType === 'FIXED_AMOUNT') {
            discount = parseFloat(voucher.discountValue?.toString() || '0');
            // Don't let discount exceed cart total
            discount = Math.min(discount, cartTotal);
        } else if (voucher.discountType === 'FREE_SHIPPING') {
            discount = parseFloat(shippingCost?.toString() || '0');
            if (voucher.maxDiscount) {
                const maxDiscount = parseFloat(voucher.maxDiscount.toString());
                discount = Math.min(discount, maxDiscount);
            }
        }

        return NextResponse.json({
            valid: true,
            message: 'Voucher berhasil diterapkan',
            voucher: {
                id: voucher.id,
                code: voucher.code,
                description: voucher.description,
                discountType: voucher.discountType,
                discountValue: voucher.discountValue ? parseFloat(voucher.discountValue.toString()) : null,
            },
            discount: Math.round(discount),
        });
    } catch (error) {
        console.error('Error validating voucher:', error);
        return NextResponse.json(
            { valid: false, message: 'Gagal memvalidasi voucher' },
            { status: 500 }
        );
    }
}
