import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import {
    createFlashSaleReservation,
    createAuctionReservation,
    createProductReservation,
    cancelReservation,
    processExpiredReservations,
    getAvailableFlashSaleStock,
    getAvailableProductStock,
} from '@/actions/stockReservation';

// POST - Create a new stock reservation
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Debug logging
        console.log('Reservation API - Session:', session ? 'exists' : 'null');
        console.log('Reservation API - User:', JSON.stringify(session?.user));

        // Check if user is authenticated - support both id and email
        let userId = session?.user?.id;

        // Fallback: if no user.id, try to get user from database by email
        if (!userId && session?.user?.email) {
            try {
                const user = await prisma.user.findUnique({
                    where: { email: session.user.email }
                });
                if (user) {
                    userId = user.id;
                    console.log('Reservation API - Found user by email, id:', userId);
                }
            } catch (dbError) {
                console.error('Reservation API - Database lookup error:', dbError);
            }
        }

        if (!userId) {
            console.error('Reservation API - Unauthorized: No user ID found in session');
            return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
        }

        const data = await request.json();
        console.log('Reservation API - Request data:', JSON.stringify(data));
        const { type, flashSaleId, auctionId, productId, quantity } = data;

        if (type === 'flashsale') {
            if (!flashSaleId || !quantity) {
                return NextResponse.json(
                    { error: 'flashSaleId and quantity are required' },
                    { status: 400 }
                );
            }

            console.log('Reservation API - Creating flash sale reservation for:', { userId, flashSaleId, quantity });

            const result = await createFlashSaleReservation(
                userId,
                flashSaleId,
                quantity
            );

            console.log('Reservation API - Result:', JSON.stringify(result));

            if (!result.success) {
                return NextResponse.json({ error: result.message }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                reservationId: result.reservationId,
                expiresAt: result.expiresAt,
                message: result.message,
            });
        }

        if (type === 'auction') {
            if (!auctionId) {
                return NextResponse.json(
                    { error: 'auctionId is required' },
                    { status: 400 }
                );
            }

            const result = await createAuctionReservation(userId, auctionId);

            if (!result.success) {
                return NextResponse.json({ error: result.message }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                reservationId: result.reservationId,
                expiresAt: result.expiresAt,
                message: result.message,
            });
        }

        if (type === 'product') {
            if (!productId || !quantity) {
                return NextResponse.json(
                    { error: 'productId and quantity are required' },
                    { status: 400 }
                );
            }

            console.log('Reservation API - Creating product reservation for:', { userId, productId, quantity });

            const result = await createProductReservation(
                userId,
                productId,
                quantity
            );

            console.log('Reservation API - Result:', JSON.stringify(result));

            if (!result.success) {
                return NextResponse.json({ error: result.message }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                reservationId: result.reservationId,
                expiresAt: result.expiresAt,
                message: result.message,
            });
        }

        return NextResponse.json(
            { error: 'Invalid reservation type. Valid types: flashsale, auction, product' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error creating reservation:', error);
        return NextResponse.json(
            { error: 'Failed to create reservation' },
            { status: 500 }
        );
    }
}

// DELETE - Cancel a reservation
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reservationId = searchParams.get('id');

        if (!reservationId) {
            return NextResponse.json(
                { error: 'reservationId is required' },
                { status: 400 }
            );
        }

        const success = await cancelReservation(reservationId);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to cancel reservation' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Reservation cancelled' });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        return NextResponse.json(
            { error: 'Failed to cancel reservation' },
            { status: 500 }
        );
    }
}

// GET - Get available stock for a flash sale or product (with reservations considered)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const flashSaleId = searchParams.get('flashSaleId');
        const productId = searchParams.get('productId');
        const action = searchParams.get('action');

        // Process expired reservations (cleanup) - requires auth
        if (action === 'cleanup') {
            const authHeader = request.headers.get('authorization');
            if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const count = await processExpiredReservations();
            return NextResponse.json({
                success: true,
                message: `Processed ${count} expired reservations`
            });
        }

        // Get available stock for flash sale
        if (flashSaleId) {
            const availableStock = await getAvailableFlashSaleStock(flashSaleId);
            return NextResponse.json({
                success: true,
                availableStock
            });
        }

        // Get available stock for regular product
        if (productId) {
            const availableStock = await getAvailableProductStock(productId);
            return NextResponse.json({
                success: true,
                availableStock
            });
        }

        return NextResponse.json(
            { error: 'flashSaleId or productId is required' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error getting available stock:', error);
        return NextResponse.json(
            { error: 'Failed to get available stock' },
            { status: 500 }
        );
    }
}
