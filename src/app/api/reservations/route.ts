import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    createFlashSaleReservation,
    createAuctionReservation,
    cancelReservation,
    processExpiredReservations,
    getAvailableFlashSaleStock,
} from '@/actions/stockReservation';

// POST - Create a new stock reservation
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { type, flashSaleId, auctionId, quantity } = data;

        if (type === 'flashsale') {
            if (!flashSaleId || !quantity) {
                return NextResponse.json(
                    { error: 'flashSaleId and quantity are required' },
                    { status: 400 }
                );
            }

            const result = await createFlashSaleReservation(
                session.user.id,
                flashSaleId,
                quantity
            );

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

            const result = await createAuctionReservation(session.user.id, auctionId);

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
            { error: 'Invalid reservation type' },
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

// GET - Get available stock for a flash sale (with reservations considered)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const flashSaleId = searchParams.get('flashSaleId');
        const action = searchParams.get('action');

        // Process expired reservations (cleanup)
        if (action === 'cleanup') {
            const count = await processExpiredReservations();
            return NextResponse.json({
                success: true,
                message: `Processed ${count} expired reservations`
            });
        }

        if (!flashSaleId) {
            return NextResponse.json(
                { error: 'flashSaleId is required' },
                { status: 400 }
            );
        }

        const availableStock = await getAvailableFlashSaleStock(flashSaleId);

        return NextResponse.json({
            success: true,
            availableStock
        });
    } catch (error) {
        console.error('Error getting available stock:', error);
        return NextResponse.json(
            { error: 'Failed to get available stock' },
            { status: 500 }
        );
    }
}
