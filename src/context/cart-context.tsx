
"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useCallback, useEffect } from 'react';
import type { CartItem, CartProduct } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { isProductAvailableForCart } from '@/lib/utils';
import { CartItem as CartItemModel } from '@prisma/client';

export interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  refreshCart: () => Promise<void>;
  cartTotal: number;
  totalItems: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false); // Track if we've loaded cart from DB

  // Load cart from database function (reusable)
  const loadCartFromDB = useCallback(async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { cartItems: dbCartItems } = await response.json();
        setCartItems(dbCartItems);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading cart from database:', error);
      setIsInitialized(true); // Still mark as initialized to allow UI to render
    }
  }, []);

  // Load cart from database on mount
  useEffect(() => {
    loadCartFromDB();
  }, [loadCartFromDB]);

  // Refresh cart function to be called manually
  const refreshCart = useCallback(async () => {
    await loadCartFromDB();
  }, [loadCartFromDB]);

  const addToCart = useCallback((product: CartProduct) => {
    if (!isInitialized) {
      toast({
        title: "Keranjang Belum Siap",
        description: "Mohon tunggu sebentar, keranjang sedang dimuat.",
        variant: "destructive"
      });
      return;
    }

    console.log('Adding to cart:', product.name, 'Current cart items:', cartItems.length);

    // Validate flash sale  availability
    if (product.flashSaleId) {
      const now = new Date();
      const start = product.startDate ? new Date(product.startDate) : null;
      const end = product.endDate ? new Date(product.endDate) : null;

      // Check if sale is active
      if (start && end) {
        if (now < start) {
          toast({
            title: "Flash Sale Belum Dimulai",
            description: "Flash sale untuk produk ini belum dimulai.",
            variant: "destructive"
          });
          return;
        }
        if (now >= end) {
          toast({
            title: "Flash Sale Berakhir",
            description: "Flash sale untuk produk ini sudah berakhir.",
            variant: "destructive"
          });
          return;
        }
      }

      // Check available stock
      const availableStock = (product.limitedQuantity || 0) - (product.sold || 0);
      console.log('Available stock:', availableStock);

      if (availableStock <= 0) {
        toast({
          title: "Stok Habis",
          description: "Stok produk ini sudah habis.",
          variant: "destructive"
        });
        return;
      }

      // Check quantity in cart - use current state
      const existingItem = cartItems.find((item) => item.product.id === product.id);
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
      const newTotalQuantity = currentQuantityInCart + 1;

      console.log('Current in cart:', currentQuantityInCart, 'New total:', newTotalQuantity, 'Max allowed:', product.maxOrderQuantity);

      // Check max order quantity
      if (product.maxOrderQuantity && newTotalQuantity > product.maxOrderQuantity) {
        console.log('MAX ORDER QUANTITY EXCEEDED!');
        toast({
          title: "Batas Maksimal Tercapai",
          description: `Anda hanya dapat membeli maksimal ${product.maxOrderQuantity} unit produk ini. Saat ini sudah ada ${currentQuantityInCart} di keranjang.`,
          variant: "destructive"
        });
        return;
      }

      // Check against available stock
      if (newTotalQuantity > availableStock) {
        toast({
          title: "Stok Terbatas",
          description: `Stok hanya tersisa ${availableStock} unit.`,
          variant: "destructive"
        });
        return;
      }
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });

    // Sync with database
    fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
        price: product.flashSalePrice,
        flashSaleId: product.flashSaleId || undefined,
      }),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to sync with database');
      })
      .then(data => {
        // Update local state with the latest cart from DB to ensure consistency
        setCartItems(data.cartItems);
      })
      .catch(error => {
        console.error('Error syncing cart with database:', error);
        toast({
          title: "Gagal Menyimpan",
          description: "Terjadi kesalahan menyimpan ke keranjang. Silakan coba lagi.",
          variant: "destructive"
        });
      });

    toast({
      title: "Item ditambahkan ke keranjang",
      description: `${product.name} telah ditambahkan ke keranjang Anda.`,
    })
  }, [toast, cartItems, isInitialized]);

  const removeFromCart = useCallback((productId: string) => {
    if (!isInitialized) {
      toast({
        title: "Keranjang Belum Siap",
        description: "Mohon tunggu sebentar, keranjang sedang dimuat.",
        variant: "destructive"
      });
      return;
    }

    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
      variant: "destructive"
    });

    // Note: In a full implementation, we would need to map product id to cart item id
    // For now, we'll fetch the updated cart from the database to ensure consistency
    fetch('/api/cart', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
      }),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to sync with database');
      })
      .then(data => {
        // Update local state with the latest cart from DB to ensure consistency
        setCartItems(data.cartItems);
      })
      .catch(error => {
        console.error('Error syncing cart removal with database:', error);
        toast({
          title: "Gagal Menghapus",
          description: "Terjadi kesalahan saat menghapus dari keranjang. Silakan coba lagi.",
          variant: "destructive"
        });
      });
  }, [toast, isInitialized]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (!isInitialized) {
      toast({
        title: "Keranjang Belum Siap",
        description: "Mohon tunggu sebentar, keranjang sedang dimuat.",
        variant: "destructive"
      });
      return;
    }

    setCartItems((prevItems) => {
      const itemToUpdate = prevItems.find(item => item.product.id === productId);
      if (!itemToUpdate) return prevItems;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less, but do it inside the state update to avoid dependency issues
        return prevItems.filter(item => item.product.id !== productId);
      }

      // Only check availability for flash sale items
      if (itemToUpdate.product.flashSaleId) {
        const availability = isProductAvailableForCart(productId, quantity, prevItems, true);

        if (!availability.isAvailable) {
          toast({
            title: "Kuantitas Tidak Tersedia",
            description: availability.message,
            variant: availability.maxAvailable !== undefined ? "default" : "destructive"
          });

          if (availability.maxAvailable !== undefined) {
            // Sync with database before updating local state to ensure consistency
            // Note: In a full implementation, we would need to map product id to cart item id
            // For now, we'll fetch the updated cart from the database to ensure consistency
            fetch('/api/cart', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                productId,
                quantity: availability.maxAvailable
              }),
            }).catch(error => {
              console.error('Error syncing cart with database:', error);
            });

            return prevItems.map(item =>
              item.product.id === productId
                ? { ...item, quantity: availability.maxAvailable! }
                : item
            );
          }

          return prevItems;
        }
      }

      return prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });

    if (quantity <= 0) {
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart.",
        variant: "destructive"
      });
    }

    // Sync with database
    // Note: In a full implementation, we would need to map product id to cart item id
    // For now, we'll fetch the updated cart from the database to ensure consistency
    fetch('/api/cart', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        quantity
      }),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to sync with database');
      })
      .then(data => {
        // Update local state with the latest cart from DB to ensure consistency
        setCartItems(data.cartItems);
      })
      .catch(error => {
        console.error('Error syncing cart update with database:', error);
        toast({
          title: "Gagal Memperbarui",
          description: "Terjadi kesalahan saat memperbarui keranjang. Silakan coba lagi.",
          variant: "destructive"
        });
      });
  }, [toast, isInitialized]);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);

    // Sync with database
    fetch('/api/cart?clear=true', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to sync with database');
        }
        return response.json();
      })
      .then(data => {
        // Update local state with the result (should be empty)
        setCartItems(data.cartItems || []);
      })
      .catch(error => {
        console.error('Error syncing cart clear with database:', error);
        toast({
          title: "Gagal Membersihkan",
          description: "Terjadi kesalahan saat membersihkan keranjang. Silakan coba lagi.",
          variant: "destructive"
        });
      });
  }, [toast]);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.flashSalePrice * item.quantity,
    0
  );

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        refreshCart,
        cartTotal,
        totalItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
