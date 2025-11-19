import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET route to fetch all addresses for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Fetch all addresses for the user
    const addresses = await prisma.address.findMany({
      where: { userId: user.id }
    });

    return new Response(JSON.stringify(addresses), {
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
    
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, street, city, state, postalCode, country, label, notes, isDefault } = body;

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // If this is a default address, unset the current default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create the new address
    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        phone: phone || '',
        street,
        city,
        state,
        postalCode,
        country,
        label: label || null,
        notes: notes || null,
        isDefault: isDefault || false
      }
    });

    return new Response(JSON.stringify(newAddress), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return new Response('Internal server error', { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT route to update an existing address
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { id, firstName, lastName, phone, street, city, state, postalCode, country, label, notes, isDefault } = body;

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Verify the address belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingAddress) {
      return new Response('Address not found', { status: 404 });
    }

    // If this is being set as default, unset the current default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Update the address
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone: phone || '',
        street,
        city,
        state,
        postalCode,
        country,
        label: label || null,
        notes: notes || null,
        isDefault: isDefault || false
      }
    });

    return new Response(JSON.stringify(updatedAddress), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return new Response('Internal server error', { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE route to delete an address
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Address ID is required', { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Verify the address belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingAddress) {
      return new Response('Address not found', { status: 404 });
    }

    // Delete the address
    await prisma.address.delete({
      where: { id }
    });

    return new Response('Address deleted successfully', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return new Response('Internal server error', { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}