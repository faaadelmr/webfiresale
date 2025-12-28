import { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { Order } from '@/lib/types';
import prisma from '@/lib/prisma';
import { CartProduct } from '@/lib/types';
import { mockRegions } from '@/lib/regions';
import { Decimal } from '@prisma/client/runtime/library';
import { enrichAddressWithNames } from '@/lib/region-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user.id;

    // Check if user is admin or superadmin to fetch all orders
    if (session.user.role === 'admin' || session.user.role === 'superadmin') {
      // Fetch all orders with related data
      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          },
          address: true,
          orderItems: {
            include: {
              product: true,
            }
          },
          refundDetails: true,
        },
        orderBy: {
          createdAt: 'desc', // Newest orders first
        }
      });

      // Transform orders to match frontend Order type
      const transformedOrders = orders.map(order => {
        // Convert Prisma Decimal to number for frontend compatibility
        const orderItems = order.orderItems.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            description: item.product.description,
            image: item.product.image,
            originalPrice: Number(item.product.originalPrice),
            quantity: item.product.quantityAvailable, // Use quantityAvailable from database
            weight: item.product.weight,
            flashSalePrice: Number(item.price), // Use the price from the order item
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

        return {
          id: order.id,
          customerName: order.user.name || order.address.name || 'N/A',
          customerEmail: order.user.email || 'N/A',
          customerPhone: order.address.phone || 'N/A',
          date: order.createdAt,
          status: order.status as any,
          total: Number(order.totalAmount),
          items: orderItems,
          address: address,
          shippingCity: order.shippingCity || undefined,
          shippingCost: order.shippingCost ? Number(order.shippingCost) : undefined,
          paymentProof: order.paymentProof || undefined,
          shippingCode: order.shippingCode || undefined,
          refundDetails: refundDetails,
          expiresAt: order.expiresAt || undefined,
        };
      });

      return new Response(JSON.stringify(transformedOrders), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // For regular customers, only fetch their orders
      const orders = await prisma.order.findMany({
        where: {
          userId: userId
        },
        include: {
          address: true,
          orderItems: {
            include: {
              product: true,
            }
          },
          refundDetails: true,
        },
        orderBy: {
          createdAt: 'desc', // Newest orders first
        }
      });

      // Transform orders to match frontend Order type (same as above)
      const transformedOrders = orders.map(order => {
        // Convert Prisma Decimal to number for frontend compatibility
        const orderItems = order.orderItems.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            description: item.product.description,
            image: item.product.image,
            originalPrice: Number(item.product.originalPrice),
            quantity: item.product.quantityAvailable, // Use quantityAvailable from database
            weight: item.product.weight,
            flashSalePrice: Number(item.price), // Use the price from the order item
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

        return {
          id: order.id,
          customerName: order.address.name,
          customerEmail: session.user.email || '',
          customerPhone: order.address.phone,
          date: order.createdAt,
          status: order.status as any,
          total: Number(order.totalAmount),
          items: orderItems,
          address: address,
          shippingCity: order.shippingCity || undefined,
          shippingCost: order.shippingCost ? Number(order.shippingCost) : undefined,
          paymentProof: order.paymentProof || undefined,
          shippingCode: order.shippingCode || undefined,
          refundDetails: refundDetails,
          expiresAt: order.expiresAt || undefined,
        };
      });

      return new Response(JSON.stringify(transformedOrders), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);

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

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user.id;
    const orderData: Order = await request.json();

    // Validate required fields
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return new Response(JSON.stringify({ message: 'Invalid order data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate voucher if provided
    let voucherId: string | undefined;
    let voucherDiscount = 0;

    if (orderData.voucherId || (orderData as any).voucherCode) {
      const voucherCode = (orderData as any).voucherCode;

      // Find and validate voucher
      const voucher = await prisma.voucher.findFirst({
        where: {
          OR: [
            { id: orderData.voucherId || '' },
            { code: voucherCode?.toUpperCase() || '' },
          ],
        },
        include: {
          _count: {
            select: { voucherUsages: true },
          },
        },
      });

      if (voucher) {
        // Validate voucher
        const now = new Date();

        if (!voucher.isActive) {
          return new Response(JSON.stringify({ message: 'Voucher tidak aktif' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (voucher.startDate > now || voucher.endDate < now) {
          return new Response(JSON.stringify({ message: 'Voucher tidak berlaku pada waktu ini' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (voucher.usageLimit && voucher._count.voucherUsages >= voucher.usageLimit) {
          return new Response(JSON.stringify({ message: 'Voucher sudah mencapai batas penggunaan' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (voucher.usagePerUser) {
          const userUsageCount = await prisma.voucherUsage.count({
            where: {
              voucherId: voucher.id,
              userId: userId,
            },
          });

          if (userUsageCount >= voucher.usagePerUser) {
            return new Response(JSON.stringify({ message: 'Anda sudah mencapai batas penggunaan voucher ini' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }

        // Calculate discount
        const cartTotal = orderData.items.reduce((sum, item) => sum + (item.product.flashSalePrice * item.quantity), 0);

        if (voucher.minPurchase && cartTotal < parseFloat(voucher.minPurchase.toString())) {
          return new Response(JSON.stringify({ message: `Minimum pembelian Rp ${parseFloat(voucher.minPurchase.toString()).toLocaleString('id-ID')}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (voucher.discountType === 'PERCENTAGE') {
          const discountValue = parseFloat(voucher.discountValue?.toString() || '0');
          voucherDiscount = (cartTotal * discountValue) / 100;

          if (voucher.maxDiscount) {
            const maxDiscount = parseFloat(voucher.maxDiscount.toString());
            voucherDiscount = Math.min(voucherDiscount, maxDiscount);
          }
        } else if (voucher.discountType === 'FIXED_AMOUNT') {
          voucherDiscount = parseFloat(voucher.discountValue?.toString() || '0');
          voucherDiscount = Math.min(voucherDiscount, cartTotal);
        } else if (voucher.discountType === 'FREE_SHIPPING') {
          voucherDiscount = orderData.shippingCost || 0;
          if (voucher.maxDiscount) {
            const maxDiscount = parseFloat(voucher.maxDiscount.toString());
            voucherDiscount = Math.min(voucherDiscount, maxDiscount);
          }
        }

        voucherId = voucher.id;
      }
    }

    // Create order in database
    // Create order in database
    const settings = await prisma.generalSettings.findFirst();
    // paymentTimeLimit is in minutes per schema
    const paymentDeadlineMinutes = settings?.paymentTimeLimit || 24 * 60; // Default to 24h if missing

    const createdOrder = await prisma.$transaction(async (tx) => {
      // Ensure address exists
      let addressId = orderData.address.id;

      // Resolve city name: prefer payload, fallback to lookup
      const cityName = orderData.address.city || mockRegions.cities.find((c: any) => c.id === orderData.address.cityId)?.name || '';

      const existingAddress = await tx.address.findUnique({
        where: { id: addressId },
      });

      if (!existingAddress) {
        // Create new address if it doesn't exist (e.g. from localStorage fallback)
        const newAddress = await tx.address.create({
          data: {
            user: {
              connect: { id: userId }
            },
            name: orderData.address.fullName,
            phone: orderData.address.phone,
            street: orderData.address.street,
            postalCode: orderData.address.postalCode,
            rtRwBlock: orderData.address.rtRwBlock,
            label: orderData.address.label,
            notes: orderData.address.notes || null,
            provinceId: orderData.address.provinceId,
            cityId: orderData.address.cityId,
            districtId: orderData.address.districtId,
            villageId: orderData.address.villageId,
          }
        });
        addressId = newAddress.id;
      }
      // Note: existingAddress doesn't have city/province as we only store IDs now

      // Create the order
      const order = await tx.order.create({
        data: {
          user: {
            connect: { id: userId }
          },
          status: 'Pending', // Default status for new orders
          totalAmount: new Decimal(orderData.total),
          address: {
            connect: {
              id: addressId,
            },
          },
          shippingCity: cityName, // Persist city name for shipping label
          shippingCost: orderData.shippingCost ? new Decimal(orderData.shippingCost) : null,
          ...(voucherId ? { voucher: { connect: { id: voucherId } } } : {}),
          discount: voucherDiscount ? new Decimal(voucherDiscount) : null,
          expiresAt: new Date(Date.now() + paymentDeadlineMinutes * 60 * 1000), // Configurable expiry in minutes
          createdAt: new Date(), // Use server time or orderData.date if preferred
        },
      });

      // Create voucher usage record if voucher was applied
      if (voucherId) {
        await tx.voucherUsage.create({
          data: {
            voucherId: voucherId,
            userId: userId,
            orderId: order.id,
          },
        });
      }

      // Create order items
      for (const item of orderData.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            quantity: item.quantity,
            price: new Decimal(item.product.flashSalePrice.toString()),
          },
        });

        // Update flash sale sold count if this is a flash sale item
        if (item.product.flashSaleId) {
          await tx.flashSale.update({
            where: { id: item.product.flashSaleId },
            data: {
              sold: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // If this is an auction checkout, update the auction status
      if (orderData.items.length === 1 && orderData.items[0].quantity === 1) {
        // Check if the product was part of an auction by looking for an active auction
        const auction = await tx.auction.findFirst({
          where: {
            productId: orderData.items[0].product.id,
            status: 'active',
          },
        });

        if (auction) {
          // Update auction status to sold
          await tx.auction.update({
            where: { id: auction.id },
            data: {
              status: 'sold',
              currentBid: new Decimal(orderData.items[0].product.flashSalePrice.toString()),
            },
          });
        }
      }

      // Reduce product quantity for each order item
      for (const item of orderData.items) {
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            quantityAvailable: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Complete any active reservations for this user and these items
      // Mark flash sale reservations as completed
      for (const item of orderData.items) {
        if (item.product.flashSaleId) {
          await tx.stockReservation.updateMany({
            where: {
              userId: userId,
              flashSaleId: item.product.flashSaleId,
              status: 'active',
            },
            data: {
              status: 'completed',
            },
          });
        }
      }

      return order;
    });

    return new Response(JSON.stringify({
      message: 'Order created successfully',
      orderId: createdOrder.id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating order:', error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('P2003')) {
        // Foreign key constraint error
        return new Response(JSON.stringify({
          message: 'Invalid data provided - foreign key constraint violation',
          error: error.message
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (error.message.includes('P2002')) {
        // Unique constraint error
        return new Response(JSON.stringify({
          message: 'Duplicate entry not allowed',
          error: error.message
        }), {
          status: 400,
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