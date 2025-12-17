import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auction = await prisma.auction.findUnique({
            where: { id },
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
        });

        if (!auction) {
            return new Response(JSON.stringify({ message: 'Auction not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const highestBid = auction.bids.length > 0 ? Number(auction.bids[0].amount) : Number(auction.minBid);

        const transformedAuction = {
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
                user: bid.user.name || bid.user.email || 'Anonymous',
                amount: Number(bid.amount),
                date: bid.createdAt,
            })),
        };

        return new Response(JSON.stringify(transformedAuction), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching auction:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        // Check if user is admin or superadmin
        if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await request.json();

        // Update auction
        const updateData: any = {};

        if (data.status !== undefined) updateData.status = data.status;
        if (data.minBid !== undefined) updateData.minBid = new Decimal(data.minBid);
        if (data.maxBid !== undefined) updateData.maxBid = data.maxBid ? new Decimal(data.maxBid) : null;
        if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
        if (data.currentBid !== undefined) updateData.currentBid = new Decimal(data.currentBid);

        const auction = await prisma.auction.update({
            where: { id },
            data: updateData,
        });

        return new Response(JSON.stringify({
            message: 'Auction updated successfully',
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
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating auction:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        // Check if user is admin or superadmin
        if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await prisma.auction.delete({
            where: { id },
        });

        return new Response(JSON.stringify({
            message: 'Auction deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error deleting auction:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
