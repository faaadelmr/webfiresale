import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

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
            orderBy: {
                amount: 'desc',
            },
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

        if (!session || !session.user) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.amount) {
            return new Response(JSON.stringify({ message: 'Missing bid amount' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if auction exists and is active
        const auction = await prisma.auction.findUnique({
            where: { id },
        });

        if (!auction) {
            return new Response(JSON.stringify({ message: 'Auction not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (auction.status !== 'active') {
            return new Response(JSON.stringify({ message: 'Auction is not active' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if auction has ended by time (race condition prevention)
        if (new Date() >= auction.endDate) {
            return new Response(JSON.stringify({ message: 'Auction has ended' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if bid is higher than current bid
        const currentHighestBid = auction.currentBid ? Number(auction.currentBid) : Number(auction.minBid);
        if (data.amount <= currentHighestBid) {
            return new Response(JSON.stringify({
                message: `Bid must be higher than current bid (${currentHighestBid})`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Create bid and update auction in a transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create the bid
            const bid = await tx.bid.create({
                data: {
                    auctionId: id,
                    userId: session.user.id,
                    amount: new Decimal(data.amount),
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

            // Check if this is a Buy Now transaction
            const isBuyNow = data.isBuyNow === true && auction.maxBid && data.amount >= Number(auction.maxBid);

            // Update auction with new highest bid
            const updatedAuction = await tx.auction.update({
                where: { id },
                data: {
                    currentBid: new Decimal(data.amount),
                    bidCount: {
                        increment: 1,
                    },
                    // If Buy Now, set status to sold
                    ...(isBuyNow && { status: 'sold' }),
                },
            });

            return { bid, auction: updatedAuction, isBuyNow };
        });

        return new Response(JSON.stringify({
            message: result.isBuyNow ? 'Purchase successful' : 'Bid placed successfully',
            bid: {
                auctionId: result.bid.auctionId,
                user: result.bid.user.name || 'Anonymous',
                amount: Number(result.bid.amount),
                date: result.bid.createdAt,
            },
            isBuyNow: result.isBuyNow || false,
            auctionStatus: result.auction.status,
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error placing bid:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
