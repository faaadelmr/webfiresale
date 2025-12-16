import prisma from '@/lib/prisma';
import { CartItem as CartItemModel, Cart as CartModel } from '@prisma/client';
import { Decimal } from 'decimal.js';

// Include cart items in cart queries
export const cartWithItems = {
  include: {
    items: {
      include: {
        product: true,
        flashSale: true,
      },
    },
  },
};

/**
 * Get user's cart with items
 */
export async function getUserCart(userId: string) {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      ...cartWithItems,
    });

    return cart;
  } catch (error) {
    console.error('Error getting user cart:', error);
    throw new Error('Failed to get user cart');
  }
}

/**
 * Create a new cart for a user
 */
export async function createCartForUser(userId: string) {
  try {
    const cart = await prisma.cart.create({
      data: {
        user: {
          connect: { id: userId },
        },
      },
      ...cartWithItems,
    });

    return cart;
  } catch (error) {
    console.error('Error creating cart:', error);
    throw new Error('Failed to create cart');
  }
}

/**
 * Get or create user's cart
 */
export async function getOrCreateCart(userId: string) {
  const existingCart = await getUserCart(userId);
  if (existingCart) {
    return existingCart;
  }

  return await createCartForUser(userId);
}

/**
 * Add item to cart
 */
export async function addItemToCart(userId: string, productId: string, quantity: number, price: number, flashSaleId?: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // Get or create the user's cart
      const cart = await tx.cart.upsert({
        where: { userId },
        create: {
          userId,
        },
        update: {},
      });

      // Check if the item already exists in the cart
      const existingCartItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          flashSaleId: flashSaleId || null, // Use null if no flashSaleId provided
        },
      });

      if (existingCartItem) {
        // Update quantity if item already exists
        await tx.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: existingCartItem.quantity + quantity,
            price: new Decimal(price),
          },
        });
      } else {
        // Add new item to cart
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            price: new Decimal(price),
            flashSaleId: flashSaleId || null,
          },
        });
      }
    });

    // Return updated cart
    return await getUserCart(userId);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw new Error('Failed to add item to cart');
  }
}

/**
 * Remove item from cart
 */
export async function removeItemFromCart(userId: string, cartItemId: string) {
  try {
    await prisma.cartItem.delete({
      where: {
        id: cartItemId,
        cart: {
          userId,
        },
      },
    });

    // Return updated cart
    return await getUserCart(userId);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw new Error('Failed to remove item from cart');
  }
}

/**
 * Update item quantity in cart
 */
export async function updateCartItemQuantity(userId: string, cartItemId: string, newQuantity: number) {
  try {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      return await removeItemFromCart(userId, cartItemId);
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        id: cartItemId,
        cart: {
          userId,
        },
      },
      data: {
        quantity: newQuantity,
      },
      include: {
        product: true,
        flashSale: true,
      },
    });

    // Return updated cart
    return await getUserCart(userId);
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw new Error('Failed to update cart item quantity');
  }
}

/**
 * Clear all items from user's cart
 */
export async function clearUserCart(userId: string) {
  try {
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId,
        },
      },
    });

    // Return empty cart (create one if it doesn't exist)
    let cart = await getUserCart(userId);
    if (!cart) {
      cart = await createCartForUser(userId);
    }
    return cart;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw new Error('Failed to clear cart');
  }
}

/**
 * Calculate total price of items in cart
 */
export async function calculateCartTotal(userId: string): Promise<Decimal> {
  try {
    const cart = await getUserCart(userId);
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return new Decimal(0);
    }

    const total = cart.items.reduce((sum, item) => {
      return sum.add(new Decimal(item.price).mul(item.quantity));
    }, new Decimal(0));

    return total;
  } catch (error) {
    console.error('Error calculating cart total:', error);
    throw new Error('Failed to calculate cart total');
  }
}

/**
 * Get count of total items in cart
 */
export async function getCartItemsCount(userId: string): Promise<number> {
  try {
    const cart = await getUserCart(userId);
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return 0;
    }

    return cart.items.reduce((count, item) => count + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart items count:', error);
    throw new Error('Failed to get cart items count');
  }
}

/**
 * Convert database cart to the format expected by the existing cart context
 */
export function formatCartForFrontend(cart: (CartModel & { items: (CartItemModel & { product: any, flashSale: any })[] }) | null) {
  if (!cart) {
    return {
      cartItems: [],
      cartTotal: 0,
      totalItems: 0,
    };
  }

  // Convert cart items to format expected by frontend
  const cartItems = cart.items.map(item => ({
    product: {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      image: item.product.image,
      originalPrice: Number(item.product.originalPrice),
      quantity: item.product.quantityAvailable, // Map to available quantity
      weight: item.product.weight,
      // Flash sale specific properties (when applicable)
      flashSaleId: item.flashSaleId || undefined,
      flashSalePrice: Number(item.price), // Use the price stored in cart item
      maxOrderQuantity: item.flashSale?.maxOrderQuantity,
      limitedQuantity: item.flashSale?.limitedQuantity,
      sold: item.flashSale?.sold,
      startDate: item.flashSale?.startDate,
      endDate: item.flashSale?.endDate,
    },
    quantity: item.quantity,
  }));

  // Calculate total price
  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.product.flashSalePrice * item.quantity);
  }, 0);

  // Calculate total items
  const totalItems = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  return {
    cartItems,
    cartTotal,
    totalItems,
  };
}