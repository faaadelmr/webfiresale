import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { Order } from '@/lib/types';
import prisma from '@/lib/prisma';
import { mockRegions } from '@/lib/regions';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { enrichAddressWithNames } from '@/lib/region-utils';

// GET endpoint to retrieve a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user.id;

    // Check if the user exists first to verify session is valid
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch the order with related data
    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: userId, // Ensure the user can only access their own orders
      },
      include: {
        address: true,
        orderItems: {
          include: {
            product: {
              include: {
                reviews: {
                  where: {
                    userId: userId,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          }
        },
        refundDetails: true,
      },
    });

    if (!order) {
      return new Response(JSON.stringify({ message: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert Prisma Decimal to number for frontend compatibility
    const orderItems = order.orderItems.map((item: typeof order.orderItems[number]) => ({
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        image: item.product.image,
        originalPrice: Number(item.product.originalPrice),
        quantity: item.product.quantityAvailable, // Use quantityAvailable from database
        weight: item.product.weight,
        flashSalePrice: Number(item.price), // Use the price from the order item
        hasReviewed: item.product.reviews.length > 0,
      },
      quantity: item.quantity,
    }));

    // Convert refund details if exists
    let refundDetails = undefined;
    if (order.refundDetails && order.refundDetails.length > 0) {
      const refund = order.refundDetails[0]; // One order has one refund details record
      refundDetails = {
        reason: refund.reason,
        processedDate: refund.processedDate,
        bankName: refund.bankName || undefined,
        accountNumber: refund.accountNumber || undefined,
        accountName: refund.accountName || undefined,
        refundedDate: refund.refundedDate || undefined,
        refundProof: refund.refundProof || undefined,
      };
    }

    // Map the address to the AddressDetails type and enrich with names
    const enrichedAddress = enrichAddressWithNames(order.address);
    const address: any = {
      id: enrichedAddress.id,
      fullName: enrichedAddress.name,
      phone: enrichedAddress.phone,
      street: enrichedAddress.street,
      postalCode: enrichedAddress.postalCode,
      rtRwBlock: enrichedAddress.rtRwBlock,
      label: enrichedAddress.label as 'Rumah' | 'Kantor' | 'Apartemen',
      notes: enrichedAddress.notes || undefined,
      provinceId: enrichedAddress.provinceId,
      cityId: enrichedAddress.cityId,
      districtId: enrichedAddress.districtId,
      villageId: enrichedAddress.villageId,
      province: enrichedAddress.province,
      city: enrichedAddress.city,
      district: enrichedAddress.district,
      village: enrichedAddress.village,
    };

    // Construct the final order object to match the frontend type
    const orderResponse: Order = {
      id: order.id,
      customerName: order.address.name,
      customerEmail: session.user.email || '',
      customerPhone: order.address.phone,
      date: order.createdAt,
      status: order.status as any,
      total: Number(order.totalAmount),
      items: orderItems,
      address: address,
      shippingCity: order.shippingCity || enrichedAddress.city || undefined,
      shippingCost: order.shippingCost ? Number(order.shippingCost) : undefined,
      paymentProof: order.paymentProof || undefined,
      shippingCode: order.shippingCode || undefined,
      shippingName: order.shippingName || undefined,
      refundDetails: refundDetails,
      expiresAt: order.expiresAt || undefined,
    };

    return new Response(JSON.stringify(orderResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching order:', error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('P1001')) {
        // Prisma error: "Can't reach database server"
        return new Response(JSON.stringify({
          message: 'Database connection error',
          error: error.message
        }), {
          status: 503, // Service Unavailable
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

// PATCH endpoint to update order status or refund details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user.id;

    // Verify the user has permission to update this order
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!order) {
      return new Response(JSON.stringify({ message: 'Order not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await request.json();
    const { status, refundDetails, paymentProof, shippingCode, shippingName } = requestBody;

    // If updating refund details (this logic is complex so keep it separate)
    if (refundDetails) {
      // Create or update refund details
      let updatedRefundDetails;

      // Check if refund details already exist for this order
      const existingRefundDetails = await prisma.refundDetails.findFirst({
        where: { orderId: id }
      });

      if (existingRefundDetails) {
        // Update existing refund details
        updatedRefundDetails = await prisma.refundDetails.update({
          where: { id: existingRefundDetails.id },
          data: {
            reason: refundDetails.reason,
            processedDate: refundDetails.processedDate || new Date(),
            bankName: refundDetails.bankName,
            accountNumber: refundDetails.accountNumber,
            accountName: refundDetails.accountName,
          }
        });
      } else {
        // Create new refund details
        updatedRefundDetails = await prisma.refundDetails.create({
          data: {
            orderId: id,
            reason: refundDetails.reason,
            processedDate: refundDetails.processedDate || new Date(),
            bankName: refundDetails.bankName,
            accountNumber: refundDetails.accountNumber,
            accountName: refundDetails.accountName,
          }
        });
      }

      // Update order status to 'Refund Processing'
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'Refund Processing',
        },
        include: {
          refundDetails: true
        }
      });

      return new Response(JSON.stringify({
        message: 'Refund details updated successfully',
        order: updatedOrder
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If updating status, payment proof, or shipping details
    if (status || paymentProof !== undefined || shippingCode !== undefined || shippingName !== undefined) {
      // Validate status transitions for customers (non-admin users can only make certain transitions)
      if (status) {
        const allowedCustomerTransitions: Record<string, string[]> = {
          'Pending': ['Waiting for Confirmation', 'Cancelled'],
          'Waiting for Confirmation': ['Cancelled'],
          'Shipped': ['Delivered'],
          'Delivered': ['Refund Processing'],
        };

        const allowedNextStatuses = allowedCustomerTransitions[order.status] || [];
        if (!allowedNextStatuses.includes(status)) {
          return new Response(JSON.stringify({
            message: `Cannot change order status from '${order.status}' to '${status}'`
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (paymentProof !== undefined) updateData.paymentProof = paymentProof;
      if (shippingCode !== undefined) updateData.shippingCode = shippingCode;
      if (shippingName !== undefined) updateData.shippingName = shippingName;

      // Clear expiration when waiting for confirmation
      if (status === 'Waiting for Confirmation') {
        updateData.expiresAt = null;
      }

      // If cancelling the order, restore stock
      if (status === 'Cancelled' && order.status !== 'Cancelled') {
        // Get order items to restore stock
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: id },
          include: { product: true },
        });

        // Restore stock in a transaction
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          for (const item of orderItems) {
            // Restore product quantity
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantityAvailable: {
                  increment: item.quantity,
                },
              },
            });

            // Check if this was a flash sale item and restore sold count
            const flashSale = await tx.flashSale.findFirst({
              where: {
                productId: item.productId,
              },
              orderBy: {
                createdAt: 'desc',
              },
            });

            if (flashSale && flashSale.sold >= item.quantity) {
              await tx.flashSale.update({
                where: { id: flashSale.id },
                data: {
                  sold: {
                    decrement: item.quantity,
                  },
                  // If was sold-out, reactivate if there's stock
                  status: flashSale.sold - item.quantity < flashSale.limitedQuantity && flashSale.status === 'sold-out'
                    ? 'active'
                    : flashSale.status,
                },
              });
            }
          }
        });
      }

      // Update the order
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData
      });

      return new Response(JSON.stringify({
        message: 'Order updated successfully',
        order: updatedOrder
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'No update data provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating order:', error);

    return new Response(JSON.stringify({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}