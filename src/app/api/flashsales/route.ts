import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';
        const forCart = searchParams.get('forCart') === 'true';

        const now = new Date();

        // Build query conditions
        const whereConditions: any = {};

        if (activeOnly) {
            whereConditions.status = 'active';
            whereConditions.startDate = { lte: now };
            whereConditions.endDate = { gt: now };
        }

        // Fetch flash sales with product details
        const flashSales = await prisma.flashSale.findMany({
            where: whereConditions,
            include: {
                product: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // If forCart is true, transform to CartProduct format with reservation-aware stock
        if (forCart) {
            // Get active reservations for all flash sales (with fallback if model not generated yet)
            const flashSaleIds = flashSales.map((fs: typeof flashSales[number]) => fs.id);
            let reservedMap = new Map<string, number>();

            try {
                const activeReservations = await prisma.stockReservation.groupBy({
                    by: ['flashSaleId'],
                    where: {
                        flashSaleId: { in: flashSaleIds },
                        status: 'active',
                        expiresAt: { gt: new Date() },
                    },
                    _sum: {
                        quantity: true,
                    },
                });

                // Create a map of reserved quantities
                activeReservations.forEach((r: typeof activeReservations[number]) => {
                    if (r.flashSaleId) {
                        reservedMap.set(r.flashSaleId, r._sum.quantity || 0);
                    }
                });
            } catch (error) {
                // StockReservation model might not exist yet - continue without reservations
                console.warn('StockReservation query failed, continuing without reservation data:', error);
            }

            const transformedFlashSales = flashSales.map((fs: typeof flashSales[number]) => {
                const reservedQty = reservedMap.get(fs.id) || 0;
                const availableStock = Math.max(0, fs.limitedQuantity - fs.sold - reservedQty);

                return {
                    id: fs.product.id,
                    name: fs.product.name,
                    description: fs.product.description,
                    image: fs.product.image,
                    originalPrice: Number(fs.product.originalPrice),
                    quantity: fs.product.quantityAvailable,
                    weight: fs.product.weight,
                    flashSaleId: fs.id,
                    flashSalePrice: Number(fs.flashSalePrice),
                    maxOrderQuantity: fs.maxOrderQuantity,
                    limitedQuantity: fs.limitedQuantity,
                    sold: fs.sold + reservedQty, // Include reserved as "virtually sold"
                    availableStock, // Actual available stock
                    startDate: fs.startDate,
                    endDate: fs.endDate,
                };
            });
            return new Response(JSON.stringify(transformedFlashSales), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // For admin page, return FlashSale format with embedded product
        const adminFlashSales = flashSales.map((fs: typeof flashSales[number]) => ({
            id: fs.id,
            productId: fs.productId,
            flashSalePrice: Number(fs.flashSalePrice),
            startDate: fs.startDate,
            endDate: fs.endDate,
            limitedQuantity: fs.limitedQuantity,
            sold: fs.sold,
            status: fs.status,
            maxOrderQuantity: fs.maxOrderQuantity,
            product: {
                id: fs.product.id,
                name: fs.product.name,
                description: fs.product.description,
                image: fs.product.image,
                originalPrice: Number(fs.product.originalPrice),
                quantityAvailable: fs.product.quantityAvailable,
                weight: fs.product.weight,
            }
        }));

        return new Response(JSON.stringify(adminFlashSales), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching flash sales:', error);
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
        if (!data.productId || !data.flashSalePrice || !data.startDate || !data.endDate || !data.limitedQuantity) {
            return new Response(JSON.stringify({ message: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if product exists and has available stock
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            return new Response(JSON.stringify({ message: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Flash sale takes limitedQuantity items from regular stock
        const flashSaleQuantity = data.limitedQuantity;

        if (product.quantityAvailable < flashSaleQuantity) {
            return new Response(JSON.stringify({
                message: 'Insufficient stock',
                detail: `Product only has ${product.quantityAvailable} items available, but flash sale requires ${flashSaleQuantity} items.`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Use transaction to create flash sale and decrease product stock atomically
        const result = await prisma.$transaction(async (tx) => {
            // Decrease product stock
            await tx.product.update({
                where: { id: data.productId },
                data: {
                    quantityAvailable: {
                        decrement: flashSaleQuantity
                    }
                }
            });

            // Create flash sale
            const flashSale = await tx.flashSale.create({
                data: {
                    productId: data.productId,
                    flashSalePrice: new Decimal(data.flashSalePrice),
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    limitedQuantity: data.limitedQuantity,
                    sold: 0,
                    status: 'active',
                    maxOrderQuantity: data.maxOrderQuantity || null,
                },
            });

            return flashSale;
        });

        return new Response(JSON.stringify({
            message: 'Flash sale created successfully',
            flashSale: {
                id: result.id,
                productId: result.productId,
                flashSalePrice: Number(result.flashSalePrice),
                startDate: result.startDate,
                endDate: result.endDate,
                limitedQuantity: result.limitedQuantity,
                sold: result.sold,
                status: result.status,
                maxOrderQuantity: result.maxOrderQuantity,
            }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating flash sale:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
