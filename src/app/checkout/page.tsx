"use client";

import { Header } from "@/components/header";
import { BuyerForm } from "@/components/buyer-form";
import { useCart } from "@/hooks/use-cart";
import { formatPrice, updateSoldProductQuantity, calculateShippingCostFromCart } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, User, Mail, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Order, AddressDetails, ShippingOption, GeneralSettings, UserProfile } from "@/lib/types";

import { useToast } from "@/hooks/use-toast";
import { Suspense } from "react";
import { useSession } from "next-auth/react";

// Disable static generation for this page to handle useSearchParams properly
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Note: The revalidate export caused build issues, so we'll handle revalidation differently

// Separate the component that needs search params to avoid static prerendering issues
function CheckoutContent() {
    const { cartItems, cartTotal, clearCart, refreshCart } = useCart();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const auctionId = searchParams.get('auctionId');
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(null);
    const [auctionItem, setAuctionItem] = useState<any>(null);
    const [isAuctionCheckout, setIsAuctionCheckout] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Stock reservation tracking
    const [reservationIds, setReservationIds] = useState<string[]>([]);
    const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);
    const reservationsCreatedRef = useRef(false);

    // Refresh cart data on mount to ensure we have latest data from DB
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    useEffect(() => {
        const loadCheckoutData = async () => {
            try {
                // Fetch checkout data from the API (addresses, shipping options, etc.)
                const response = await fetch('/api/checkout-data');
                if (response.ok) {
                    const data = await response.json();
                    // Convert database shipping options to match type expected by UI
                    const formattedShippingOptions = data.shippingOptions?.map((option: any) => ({
                        id: option.id,
                        cityId: option.cityId,  // Use cityId instead of city
                        cost: Number(option.cost) // Ensure cost is a number
                    })) || [];
                    setShippingOptions(formattedShippingOptions);
                } else {
                    // No fallback - use empty array if API fails
                    setShippingOptions([]);
                }
            } catch (error) {
                console.error('Error fetching shipping options:', error);
                // No fallback - use empty array on error
                setShippingOptions([]);
            }

            // Fetch general settings from API
            try {
                const settingsResponse = await fetch('/api/settings');
                if (settingsResponse.ok) {
                    const settingsData = await settingsResponse.json();
                    setGeneralSettings(settingsData);
                } else {
                    // Fallback to default settings
                    setGeneralSettings({
                        bannerEnabled: false,
                        paymentTimeLimit: 5,
                        printSize: 'a4'
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                // Fallback to default
                setGeneralSettings({
                    bannerEnabled: false,
                    paymentTimeLimit: 5,
                    printSize: 'a4'
                });
            }


            // Check if this is an auction checkout
            if (auctionId) {
                try {
                    const auctionResponse = await fetch(`/api/auctions/${auctionId}`);
                    if (auctionResponse.ok) {
                        const auctionData = await auctionResponse.json();
                        setAuctionItem(auctionData);
                        setIsAuctionCheckout(true);
                    }
                } catch (error) {
                    console.error('Error fetching auction data:', error);
                }
            }
        };

        loadCheckoutData();
    }, [auctionId]);

    // Sync profile from session if local storage data is missing or incomplete
    useEffect(() => {
        if (session?.user && (!profile || !profile.email)) {
            setProfile((prev) => ({
                fullName: prev?.fullName || session.user?.name || '',
                email: session.user?.email || '',
                phone: prev?.phone || '',
                avatar: prev?.avatar || session.user?.image || '',
            }));
        }
    }, [session, profile?.email]);

    // Create stock reservations for all items (flash sales, auctions, and regular products)
    useEffect(() => {
        // Skip if already created
        if (reservationsCreatedRef.current) return;

        // Skip if cart is still loading (empty but might have items)
        // We check isAuctionCheckout to allow auction checkout without cart items
        const hasItems = cartItems.length > 0;

        // If no items and no auction, nothing to reserve
        if (!hasItems && !auctionId) {
            return;
        }

        const createReservations = async () => {
            console.log('Creating reservations for', cartItems.length, 'cart items, auctionId:', auctionId);
            const newReservationIds: string[] = [];
            let earliestExpiry: Date | null = null;

            // Create reservations for all items in cart
            for (const item of cartItems) {
                if (item.product.flashSaleId) {
                    // Flash sale item - reserve with flashSaleId
                    try {
                        console.log('Creating reservation for flashSale:', item.product.flashSaleId, 'qty:', item.quantity);
                        const response = await fetch('/api/reservations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'flashsale',
                                flashSaleId: item.product.flashSaleId,
                                quantity: item.quantity,
                            }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            console.log('Flash sale reservation created:', data);
                            if (data.reservationId) {
                                newReservationIds.push(data.reservationId);
                                if (data.expiresAt) {
                                    const expiry = new Date(data.expiresAt);
                                    if (!earliestExpiry || expiry < earliestExpiry) {
                                        earliestExpiry = expiry;
                                    }
                                }
                            }
                        } else {
                            // Better error handling - check if response has content
                            try {
                                const errorData = await response.json();
                                console.error('Flash sale reservation failed:', errorData.error || errorData.message || 'Unknown error');
                            } catch {
                                console.error('Flash sale reservation failed with status:', response.status);
                            }
                        }
                    } catch (error) {
                        console.error('Error creating flash sale reservation:', error);
                    }
                } else {
                    // Regular product - reserve with productId
                    try {
                        console.log('Creating reservation for product:', item.product.id, 'qty:', item.quantity);
                        const response = await fetch('/api/reservations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'product',
                                productId: item.product.id,
                                quantity: item.quantity,
                            }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            console.log('Product reservation created:', data);
                            if (data.reservationId) {
                                newReservationIds.push(data.reservationId);
                                if (data.expiresAt) {
                                    const expiry = new Date(data.expiresAt);
                                    if (!earliestExpiry || expiry < earliestExpiry) {
                                        earliestExpiry = expiry;
                                    }
                                }
                            }
                        } else {
                            try {
                                const errorData = await response.json();
                                console.error('Product reservation failed:', errorData.error || errorData.message || 'Unknown error');
                            } catch {
                                console.error('Product reservation failed with status:', response.status);
                            }
                        }
                    } catch (error) {
                        console.error('Error creating product reservation:', error);
                    }
                }
            }

            // Create reservation for auction checkout
            if (auctionId) {
                try {
                    console.log('Creating reservation for auction:', auctionId);
                    const response = await fetch('/api/reservations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'auction',
                            auctionId,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('Auction reservation created:', data);
                        if (data.reservationId) {
                            newReservationIds.push(data.reservationId);
                            if (data.expiresAt) {
                                const expiry = new Date(data.expiresAt);
                                if (!earliestExpiry || expiry < earliestExpiry) {
                                    earliestExpiry = expiry;
                                }
                            }
                        }
                    } else {
                        const errorData = await response.json();
                        console.error('Auction reservation failed:', errorData);
                    }
                } catch (error) {
                    console.error('Error creating auction reservation:', error);
                }
            }

            console.log('Reservations created:', newReservationIds);
            setReservationIds(newReservationIds);
            setReservationExpiry(earliestExpiry);
            reservationsCreatedRef.current = true;
        };

        createReservations();

        // Cleanup: cancel reservations when leaving checkout without completing
        return () => {
            // Note: Reservations will expire automatically, but we can cancel explicitly
            // This is done via beforeunload event handler below
        };
    }, [cartItems, auctionId]);

    // Cancel reservations on page unload (if not completed)
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Send beacon to cancel reservations (fire-and-forget)
            reservationIds.forEach(id => {
                navigator.sendBeacon(`/api/reservations?id=${id}`, '');
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [reservationIds]);

    // Voucher logic
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<{ id: string, code: string, discountAdjustment: number, discountType?: string } | null>(null);
    const [voucherLoading, setVoucherLoading] = useState(false);

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return;
        setVoucherLoading(true);

        try {
            const items = isAuctionCheckout
                ? [{
                    price: auctionItem.currentBid || auctionItem.minBid,
                    quantity: 1,
                    auctionId: auctionId
                }]
                : cartItems.map(item => ({
                    price: item.product.flashSalePrice,
                    quantity: item.quantity,
                    flashSaleId: item.product.flashSaleId,
                    // Regular items map naturally
                }));

            const res = await fetch('/api/vouchers/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: voucherCode,
                    cartItems: items,
                    shippingCost: shippingCost || 0
                }),
            });

            const data = await res.json();

            if (data.valid) {
                setAppliedVoucher({
                    id: data.voucher.id,
                    code: data.voucher.code,
                    discountAdjustment: data.discount,
                    discountType: data.voucher.discountType
                });
                toast({
                    title: "Voucher Berhasil Dipasang",
                    description: `Voucher ${data.voucher.code} berhasil diterapkan. Hemat ${formatPrice(data.discount)}`,
                });
                setVoucherCode('');
            } else {
                toast({
                    title: "Voucher Tidak Valid",
                    description: data.message,
                    variant: "destructive"
                });
                setAppliedVoucher(null);
            }
        } catch (error) {
            console.error('Error applying voucher:', error);
            toast({
                title: "Error",
                description: "Gagal memproses voucher",
                variant: "destructive"
            });
        } finally {
            setVoucherLoading(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        toast({
            title: "Voucher Dihapus",
            description: "Voucher telah dihapus dari pesanan.",
        });
    };

    // Calculate shipping cost based on product weight
    const [shippingCost, setShippingCost] = useState(0);
    const [isShippingAvailable, setIsShippingAvailable] = useState(false);

    useEffect(() => {
        const calculateShipping = () => {
            if (selectedAddress) {
                if (isAuctionCheckout && auctionItem) {
                    // For auction checkout, calculate shipping based on the single auction item
                    // Construct item with product structure expected by calculateShippingCostFromCart
                    const item = {
                        product: auctionItem.product,
                        quantity: 1
                    };
                    const cost = calculateShippingCostFromCart([item], shippingOptions, selectedAddress.cityId);
                    setShippingCost(cost);
                    setIsShippingAvailable(cost > 0);
                } else if (cartItems.length > 0) {
                    // For regular cart checkout, calculate shipping based on all items in cart
                    // cartItems already matches the structure { product, quantity }
                    const cost = calculateShippingCostFromCart(cartItems, shippingOptions, selectedAddress.cityId);
                    setShippingCost(cost);
                    setIsShippingAvailable(cost > 0);
                }
            } else {
                setShippingCost(0);
                setIsShippingAvailable(false);
            }
        };

        calculateShipping();
    }, [selectedAddress, cartItems, isAuctionCheckout, auctionItem, shippingOptions]);

    const finalTotal = cartTotal + shippingCost;
    const auctionFinalTotal = isAuctionCheckout ? (auctionItem?.currentBid || auctionItem?.minBid || 0) + shippingCost : finalTotal;
    // Apply voucher discount to the appropriate total
    const totalBeforeDiscount = isAuctionCheckout ? auctionFinalTotal : finalTotal;
    const finalTotalWithDiscount = Math.max(0, totalBeforeDiscount - (appliedVoucher?.discountAdjustment || 0));

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast({ title: "Alamat Belum Dipilih", description: "Silakan pilih atau tambahkan alamat pengiriman.", variant: "destructive" });
            return;
        }
        if (!isShippingAvailable) {
            toast({ title: "Pengiriman Tidak Tersedia", description: "Maaf, kami tidak melayani pengiriman ke kota Anda saat ini.", variant: "destructive" });
            return;
        }
        if (!profile || !profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
            toast({ title: "Profil Tidak Lengkap", description: "Email di profil Anda tidak valid. Harap perbarui di halaman profil.", variant: "destructive" });
            return;
        }
        if (!isAuctionCheckout && cartItems.length === 0) {
            toast({ title: "Keranjang Kosong", description: "Anda tidak bisa checkout dengan keranjang kosong.", variant: "destructive" });
            return;
        }

        const timestamp = Date.now().toString(36).slice(-4);
        const randomPart = Math.random().toString(36).substring(2, 7);
        const newOrderId = `FS-${timestamp}-${randomPart}`.toUpperCase();
        const paymentTimeLimit = generalSettings?.paymentTimeLimit || 5;
        const expirationDate = new Date(Date.now() + paymentTimeLimit * 60 * 1000);

        // Create order items based on checkout type
        const orderItems = isAuctionCheckout
            ? [{
                product: {
                    ...auctionItem.product,
                    flashSalePrice: auctionItem.currentBid || auctionItem.minBid,
                },
                quantity: 1
            }]
            : cartItems;

        const newOrder: Order = {
            id: newOrderId,
            customerName: profile.fullName,
            customerEmail: profile.email,
            customerPhone: profile.phone,
            address: selectedAddress,
            date: new Date(),
            status: 'Pending',
            total: finalTotalWithDiscount, // Use discounted total
            items: orderItems,
            shippingCity: selectedAddress.city,
            shippingCost: shippingCost,
            expiresAt: expirationDate,
            voucherId: appliedVoucher?.id,
            voucherCode: appliedVoucher?.code,
            discount: appliedVoucher?.discountAdjustment
        };

        // Send order to database via API
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newOrder),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create order');
            }

            const result = await response.json();
            const orderId = result.orderId;

            // Show success toast
            toast({
                title: "Pembelian Berhasil!",
                description: `Pesanan #${orderId} telah dibuat.`,
            });

            if (!isAuctionCheckout && cartItems.length > 0) {
                clearCart();
            }

            router.push(`/order-detail/${orderId}`);
        } catch (error) {
            console.error('Error creating order:', error);

            toast({
                title: "Gagal Membuat Pesanan",
                description: error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat pesanan',
                variant: "destructive"
            });
        }
    };

    // For auction checkout, show empty cart message if auction item is not available
    if (isAuctionCheckout && !auctionItem) {
        return (
            <div className="flex min-h-screen w-full flex-col bg-base-100">
                <Header />
                <main className="container mx-auto flex flex-1 items-center justify-center p-4 py-12">
                    <div className="text-center">
                        <Image src="https://picsum.photos/seed/empty-cart-page/400/300" alt="Auction Not Found" width={400} height={300} className="mx-auto mb-6 rounded-lg" />
                        <h2 className="text-2xl font-bold mb-2">Lelang Tidak Ditemukan</h2>
                        <p className="text-base-content/70 mb-6">Lelang yang Anda coba checkout mungkin sudah berakhir atau tidak valid.</p>
                        <Link href="/" className="btn btn-primary">
                            Kembali Belanja
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-base-200">
            <Header />
            <main className="container mx-auto flex-1 px-4 py-8">
                <motion.div
                    className="max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-6">
                        <Link href="/" className="flex items-center gap-2 text-primary hover:underline mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Kembali Belanja</span>
                        </Link>
                        <h1 className="text-3xl font-bold">Checkout</h1>
                        <p className="text-base-content/70">
                            {isAuctionCheckout
                                ? "Selesaikan pembelian lelang Anda dengan mengisi detail di bawah ini."
                                : "Selesaikan pesanan Anda dengan mengisi detail di bawah ini."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Kolom Kiri - Form Pembeli */}
                        <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Alamat Pengiriman</h2>
                            <BuyerForm onAddressSelect={setSelectedAddress} />
                        </div>

                        {/* Kolom Kanan - Ringkasan Pesanan */}
                        <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm self-start sticky top-24">
                            <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {isAuctionCheckout ? (
                                    // Auction item display
                                    auctionItem && (
                                        <div key={auctionItem.id} className="flex items-start gap-4">
                                            <Image src={auctionItem.product?.image || "/placeholder.svg"} alt={auctionItem.product?.name || "Auction Item"} width={64} height={64} className="rounded-md object-cover" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{auctionItem.product?.name}</p>
                                                <div className="text-xs text-base-content/70 flex flex-wrap gap-x-2">
                                                    <span>Pembelian Lelang - 1 x {formatPrice(auctionItem.currentBid || auctionItem.minBid)}</span>
                                                    <span className="badge badge-ghost badge-sm">{auctionItem.product?.weight || 0}g</span>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-sm">
                                                {formatPrice(auctionItem.currentBid || auctionItem.minBid)}
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    // Regular cart items display
                                    cartItems.map((item, index) => (
                                        <div key={`${item.product.id}-${item.product.flashSaleId || 'regular'}-${index}`} className="flex items-start gap-4">
                                            <Image src={item.product.image} alt={item.product.name} width={64} height={64} className="rounded-md object-cover" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{item.product.name}</p>
                                                <div className="text-xs text-base-content/70 flex flex-wrap gap-x-2">
                                                    <span>{item.quantity} x {formatPrice(item.product.flashSalePrice)}</span>
                                                    <span className="badge badge-ghost badge-sm">{item.product.weight || 0}g x {item.quantity} = {(item.product.weight || 0) * item.quantity}g</span>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-sm">{formatPrice(item.product.flashSalePrice * item.quantity)}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="divider"></div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal Produk</span>
                                    <span>{isAuctionCheckout ? formatPrice(auctionItem?.currentBid || auctionItem?.minBid || 0) : formatPrice(cartTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Ongkos Kirim</span>
                                    <span>{selectedAddress ? (isShippingAvailable ? formatPrice(shippingCost) : 'Tidak Tersedia') : 'Pilih alamat'}</span>
                                </div>

                                {/* Voucher Display/Input */}
                                {appliedVoucher ? (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <span>Voucher ({appliedVoucher.code})</span>
                                            <button onClick={handleRemoveVoucher} className="text-red-500 hover:text-red-700 text-xs underline">
                                                Hapus
                                            </button>
                                        </div>
                                        <span>- {formatPrice(appliedVoucher.discountAdjustment)}</span>
                                    </div>
                                ) : (
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Kode Voucher"
                                            className="input input-sm input-bordered w-full uppercase"
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                        />
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={handleApplyVoucher}
                                            disabled={!voucherCode || voucherLoading}
                                        >
                                            {voucherLoading ? '...' : 'Gunakan'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {selectedAddress && !isShippingAvailable && (
                                <div className="mt-4 p-3 bg-warning/10 text-warning text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Pengiriman ke kota ini belum tersedia.</span>
                                </div>
                            )}
                            <div className="divider"></div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Pesanan</span>
                                <div className="text-right">
                                    {appliedVoucher && (
                                        <span className="text-sm text-gray-400 line-through block font-normal">
                                            {formatPrice(isAuctionCheckout ? auctionFinalTotal : finalTotal)}
                                        </span>
                                    )}
                                    <span>{formatPrice(finalTotalWithDiscount)}</span>
                                </div>
                            </div>
                            <button
                                className="btn btn-primary w-full mt-6"
                                onClick={handlePlaceOrder}
                                disabled={!selectedAddress || !isShippingAvailable}
                            >
                                Buat Pesanan - {formatPrice(finalTotalWithDiscount)}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen w-full flex-col bg-base-100">
            <Header />
            <main className="container mx-auto flex flex-1 items-center justify-center p-4 py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </main>
        </div>}>
            <CheckoutContent />
        </Suspense>
    );
}
