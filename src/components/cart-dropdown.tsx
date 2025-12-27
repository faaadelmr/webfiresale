"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export function CartDropdown() {
    const { cartItems, removeFromCart, updateQuantity, totalItems, cartTotal } = useCart();

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <div className="indicator">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                        <span className="badge badge-primary badge-sm indicator-item">{totalItems}</span>
                    )}
                </div>
            </div>
            <div tabIndex={0} className="dropdown-content card card-compact bg-base-100 shadow-xl w-80 sm:w-96 z-50 mt-3">
                <div className="card-body">
                    <div className="flex items-center justify-between border-b border-base-300 pb-3">
                        <h3 className="font-bold text-lg">Keranjang ({totalItems})</h3>
                    </div>

                    {cartItems.length > 0 ? (
                        <>
                            {/* Cart Items - Max 3 visible, scrollable */}
                            <div className="max-h-64 overflow-y-auto space-y-3 py-2">
                                {cartItems.map((item) => (
                                    <div key={item.product.id} className="flex items-start gap-3 p-2 bg-base-200 rounded-lg">
                                        <Image
                                            src={item.product.image}
                                            alt={item.product.name}
                                            width={60}
                                            height={60}
                                            className="rounded-md object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{item.product.name}</p>
                                            <div className="text-sm text-base-content/70">
                                                <span>{formatPrice(item.product.flashSalePrice)}</span>
                                                {item.product.flashSaleId && item.product.originalPrice > item.product.flashSalePrice && (
                                                    <span className="line-through ml-2 text-xs">{formatPrice(item.product.originalPrice)}</span>
                                                )}
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="mt-1 flex items-center gap-1">
                                                <button
                                                    className="btn btn-xs btn-ghost"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-6 text-center text-sm">{item.quantity}</span>
                                                <button
                                                    className="btn btn-xs btn-ghost"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    disabled={item.product.flashSaleId && item.product.maxOrderQuantity ? item.quantity >= item.product.maxOrderQuantity : false}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-xs btn-ghost text-error"
                                            onClick={() => removeFromCart(item.product.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Footer with Total and Checkout */}
                            <div className="border-t border-base-300 pt-3 space-y-3">
                                <div className="flex justify-between font-bold">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(cartTotal)}</span>
                                </div>
                                <Link href="/checkout" className="btn btn-primary btn-block">
                                    Checkout
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-center">
                            <ShoppingCart className="h-12 w-12 mx-auto text-base-content/30 mb-3" />
                            <p className="text-base-content/60">Keranjang kosong</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
