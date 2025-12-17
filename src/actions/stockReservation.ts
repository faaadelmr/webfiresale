"use server";

import prisma from '@/lib/prisma';

// Duration for flash sale reservation (in minutes) - e.g., 15 minutes to complete checkout
const FLASHSALE_RESERVATION_DURATION_MINUTES = 15;
// Duration for auction winner reservation (in hours) - 24 hours to complete checkout
const AUCTION_RESERVATION_DURATION_HOURS = 24;

export interface ReservationResult {
    success: boolean;
    reservationId?: string;
    message: string;
    expiresAt?: Date;
}

/**
 * Create a stock reservation for flash sale item when entering checkout
 */
export async function createFlashSaleReservation(
    userId: string,
    flashSaleId: string,
    quantity: number
): Promise<ReservationResult> {
    try {
        // Check if flash sale exists and is active
        const flashSale = await prisma.flashSale.findUnique({
            where: { id: flashSaleId },
        });

        if (!flashSale) {
            return { success: false, message: 'Flash sale not found' };
        }

        if (flashSale.status !== 'active') {
            return { success: false, message: 'Flash sale is not active' };
        }

        // Check available stock (limitedQuantity - sold - active reservations)
        const activeReservations = await prisma.stockReservation.aggregate({
            where: {
                flashSaleId,
                status: 'active',
                expiresAt: { gt: new Date() },
            },
            _sum: { quantity: true },
        });

        const reservedQuantity = activeReservations._sum.quantity || 0;
        const availableStock = flashSale.limitedQuantity - flashSale.sold - reservedQuantity;

        if (quantity > availableStock) {
            return {
                success: false,
                message: `Insufficient stock. Only ${availableStock} items available.`
            };
        }

        // Check if user already has an active reservation for this flash sale
        const existingReservation = await prisma.stockReservation.findFirst({
            where: {
                userId,
                flashSaleId,
                status: 'active',
                expiresAt: { gt: new Date() },
            },
        });

        if (existingReservation) {
            // Update existing reservation
            const expiresAt = new Date(Date.now() + FLASHSALE_RESERVATION_DURATION_MINUTES * 60 * 1000);
            await prisma.stockReservation.update({
                where: { id: existingReservation.id },
                data: { quantity, expiresAt, updatedAt: new Date() },
            });

            return {
                success: true,
                reservationId: existingReservation.id,
                message: 'Reservation updated',
                expiresAt,
            };
        }

        // Create new reservation
        const expiresAt = new Date(Date.now() + FLASHSALE_RESERVATION_DURATION_MINUTES * 60 * 1000);
        const reservation = await prisma.stockReservation.create({
            data: {
                userId,
                flashSaleId,
                quantity,
                type: 'flashsale',
                status: 'active',
                expiresAt,
            },
        });

        return {
            success: true,
            reservationId: reservation.id,
            message: 'Stock reserved successfully',
            expiresAt,
        };
    } catch (error) {
        console.error('Error creating flash sale reservation:', error);
        return { success: false, message: 'Failed to create reservation' };
    }
}

/**
 * Create a stock reservation for auction winner
 */
export async function createAuctionReservation(
    userId: string,
    auctionId: string
): Promise<ReservationResult> {
    try {
        // Check if auction exists
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: { product: true },
        });

        if (!auction) {
            return { success: false, message: 'Auction not found' };
        }

        // Verify user is the winner (highest bidder or Buy Now user)
        const highestBid = await prisma.bid.findFirst({
            where: { auctionId },
            orderBy: { amount: 'desc' },
        });

        if (!highestBid || highestBid.userId !== userId) {
            return { success: false, message: 'You are not the auction winner' };
        }

        // Check if reservation already exists
        const existingReservation = await prisma.stockReservation.findFirst({
            where: {
                auctionId,
                status: 'active',
            },
        });

        if (existingReservation) {
            return {
                success: true,
                reservationId: existingReservation.id,
                message: 'Reservation already exists',
                expiresAt: existingReservation.expiresAt,
            };
        }

        // Create reservation with 24-hour expiry
        const expiresAt = new Date(Date.now() + AUCTION_RESERVATION_DURATION_HOURS * 60 * 60 * 1000);
        const reservation = await prisma.stockReservation.create({
            data: {
                userId,
                auctionId,
                productId: auction.productId,
                quantity: 1,
                type: 'auction',
                status: 'active',
                expiresAt,
            },
        });

        return {
            success: true,
            reservationId: reservation.id,
            message: 'Auction stock reserved for 24 hours',
            expiresAt,
        };
    } catch (error) {
        console.error('Error creating auction reservation:', error);
        return { success: false, message: 'Failed to create reservation' };
    }
}

/**
 * Complete a reservation (called when order is created successfully)
 */
export async function completeReservation(reservationId: string): Promise<boolean> {
    try {
        await prisma.stockReservation.update({
            where: { id: reservationId },
            data: { status: 'completed' },
        });
        return true;
    } catch (error) {
        console.error('Error completing reservation:', error);
        return false;
    }
}

/**
 * Cancel a reservation and return stock
 */
export async function cancelReservation(reservationId: string): Promise<boolean> {
    try {
        await prisma.stockReservation.update({
            where: { id: reservationId },
            data: { status: 'cancelled' },
        });
        return true;
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        return false;
    }
}

/**
 * Cancel all user's active reservations for a specific flash sale
 */
export async function cancelFlashSaleReservations(
    userId: string,
    flashSaleId: string
): Promise<boolean> {
    try {
        await prisma.stockReservation.updateMany({
            where: {
                userId,
                flashSaleId,
                status: 'active',
            },
            data: { status: 'cancelled' },
        });
        return true;
    } catch (error) {
        console.error('Error cancelling flash sale reservations:', error);
        return false;
    }
}

/**
 * Process expired reservations - should be called periodically (e.g., via cron job)
 */
export async function processExpiredReservations(): Promise<number> {
    try {
        const result = await prisma.stockReservation.updateMany({
            where: {
                status: 'active',
                expiresAt: { lt: new Date() },
            },
            data: { status: 'expired' },
        });

        return result.count;
    } catch (error) {
        console.error('Error processing expired reservations:', error);
        return 0;
    }
}

/**
 * Get available stock for flash sale (considering active reservations)
 */
export async function getAvailableFlashSaleStock(flashSaleId: string): Promise<number> {
    try {
        const flashSale = await prisma.flashSale.findUnique({
            where: { id: flashSaleId },
        });

        if (!flashSale) return 0;

        // Get total reserved quantity
        const activeReservations = await prisma.stockReservation.aggregate({
            where: {
                flashSaleId,
                status: 'active',
                expiresAt: { gt: new Date() },
            },
            _sum: { quantity: true },
        });

        const reservedQuantity = activeReservations._sum.quantity || 0;
        return Math.max(0, flashSale.limitedQuantity - flashSale.sold - reservedQuantity);
    } catch (error) {
        console.error('Error getting available stock:', error);
        return 0;
    }
}

/**
 * Restore stock when order is cancelled
 */
export async function restoreStockFromCancelledOrder(orderId: string): Promise<boolean> {
    try {
        // Get order items
        const orderItems = await prisma.orderItem.findMany({
            where: { orderId },
            include: { product: true },
        });

        // For each item, check if it was a flash sale item and restore stock
        for (const item of orderItems) {
            // Find if there was a flash sale for this product
            const flashSale = await prisma.flashSale.findFirst({
                where: {
                    productId: item.productId,
                    status: { in: ['active', 'sold-out'] },
                },
            });

            if (flashSale) {
                // Decrease sold count
                await prisma.flashSale.update({
                    where: { id: flashSale.id },
                    data: {
                        sold: { decrement: item.quantity },
                        status: flashSale.sold - item.quantity < flashSale.limitedQuantity ? 'active' : flashSale.status,
                    },
                });
            }

            // Restore product quantity
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    quantityAvailable: { increment: item.quantity },
                },
            });
        }

        return true;
    } catch (error) {
        console.error('Error restoring stock from cancelled order:', error);
        return false;
    }
}
