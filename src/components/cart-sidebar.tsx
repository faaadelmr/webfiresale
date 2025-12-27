
"use client";

import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export function CartSidebar() {
  const { isCartOpen, toggleCart, cartItems, removeFromCart, updateQuantity, totalItems, cartTotal } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={toggleCart}
      ></motion.div>
      <motion.div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-xl overflow-hidden flex flex-col z-50"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Keranjang Belanja ({totalItems})</h2>
          <button
            className="btn btn-sm btn-ghost"
            onClick={toggleCart}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {cartItems.length > 0 ? (
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={`${item.product.id}-${item.product.flashSaleId || 'regular'}-${index}`}
                    className="flex items-start gap-4 p-3 bg-base-200 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                      data-ai-hint="product image"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <div className="text-sm text-base-content/70 flex flex-wrap items-center gap-2">
                        <span>{formatPrice(item.product.flashSalePrice)}</span>
                        {item.product.flashSaleId && item.product.originalPrice > item.product.flashSalePrice && (
                          <span className="line-through">{formatPrice(item.product.originalPrice)}</span>
                        )}
                        <span className="badge badge-ghost badge-sm">{item.product.weight || 0}g</span>
                      </div>

                      <div className="mt-2 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                            className="input input-bordered input-sm w-16 text-center"
                            min="1"
                            max={item.product.flashSaleId
                              ? Math.min(
                                item.product.maxOrderQuantity || Infinity,
                                (item.product.limitedQuantity || 0) - (item.product.sold || 0)
                              )
                              : undefined}
                          />
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.product.flashSaleId && item.product.maxOrderQuantity ? item.quantity >= item.product.maxOrderQuantity : false}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {item.product.flashSaleId && item.product.maxOrderQuantity && (
                          <span className="text-xs text-base-content/60">
                            Maks. {item.product.maxOrderQuantity} pcs
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-ghost text-base-content/70 hover:text-error"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                className="flex flex-1 flex-col items-center justify-center text-center h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Image src="https://picsum.photos/seed/empty-cart/300/200" alt="Empty cart" width={300} height={200} className="mb-4 rounded-md" data-ai-hint="empty cart" />
                <h3 className="text-xl font-semibold">Keranjang Anda Kosong</h3>
                <p className="text-base-content/70">Tambahkan beberapa penawaran luar biasa untuk memulai!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {cartItems.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <Link href="/checkout" className="btn btn-primary w-full" onClick={toggleCart}>
              Lanjutkan ke Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
