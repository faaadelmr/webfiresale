import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import type { AddressDetails } from '@/lib/types';
import { enrichAddressWithNames } from '@/lib/region-utils';

export async function GET(request: NextRequest) {
  // Get user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.user.id;

  try {
    // Get user's addresses from the database
    const userAddresses = await prisma.address.findMany({
      where: { userId },
    });

    // Enrich addresses with region names
    const enrichedAddresses = userAddresses.map(addr => enrichAddressWithNames(addr));

    return new Response(JSON.stringify(enrichedAddresses), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest) {
  // Get user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.user.id;
  const addressData: Omit<AddressDetails, 'id' | 'createdAt' | 'updatedAt'> = await request.json();

  try {
    // If this is the user's first address, set it as primary
    const existingAddresses = await prisma.address.findMany({
      where: { userId },
    });
    const isFirstAddress = existingAddresses.length === 0;

    // Create the new address (only with IDs, no names)
    const newAddress = await prisma.address.create({
      data: {
        userId,
        name: addressData.fullName,
        street: addressData.street,
        rtRwBlock: addressData.rtRwBlock,
        postalCode: addressData.postalCode,
        phone: addressData.phone,
        label: addressData.label,
        notes: addressData.notes || "",
        isDefault: isFirstAddress || addressData.isPrimary,
        provinceId: addressData.provinceId,
        cityId: addressData.cityId,
        districtId: addressData.districtId,
        villageId: addressData.villageId,
      },
    });

    // Get updated list of addresses and enrich
    const updatedAddresses = await prisma.address.findMany({
      where: { userId },
    });
    const enrichedAddresses = updatedAddresses.map(addr => enrichAddressWithNames(addr));

    return new Response(JSON.stringify({
      address: enrichAddressWithNames(newAddress),
      addresses: enrichedAddresses
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving address:', error);
    return new Response(JSON.stringify({ message: 'Error saving address' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: NextRequest) {
  // Get user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.user.id;
  const addressData: AddressDetails = await request.json();

  try {
    // Update the address (only with IDs, no names)
    const updatedAddress = await prisma.address.update({
      where: {
        id: addressData.id,
        userId: userId,
      },
      data: {
        name: addressData.fullName,
        street: addressData.street,
        rtRwBlock: addressData.rtRwBlock,
        postalCode: addressData.postalCode,
        phone: addressData.phone,
        label: addressData.label,
        notes: addressData.notes || "",
        provinceId: addressData.provinceId,
        cityId: addressData.cityId,
        districtId: addressData.districtId,
        villageId: addressData.villageId,
      },
    });

    // Get updated list of addresses and enrich
    const updatedAddresses = await prisma.address.findMany({
      where: { userId },
    });
    const enrichedAddresses = updatedAddresses.map(addr => enrichAddressWithNames(addr));

    return new Response(JSON.stringify({
      address: enrichAddressWithNames(updatedAddress),
      addresses: enrichedAddresses
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return new Response(JSON.stringify({ message: 'Error updating address' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request: NextRequest) {
  // Get user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const addressId = searchParams.get('id');

  if (!addressId) {
    return new Response(JSON.stringify({ message: 'Address ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.user.id;

  try {
    // Delete the address
    await prisma.address.delete({
      where: {
        id: addressId,
        userId: userId, // Ensure user can only delete their own address
      },
    });

    // Get updated list of addresses and enrich
    const updatedAddresses = await prisma.address.findMany({
      where: { userId },
    });
    const enrichedAddresses = updatedAddresses.map(addr => enrichAddressWithNames(addr));

    return new Response(JSON.stringify(enrichedAddresses), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return new Response(JSON.stringify({ message: 'Error deleting address' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}