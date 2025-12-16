import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { enrichAddressWithNames } from '@/lib/region-utils';

// GET route to fetch all addresses for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the user by ID instead of email for better security
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Fetch all addresses for the user
    const addresses = await prisma.address.findMany({
      where: { userId: user.id }
    });

    // Enrich addresses with region names
    const enrichedAddresses = addresses.map(addr => enrichAddressWithNames(addr));

    return new Response(JSON.stringify(enrichedAddresses), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return new Response('Internal server error', { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST route to create a new address
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      name,  // Receive the name as a single field from frontend
      phone,
      street,
      postalCode,
      label,
      notes,
      isDefault,
      rtRwBlock,
      provinceId,
      cityId,
      districtId,
      villageId
    } = body;

    // Get the user by ID instead of email for better security
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If this is a default address, unset the current default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create the new address (only with IDs, no names)
    const newAddress = await prisma.address.create({
      data: {
        user: {
          connect: { id: user.id }
        },
        name: name || 'Default Name',
        phone: phone || '',
        street,
        rtRwBlock: rtRwBlock || '',
        postalCode,
        label: label || null,
        notes: notes || null,
        isDefault: isDefault || false,
        provinceId: provinceId || null,
        cityId: cityId || null,
        districtId: districtId || null,
        villageId: villageId || null
      }
    });

    // Enrich with names before returning
    const enrichedAddress = enrichAddressWithNames(newAddress);

    return new Response(JSON.stringify(enrichedAddress), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return new Response(JSON.stringify({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT route to update an existing address
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      id,
      name,  // Receive the name as a single field from frontend
      phone,
      street,
      postalCode,
      label,
      notes,
      isDefault,
      rtRwBlock,
      provinceId,
      cityId,
      districtId,
      villageId
    } = body;

    // Get the user by ID instead of email for better security
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the address belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingAddress) {
      return new Response(JSON.stringify({ message: 'Address not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If this is being set as default, unset the current default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Update the address (only with IDs, no names)
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        name: name || 'Default Name',
        phone: phone || '',
        street,
        rtRwBlock: rtRwBlock || '',
        postalCode,
        label: label || null,
        notes: notes || null,
        isDefault: isDefault || false,
        provinceId: provinceId || null,
        cityId: cityId || null,
        districtId: districtId || null,
        villageId: villageId || null
      }
    });

    // Enrich with names before returning
    const enrichedAddress = enrichAddressWithNames(updatedAddress);

    return new Response(JSON.stringify(enrichedAddress), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return new Response(JSON.stringify({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE route to delete an address
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ message: 'Address ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the user by ID instead of email for better security
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the address belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingAddress) {
      return new Response(JSON.stringify({ message: 'Address not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if address is being used in any orders
    const ordersUsingAddress = await prisma.order.findMany({
      where: { addressId: id },
      select: { id: true }
    });

    if (ordersUsingAddress.length > 0) {
      return new Response(JSON.stringify({
        message: 'Alamat tidak dapat dihapus karena masih digunakan di pesanan',
        detail: `Alamat ini digunakan di ${ordersUsingAddress.length} pesanan. Alamat hanya bisa dihapus jika belum pernah digunakan untuk pemesanan.`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the address
    await prisma.address.delete({
      where: { id }
    });

    return new Response(JSON.stringify({ message: 'Address deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting address:', error);

    // Handle Prisma foreign key constraint error
    if (error instanceof Error && error.message.includes('P2003')) {
      return new Response(JSON.stringify({
        message: 'Alamat tidak dapat dihapus karena masih digunakan di pesanan',
        detail: 'Alamat ini masih terhubung dengan data pesanan. Alamat hanya bisa dihapus jika belum pernah digunakan.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}