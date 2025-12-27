// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products - Get all products
export async function GET() {
  try {
    // Get all products from the database
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get active reservations for products (type: 'product')
    const activeReservations = await prisma.stockReservation.groupBy({
      by: ['productId'],
      where: {
        type: 'product',
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      _sum: {
        quantity: true,
      },
    });

    // Create a map of productId -> reserved quantity
    const reservedQuantityMap = new Map<string, number>();
    activeReservations.forEach((reservation) => {
      if (reservation.productId) {
        reservedQuantityMap.set(
          reservation.productId,
          reservation._sum.quantity || 0
        );
      }
    });

    // Convert Decimal values to numbers and adjust quantity for reservations
    const productsWithNumericValues = products.map(product => {
      const reservedQty = reservedQuantityMap.get(product.id) || 0;
      const availableStock = Math.max(0, product.quantityAvailable - reservedQty);

      return {
        ...product,
        originalPrice: Number(product.originalPrice),
        quantityAvailable: availableStock, // Adjusted for active reservations
        actualQuantity: product.quantityAvailable, // Original quantity for reference
      };
    });

    return NextResponse.json(productsWithNumericValues, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}