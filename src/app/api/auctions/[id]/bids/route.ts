import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

// ==========================================
// AUCTION ANTI-FRAUD CONFIGURATION
// ==========================================
const AUCTION_CONFIG = {
    // Minimum bid increment (5% of current bid or minBid, whichever is higher)
    MIN_INCREMENT_PERCENTAGE: 0.05,
    // Absolute minimum increment (to prevent micro-bidding on small items)
    MIN_INCREMENT_ABSOLUTE: 1000, // Rp 1.000
    // Anti-sniping: extend auction if bid comes in last X minutes
    ANTI_SNIPE_THRESHOLD_MINUTES: 5,
    // Anti-sniping: extend by X minutes
    ANTI_SNIPE_EXTENSION_MINUTES: 3,
    // Rate limiting: max bids per user per auction per hour
    MAX_BIDS_PER_HOUR: 20,
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate minimum valid bid based on current bid
 * Uses percentage or absolute minimum, whichever is higher
 */
function calculateMinimumBid(currentBid: number, minBid: number): number {
    const percentageIncrement = currentBid * AUCTION_CONFIG.MIN_INCREMENT_PERCENTAGE;
    const increment = Math.max(percentageIncrement, AUCTION_CONFIG.MIN_INCREMENT_ABSOLUTE);
    return Math.ceil(currentBid + increment);
}

/**
 * Check if auction is in anti-snipe window
 */
function isInAntiSnipeWindow(endDate: Date): boolean {
    const now = new Date();
    const timeLeft = endDate.getTime() - now.getTime();
    const thresholdMs = AUCTION_CONFIG.ANTI_SNIPE_THRESHOLD_MINUTES * 60 * 1000;
    return timeLeft > 0 && timeLeft <= thresholdMs;
}

/**
 * Calculate new end date with anti-snipe extension
 */
function calculateExtendedEndDate(currentEndDate: Date): Date {
    const extension = AUCTION_CONFIG.ANTI_SNIPE_EXTENSION_MINUTES * 60 * 1000;
    return new Date(currentEndDate.getTime() + extension);
}

// ==========================================
// API ROUTES
// ==========================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bids = await prisma.bid.findMany({
            where: {
                auctionId: id,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: [
                { amount: 'desc' },
                { createdAt: 'asc' }, // FIFO for same amount (first bid wins if tie)
            ],
        });

        const transformedBids = bids.map((bid: typeof bids[number]) => ({
            auctionId: bid.auctionId,
            user: bid.user.name || 'Anonymous',
            amount: Number(bid.amount),
            date: bid.createdAt,
        }));

        return new Response(JSON.stringify(transformedBids), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching bids:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        // ==========================================
        // 1. AUTHENTICATION CHECK
        // ==========================================
        if (!session || !session.user) {
            return new Response(JSON.stringify({ message: 'Anda harus login untuk memasang tawaran' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.amount) {
            return new Response(JSON.stringify({ message: 'Jumlah tawaran harus diisi' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const bidAmount = Number(data.amount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            return new Response(JSON.stringify({ message: 'Jumlah tawaran tidak valid' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ==========================================
        // 2. FETCH AUCTION WITH OPTIMISTIC LOCKING
        // ==========================================
        // Use transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Get auction with lock
            const auction = await tx.auction.findUnique({
                where: { id },
            });

            if (!auction) {
                throw new Error('AUCTION_NOT_FOUND');
            }

            // ==========================================
            // 3. AUCTION STATUS VALIDATION
            // ==========================================
            if (auction.status !== 'active') {
                throw new Error('AUCTION_NOT_ACTIVE');
            }

            const now = new Date();
            if (now >= auction.endDate) {
                throw new Error('AUCTION_ENDED');
            }

            if (now < auction.startDate) {
                throw new Error('AUCTION_NOT_STARTED');
            }

            // ==========================================
            // 4. RATE LIMITING CHECK
            // ==========================================
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const recentBidsCount = await tx.bid.count({
                where: {
                    auctionId: id,
                    userId: session.user.id,
                    createdAt: { gte: oneHourAgo },
                },
            });

            if (recentBidsCount >= AUCTION_CONFIG.MAX_BIDS_PER_HOUR) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            }

            // ==========================================
            // 5. BID AMOUNT VALIDATION (MINIMUM INCREMENT)
            // ==========================================
            const currentBid = auction.currentBid ? Number(auction.currentBid) : Number(auction.minBid);
            const minimumBid = calculateMinimumBid(currentBid, Number(auction.minBid));

            // For Buy Now, allow exact maxBid amount
            const isBuyNow = data.isBuyNow === true && auction.maxBid && bidAmount >= Number(auction.maxBid);

            if (!isBuyNow) {
                if (bidAmount < minimumBid) {
                    throw new Error(`MINIMUM_BID:${minimumBid}`);
                }

                // Prevent bid higher than maxBid (must use Buy Now)
                if (auction.maxBid && bidAmount >= Number(auction.maxBid)) {
                    throw new Error(`USE_BUY_NOW:${Number(auction.maxBid)}`);
                }
            }

            // ==========================================
            // 6. SELF-BIDDING PREVENTION
            // ==========================================
            // Get the current highest bidder
            const highestBid = await tx.bid.findFirst({
                where: { auctionId: id },
                orderBy: { amount: 'desc' },
            });

            if (highestBid && highestBid.userId === session.user.id && !isBuyNow) {
                throw new Error('ALREADY_HIGHEST_BIDDER');
            }

            // ==========================================
            // 7. CREATE BID
            // ==========================================
            const bid = await tx.bid.create({
                data: {
                    auctionId: id,
                    userId: session.user.id,
                    amount: new Decimal(bidAmount),
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // ==========================================
            // 8. ANTI-SNIPING: EXTEND AUCTION IF NEEDED
            // ==========================================
            let newEndDate = auction.endDate;
            let wasExtended = false;

            if (!isBuyNow && isInAntiSnipeWindow(auction.endDate)) {
                newEndDate = calculateExtendedEndDate(auction.endDate);
                wasExtended = true;
            }

            // ==========================================
            // 9. UPDATE AUCTION
            // ==========================================
            const updatedAuction = await tx.auction.update({
                where: { id },
                data: {
                    currentBid: new Decimal(bidAmount),
                    bidCount: { increment: 1 },
                    ...(isBuyNow && { status: 'sold' }),
                    ...(wasExtended && { endDate: newEndDate }),
                },
            });

            return {
                bid,
                auction: updatedAuction,
                isBuyNow,
                wasExtended,
                newEndDate: wasExtended ? newEndDate : null,
                minimumBid,
            };
        });

        // ==========================================
        // 10. SUCCESS RESPONSE
        // ==========================================
        let message = 'Tawaran berhasil ditempatkan!';
        if (result.isBuyNow) {
            message = 'Pembelian langsung berhasil!';
        } else if (result.wasExtended) {
            message = `Tawaran berhasil! Waktu lelang diperpanjang ${AUCTION_CONFIG.ANTI_SNIPE_EXTENSION_MINUTES} menit.`;
        }

        return new Response(JSON.stringify({
            message,
            bid: {
                auctionId: result.bid.auctionId,
                user: result.bid.user.name || 'Anonymous',
                amount: Number(result.bid.amount),
                date: result.bid.createdAt,
            },
            isBuyNow: result.isBuyNow || false,
            auctionStatus: result.auction.status,
            wasExtended: result.wasExtended,
            newEndDate: result.newEndDate,
            nextMinimumBid: calculateMinimumBid(Number(result.bid.amount), Number(result.auction.minBid)),
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error placing bid:', error);

        // ==========================================
        // ERROR HANDLING WITH USER-FRIENDLY MESSAGES
        // ==========================================
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Parse custom error messages
        if (errorMessage === 'AUCTION_NOT_FOUND') {
            return new Response(JSON.stringify({ message: 'Lelang tidak ditemukan' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (errorMessage === 'AUCTION_NOT_ACTIVE') {
            return new Response(JSON.stringify({ message: 'Lelang tidak aktif' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (errorMessage === 'AUCTION_ENDED') {
            return new Response(JSON.stringify({ message: 'Lelang telah berakhir' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (errorMessage === 'AUCTION_NOT_STARTED') {
            return new Response(JSON.stringify({ message: 'Lelang belum dimulai' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
            return new Response(JSON.stringify({
                message: `Anda sudah mencapai batas maksimal ${AUCTION_CONFIG.MAX_BIDS_PER_HOUR} tawaran per jam. Silakan tunggu beberapa saat.`
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (errorMessage.startsWith('MINIMUM_BID:')) {
            const minBid = errorMessage.split(':')[1];
            return new Response(JSON.stringify({
                message: `Tawaran minimum adalah Rp ${Number(minBid).toLocaleString('id-ID')}. Kenaikan minimal 5% atau Rp 1.000.`,
                minimumBid: Number(minBid),
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (errorMessage.startsWith('USE_BUY_NOW:')) {
            const maxBid = errorMessage.split(':')[1];
            return new Response(JSON.stringify({
                message: `Tawaran melebihi harga beli langsung. Gunakan tombol "Beli Sekarang" untuk membeli dengan harga Rp ${Number(maxBid).toLocaleString('id-ID')}.`,
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (errorMessage === 'ALREADY_HIGHEST_BIDDER') {
            return new Response(JSON.stringify({
                message: 'Anda sudah menjadi penawar tertinggi. Tunggu ada penawar lain sebelum menaikkan tawaran.',
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({
            message: 'Terjadi kesalahan saat memproses tawaran',
            error: errorMessage
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
