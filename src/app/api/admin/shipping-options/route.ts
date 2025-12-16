import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import type { ShippingOption } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin privileges
    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if the user has admin privileges
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all shipping options from the database
    const shippingOptions = await prisma.shippingOption.findMany();

    // Convert the cost from Decimal to number for frontend compatibility
    const formattedOptions = shippingOptions.map(option => ({
      ...option,
      cost: Number(option.cost),
    }));

    return new Response(JSON.stringify(formattedOptions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching shipping options:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin privileges
    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if the user has admin privileges
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const shippingOptionData: Omit<ShippingOption, 'id'> = await request.json();

    // Create the new shipping option
    const newShippingOption = await prisma.shippingOption.create({
      data: {
        cityId: shippingOptionData.cityId,
        cost: shippingOptionData.cost,
      },
    });

    return new Response(JSON.stringify({ ...newShippingOption, cost: Number(newShippingOption.cost) }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating shipping option:', error);
    return new Response(JSON.stringify({ message: 'Error creating shipping option' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin privileges
    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if the user has admin privileges
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const shippingOptionData: ShippingOption = await request.json();

    // Update the shipping option
    const updatedShippingOption = await prisma.shippingOption.update({
      where: {
        id: shippingOptionData.id,
      },
      data: {
        cityId: shippingOptionData.cityId,
        cost: shippingOptionData.cost,
      },
    });

    return new Response(JSON.stringify({ ...updatedShippingOption, cost: Number(updatedShippingOption.cost) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating shipping option:', error);
    return new Response(JSON.stringify({ message: 'Error updating shipping option' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin privileges
    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if the user has admin privileges
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ message: 'Shipping option ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the shipping option
    await prisma.shippingOption.delete({
      where: {
        id,
      },
    });

    return new Response(JSON.stringify({ message: 'Shipping option deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting shipping option:', error);
    return new Response(JSON.stringify({ message: 'Error deleting shipping option' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}