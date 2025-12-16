import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { ShippingOption } from '@/lib/types';
import prisma from '@/lib/prisma';
import { enrichAddressWithNames } from '@/lib/region-utils';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('No valid session found for checkout data request');
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user.id;
    console.log('Fetching addresses for user:', userId);

    // Check if the user exists first to verify session is valid
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.log('User not found in database:', userId);
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's addresses from the database
    const userAddresses = await prisma.address.findMany({
      where: { userId },
    });

    // Enrich addresses with region names
    const enrichedAddresses = userAddresses.map(addr => enrichAddressWithNames(addr));

    // Get shipping options from the database
    const shippingOptionsRaw = await prisma.shippingOption.findMany();
    const shippingOptions = shippingOptionsRaw.map(option => ({
      ...option,
      cost: Number(option.cost), // Convert Decimal to number
    }));

    console.log(`Found ${userAddresses.length} addresses for user ${userId}`);

    return new Response(JSON.stringify({
      addresses: enrichedAddresses,
      shippingOptions,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching checkout data:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('P1001')) {
        // Prisma error: "Can't reach database server"
        console.error('Database connection error');
        return new Response(JSON.stringify({
          message: 'Database connection error',
          error: error.message
        }), {
          status: 503, // Service Unavailable
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (error.message.includes('P2003')) {
        // Foreign key constraint error
        console.error('Foreign key constraint error');
        return new Response(JSON.stringify({
          message: 'Data constraint error',
          error: error.message
        }), {
          status: 400, // Bad Request
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response(JSON.stringify({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}