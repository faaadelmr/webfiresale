import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';

        const now = new Date();

        // Build query conditions
        const whereConditions: any = {};

        if (activeOnly) {
            whereConditions.status = 'active';
            whereConditions.startDate = { lte: now };
            whereConditions.endDate = { gt: now };
        }

        // Fetch auctions with product details and bids
        const auctions = await prisma.auction.findMany({
            where: whereConditions,
            include: {
                product: true,
                bids: {
                    orderBy: {
                        amount: 'desc',
                    },
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform to match frontend type
        const transformedAuctions = auctions.map(auction => {
            const highestBid = auction.bids.length > 0 ? Number(auction.bids[0].amount) : Number(auction.minBid);

            return {
                id: auction.id,
                productId: auction.productId,
                product: {
                    id: auction.product.id,
                    name: auction.product.name,
                    description: auction.product.description,
                    image: auction.product.image,
                    originalPrice: Number(auction.product.originalPrice),
                    quantity: auction.product.quantityAvailable,
                    weight: auction.product.weight,
                },
                minBid: Number(auction.minBid),
                maxBid: auction.maxBid ? Number(auction.maxBid) : null,
                currentBid: highestBid,
                bidCount: auction.bidCount,
                startDate: auction.startDate,
                endDate: auction.endDate,
                status: auction.status,
                bids: auction.bids.map(bid => ({
                    auctionId: bid.auctionId,
                    user: bid.user.name || 'Anonymous',
                    amount: Number(bid.amount),
                    date: bid.createdAt,
                })),
            };
        });

        return new Response(JSON.stringify(transformedAuctions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching auctions:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is admin or superadmin
        if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.productId || !data.minBid || !data.startDate || !data.endDate) {
            return new Response(JSON.stringify({ message: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            return new Response(JSON.stringify({ message: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Create auction
        const auction = await prisma.auction.create({
            data: {
                productId: data.productId,
                minBid: new Decimal(data.minBid),
                maxBid: data.maxBid ? new Decimal(data.maxBid) : null,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                currentBid: null,
                bidCount: 0,
                status: 'active',
            },
        });

        return new Response(JSON.stringify({
            message: 'Auction created successfully',
            auction: {
                id: auction.id,
                productId: auction.productId,
                minBid: Number(auction.minBid),
                maxBid: auction.maxBid ? Number(auction.maxBid) : null,
                startDate: auction.startDate,
                endDate: auction.endDate,
                currentBid: auction.currentBid ? Number(auction.currentBid) : null,
                bidCount: auction.bidCount,
                status: auction.status,
            }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating auction:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
