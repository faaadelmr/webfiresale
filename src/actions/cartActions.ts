'use server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { 
  getOrCreateCart, 
  addItemToCart, 
  removeItemFromCart, 
  updateCartItemQuantity, 
  clearUserCart,
  formatCartForFrontend 
} from '@/lib/cart-db';

// Server action to get user's cart
export async function getUserCartAction() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  try {
    const cart = await getOrCreateCart(userId);
    if (!cart) {
      throw new Error('Failed to get user cart - cart not found');
    }
    return formatCartForFrontend(cart);
  } catch (error) {
    console.error('Error getting user cart:', error);
    throw new Error('Failed to get user cart');
  }
}

// Server action to add item to cart
export async function addToCartAction(productId: string, quantity: number, price: number, flashSaleId?: string) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  try {
    const updatedCart = await addItemToCart(userId, productId, quantity, price, flashSaleId);
    if (!updatedCart) {
      throw new Error('Failed to add item to cart - cart not found');
    }
    return formatCartForFrontend(updatedCart);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw new Error('Failed to add item to cart');
  }
}

// Server action to update cart item quantity
export async function updateCartItemQuantityAction(cartItemId: string, newQuantity: number) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  try {
    const updatedCart = await updateCartItemQuantity(userId, cartItemId, newQuantity);
    if (!updatedCart) {
      throw new Error('Failed to update cart item quantity - cart not found');
    }
    return formatCartForFrontend(updatedCart);
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw new Error('Failed to update cart item quantity');
  }
}

// Server action to remove item from cart
export async function removeFromCartAction(cartItemId: string) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  try {
    const updatedCart = await removeItemFromCart(userId, cartItemId);
    if (!updatedCart) {
      throw new Error('Failed to remove item from cart - cart not found');
    }
    return formatCartForFrontend(updatedCart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw new Error('Failed to remove item from cart');
  }
}

// Server action to clear user's cart
export async function clearCartAction() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  try {
    const cartAfterClear = await clearUserCart(userId);
    return formatCartForFrontend(cartAfterClear);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw new Error('Failed to clear cart');
  }
}