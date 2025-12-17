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
        const flashSale = await prisma.flashSale.findUnique({
            where: { id },
            include: {
                product: true,
            },
        });

        if (!flashSale) {
            return new Response(JSON.stringify({ message: 'Flash sale not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Transform to match frontend type
        const transformedFlashSale = {
            id: flashSale.product.id,
            name: flashSale.product.name,
            description: flashSale.product.description,
            image: flashSale.product.image,
            originalPrice: Number(flashSale.product.originalPrice),
            quantity: flashSale.product.quantityAvailable,
            weight: flashSale.product.weight,
            flashSaleId: flashSale.id,
            flashSalePrice: Number(flashSale.flashSalePrice),
            maxOrderQuantity: flashSale.maxOrderQuantity,
            limitedQuantity: flashSale.limitedQuantity,
            sold: flashSale.sold,
            startDate: flashSale.startDate,
            endDate: flashSale.endDate,
            status: flashSale.status,
        };

        return new Response(JSON.stringify(transformedFlashSale), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching flash sale:', error);
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

        // Update flash sale
        const updateData: any = {};

        if (data.status !== undefined) updateData.status = data.status;
        if (data.flashSalePrice !== undefined) updateData.flashSalePrice = new Decimal(data.flashSalePrice);
        if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
        if (data.limitedQuantity !== undefined) updateData.limitedQuantity = data.limitedQuantity;
        if (data.maxOrderQuantity !== undefined) updateData.maxOrderQuantity = data.maxOrderQuantity;

        const flashSale = await prisma.flashSale.update({
            where: { id },
            data: updateData,
        });

        return new Response(JSON.stringify({
            message: 'Flash sale updated successfully',
            flashSale: {
                id: flashSale.id,
                productId: flashSale.productId,
                flashSalePrice: Number(flashSale.flashSalePrice),
                startDate: flashSale.startDate,
                endDate: flashSale.endDate,
                limitedQuantity: flashSale.limitedQuantity,
                sold: flashSale.sold,
                status: flashSale.status,
                maxOrderQuantity: flashSale.maxOrderQuantity,
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating flash sale:', error);
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

        await prisma.flashSale.delete({
            where: { id },
        });

        return new Response(JSON.stringify({
            message: 'Flash sale deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error deleting flash sale:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
