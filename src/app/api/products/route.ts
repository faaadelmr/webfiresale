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

    // Convert Decimal values to numbers for client compatibility
    const productsWithNumericValues = products.map(product => ({
      ...product,
      originalPrice: Number(product.originalPrice),
    }));

    return NextResponse.json(productsWithNumericValues, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  }
}