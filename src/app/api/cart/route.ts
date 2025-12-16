import { NextRequest } from 'next/server';
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
import { Decimal } from 'decimal.js';

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
    // Get user's cart
    const cart = await getOrCreateCart(userId);
    const formattedCart = formatCartForFrontend(cart);
    
    return new Response(JSON.stringify(formattedCart), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting cart:', error);
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
  const { productId, quantity, price, flashSaleId } = await request.json();

  if (!productId || !quantity || !price) {
    return new Response(JSON.stringify({ message: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const updatedCart = await addItemToCart(userId, productId, quantity, price, flashSaleId);
    const formattedCart = formatCartForFrontend(updatedCart);
    
    return new Response(JSON.stringify(formattedCart), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
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
  const { cartItemId, quantity, productId } = await request.json();

  try {
    if (cartItemId) {
      // Update by cart item ID
      if (quantity === undefined) {
        return new Response(JSON.stringify({ message: 'Missing quantity' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const updatedCart = await updateCartItemQuantity(userId, cartItemId, quantity);
      const formattedCart = formatCartForFrontend(updatedCart);

      return new Response(JSON.stringify(formattedCart), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (productId && quantity !== undefined) {
      // Update by product ID - find the cart item ID first
      const cart = await getOrCreateCart(userId);
      const cartItem = cart?.items?.find(item => item.productId === productId);

      if (!cartItem) {
        return new Response(JSON.stringify({ message: 'Cart item not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const updatedCart = await updateCartItemQuantity(userId, cartItem.id, quantity);
      const formattedCart = formatCartForFrontend(updatedCart);

      return new Response(JSON.stringify(formattedCart), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ message: 'Missing cartItemId or productId with quantity' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
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

  const userId = session.user.id;
  const url = new URL(request.url);
  const clear = url.searchParams.get('clear');
  const itemId = url.searchParams.get('itemId');

  try {
    if (clear === 'true') {
      // Clear entire cart
      await clearUserCart(userId);
      return new Response(JSON.stringify({ message: 'Cart cleared successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (itemId) {
      // Remove specific item by cart item ID
      const updatedCart = await removeItemFromCart(userId, itemId);
      const formattedCart = formatCartForFrontend(updatedCart);
      return new Response(JSON.stringify(formattedCart), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Remove by product ID (from request body)
      const { productId } = await request.json();

      if (!productId) {
        return new Response(JSON.stringify({ message: 'Missing product ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // We need to find the cart item ID based on the product ID
      const cart = await getOrCreateCart(userId);
      const cartItem = cart?.items?.find(item => item.productId === productId);

      if (!cartItem) {
        return new Response(JSON.stringify({ message: 'Cart item not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const updatedCart = await removeItemFromCart(userId, cartItem.id);
      const formattedCart = formatCartForFrontend(updatedCart);
      return new Response(JSON.stringify(formattedCart), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error deleting from cart:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}