'use client';

import * as React from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Zap,
    Clock,
    ShoppingCart,
    CreditCard,
    Minus,
    Plus,
    Package,
    ChevronLeft,
    ChevronRight,
    Flame,
    TrendingUp,
    Timer,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

interface FlashSaleProduct {
    id: string;
    name: string;
    description: string;
    image: string;
    originalPrice: number;
    quantity: number;
    weight: number;
    flashSaleId: string;
    flashSalePrice: number;
    maxOrderQuantity: number | null;
    limitedQuantity: number;
    sold: number;
    availableStock: number;
    startDate: string;
    endDate: string;
}

export default function FlashSalePage() {
    const { toast } = useToast();
    const { addToCart, cartItems } = useCart();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [flashSales, setFlashSales] = React.useState<FlashSaleProduct[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [quantities, setQuantities] = React.useState<{ [key: string]: number }>({});
    const [timeLeftMap, setTimeLeftMap] = React.useState<{ [key: string]: { hours: number; minutes: number; seconds: number } }>({});
    const [direction, setDirection] = React.useState(0);
    const [orderedFlashSaleIds, setOrderedFlashSaleIds] = React.useState<Set<string>>(new Set());

    // Fetch flash sales from API
    React.useEffect(() => {
        const fetchFlashSales = async () => {
            try {
                const response = await fetch('/api/flashsales?active=true&forCart=true');
                if (response.ok) {
                    const data = await response.json();
                    setFlashSales(data);
                    const initialQuantities: { [key: string]: number } = {};
                    data.forEach((p: FlashSaleProduct) => {
                        initialQuantities[p.id] = 1;
                    });
                    setQuantities(initialQuantities);
                }
            } catch (error) {
                console.error('Error fetching flash sales:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFlashSales();
    }, []);

    // Fetch user's orders to check for existing flash sale purchases
    React.useEffect(() => {
        if (status !== 'authenticated') return;

        const fetchUserOrders = async () => {
            try {
                const response = await fetch('/api/orders');
                if (response.ok) {
                    const orders = await response.json();
                    // Get flash sale IDs from pending/processing orders
                    const flashSaleIds = new Set<string>();
                    orders.forEach((order: any) => {
                        if (['Pending', 'Processing', 'Shipped'].includes(order.status)) {
                            order.orderItems?.forEach((item: any) => {
                                // Check if this product is in our flash sales list
                                const flashSaleProduct = flashSales.find(fs => fs.id === item.productId);
                                if (flashSaleProduct?.flashSaleId) {
                                    flashSaleIds.add(flashSaleProduct.flashSaleId);
                                }
                            });
                        }
                    });
                    setOrderedFlashSaleIds(flashSaleIds);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
        };

        if (flashSales.length > 0) {
            fetchUserOrders();
        }
    }, [status, flashSales]);

    // Countdown timer for all products
    React.useEffect(() => {
        if (flashSales.length === 0) return;

        const interval = setInterval(() => {
            const newTimeLeftMap: { [key: string]: { hours: number; minutes: number; seconds: number } } = {};

            flashSales.forEach((product) => {
                const now = new Date();
                const endDate = new Date(product.endDate);
                const diff = endDate.getTime() - now.getTime();

                if (diff <= 0) {
                    newTimeLeftMap[product.id] = { hours: 0, minutes: 0, seconds: 0 };
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    newTimeLeftMap[product.id] = { hours, minutes, seconds };
                }
            });

            setTimeLeftMap(newTimeLeftMap);
        }, 1000);

        return () => clearInterval(interval);
    }, [flashSales]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);

    const calculateDiscount = (product: FlashSaleProduct) => {
        return Math.round(((product.originalPrice - product.flashSalePrice) / product.originalPrice) * 100);
    };

    const isFlashSaleEnded = (product: FlashSaleProduct) => {
        const now = new Date();
        const endDate = new Date(product.endDate);
        return endDate < now || product.availableStock <= 0;
    };

    const getStockPercentage = (product: FlashSaleProduct) => {
        return Math.round((product.sold / product.limitedQuantity) * 100);
    };

    // Check if product is already in cart
    const isInCart = (product: FlashSaleProduct) => {
        return cartItems.some(item =>
            item.product.id === product.id &&
            item.product.flashSaleId === product.flashSaleId
        );
    };

    // Check if product has already been ordered
    const hasBeenOrdered = (product: FlashSaleProduct) => {
        return orderedFlashSaleIds.has(product.flashSaleId);
    };

    // Check if buttons should be disabled
    const isButtonDisabled = (product: FlashSaleProduct) => {
        return isInCart(product) || hasBeenOrdered(product);
    };

    // Get button disabled reason
    const getDisabledReason = (product: FlashSaleProduct) => {
        if (hasBeenOrdered(product)) {
            return 'Anda sudah memesan produk ini';
        }
        if (isInCart(product)) {
            return 'Sudah ada di keranjang';
        }
        return '';
    };

    const handleQuantityChange = (productId: string, amount: number, product: FlashSaleProduct) => {
        const maxQty = product.maxOrderQuantity || product.availableStock;
        setQuantities((prev) => ({
            ...prev,
            [productId]: Math.min(Math.max(1, (prev[productId] || 1) + amount), maxQty)
        }));
    };

    const handleAddToCart = (product: FlashSaleProduct) => {
        // Check if user is logged in
        if (status !== 'authenticated') {
            toast({
                title: 'Silakan Login',
                description: 'Anda harus login terlebih dahulu untuk menambahkan ke keranjang.',
            });
            router.push('/login?callbackUrl=/flashsales');
            return;
        }

        const quantity = quantities[product.id] || 1;

        if (product.availableStock <= 0) {
            toast({
                title: 'Stok Habis',
                description: 'Maaf, produk ini sudah habis.',
                variant: 'destructive',
            });
            return;
        }

        const cartProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            image: product.image,
            originalPrice: product.originalPrice,
            quantity: product.quantity,
            weight: product.weight,
            flashSaleId: product.flashSaleId,
            flashSalePrice: product.flashSalePrice,
            maxOrderQuantity: product.maxOrderQuantity || undefined,
            limitedQuantity: product.limitedQuantity,
            sold: product.sold,
            startDate: new Date(product.startDate),
            endDate: new Date(product.endDate),
        };

        for (let i = 0; i < quantity; i++) {
            addToCart(cartProduct);
        }

        toast({
            title: '🛒 Ditambahkan ke Keranjang!',
            description: `${quantity} x "${product.name}" telah ditambahkan.`,
        });
    };

    const handleBuyNow = async (product: FlashSaleProduct) => {
        // Check if user is logged in
        if (status !== 'authenticated') {
            toast({
                title: 'Silakan Login',
                description: 'Anda harus login terlebih dahulu untuk melakukan pembelian.',
            });
            router.push('/login?callbackUrl=/flashsales');
            return;
        }

        const quantity = quantities[product.id] || 1;

        if (product.availableStock <= 0) {
            toast({
                title: 'Stok Habis',
                description: 'Maaf, produk ini sudah habis.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: quantity,
                    price: product.flashSalePrice,
                    flashSaleId: product.flashSaleId,
                }),
            });

            if (!response.ok) throw new Error('Failed to add to cart');

            toast({
                title: '🛒 Menuju Checkout...',
                description: `${quantity} x "${product.name}" ditambahkan.`,
            });

            await new Promise(resolve => setTimeout(resolve, 300));
            window.location.href = '/checkout';
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast({
                title: 'Gagal',
                description: 'Terjadi kesalahan saat menambahkan ke keranjang.',
                variant: 'destructive',
            });
        }
    };

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % flashSales.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + flashSales.length) % flashSales.length);
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
        }),
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Zap className="h-16 w-16 text-warning animate-pulse" />
                        <div className="absolute inset-0 h-16 w-16 bg-warning/20 rounded-full animate-ping" />
                    </div>
                    <p className="text-base-content/60 font-medium">Memuat Flash Sale...</p>
                </div>
            </div>
        );
    }

    if (flashSales.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="relative inline-block mb-6">
                        <Zap className="h-24 w-24 text-base-content/20" />
                    </div>
                    <h2 className="text-3xl font-bold text-base-content mb-2">Tidak Ada Flash Sale</h2>
                    <p className="text-base-content/60 mb-6">Kembali lagi nanti untuk promo menarik!</p>
                    <Button onClick={() => window.location.href = '/'} className="btn btn-primary">
                        Kembali ke Beranda
                    </Button>
                </div>
            </div>
        );
    }

    const currentProduct = flashSales[currentIndex];
    const timeLeft = timeLeftMap[currentProduct?.id] || { hours: 0, minutes: 0, seconds: 0 };
    const quantity = quantities[currentProduct?.id] || 1;
    const isEnded = isFlashSaleEnded(currentProduct);
    const stockPercentage = getStockPercentage(currentProduct);

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-warning/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-error/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Main Content */}
            <main className="relative z-10 px-6 pb-12 pt-24">
                <div className="max-w-7xl mx-auto">
                    {/* Product Card */}
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 },
                            }}
                            className="relative"
                        >
                            <div className="bg-base-100/80 backdrop-blur-xl rounded-3xl border border-base-content/10 shadow-2xl overflow-hidden">
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    {/* Left: Product Image Section */}
                                    <div className="relative p-8 flex items-center justify-center bg-gradient-to-br from-base-200 to-base-100">
                                        {/* Discount Badge with Navigation Arrows */}
                                        <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {/* Previous Arrow */}
                                                <button
                                                    onClick={prevSlide}
                                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-base-100/80 backdrop-blur-sm border border-base-content/20 hover:bg-base-100 hover:scale-110 transition-all shadow-lg"
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </button>

                                                {/* Discount Badge */}
                                                <div className="relative">
                                                    <div className="bg-gradient-to-r from-error to-warning text-white font-black text-2xl md:text-3xl px-6 py-3 rounded-2xl shadow-lg shadow-error/30">
                                                        -{calculateDiscount(currentProduct)}%
                                                    </div>
                                                    <div className="absolute -top-2 -right-2">
                                                        <Zap className="h-6 w-6 text-warning fill-warning animate-pulse" />
                                                    </div>
                                                </div>

                                                {/* Next Arrow */}
                                                <button
                                                    onClick={nextSlide}
                                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-base-100/80 backdrop-blur-sm border border-base-content/20 hover:bg-base-100 hover:scale-110 transition-all shadow-lg"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </div>

                                            {/* Counter Badge */}
                                            <div className="bg-base-100/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium border border-base-content/20">
                                                {currentIndex + 1} / {flashSales.length}
                                            </div>
                                        </div>

                                        {/* Product Image with 3D Effect */}
                                        <div className="hover-3d relative">
                                            <figure className="w-64 md:w-80 rounded-2xl overflow-hidden">
                                                <Image
                                                    src={currentProduct.image || '/placeholder.png'}
                                                    alt={currentProduct.name}
                                                    width={320}
                                                    height={400}
                                                    className={cn(
                                                        "w-full h-auto object-contain transition-all duration-300",
                                                        isEnded && "opacity-50 grayscale"
                                                    )}
                                                />
                                            </figure>
                                            <div></div><div></div><div></div><div></div>
                                            <div></div><div></div><div></div><div></div>
                                        </div>

                                        {/* Ended Overlay */}
                                        {isEnded && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-base-100/50 backdrop-blur-sm">
                                                <div className="transform -rotate-12 border-4 border-error px-8 py-3 rounded-xl bg-error/10">
                                                    <span className="text-4xl md:text-5xl font-black text-error tracking-wider">
                                                        {currentProduct.availableStock <= 0 ? 'HABIS' : 'SELESAI'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Product Details */}
                                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                                        {/* Timer Section */}
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 text-base-content/60 mb-3">
                                                <Timer className="h-4 w-4" />
                                                <span className="text-sm font-medium uppercase tracking-wider">Berakhir dalam</span>
                                            </div>
                                            <div className="flex gap-3">
                                                {[
                                                    { value: timeLeft.hours, label: 'Jam' },
                                                    { value: timeLeft.minutes, label: 'Menit' },
                                                    { value: timeLeft.seconds, label: 'Detik' },
                                                ].map((item, idx) => (
                                                    <div key={idx} className="text-center">
                                                        <div className="bg-gradient-to-b from-base-200 to-base-300 rounded-xl px-4 py-3 min-w-[70px] border border-base-content/10">
                                                            <span className="text-3xl md:text-4xl font-black text-base-content">
                                                                {String(item.value).padStart(2, '0')}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-base-content/50 mt-1 block">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Product Info */}
                                        <div className="mb-6">
                                            <h2 className="text-2xl md:text-3xl font-bold text-base-content mb-2">
                                                {currentProduct.name}
                                            </h2>
                                            <p className="text-base-content/60 text-sm line-clamp-2">
                                                {currentProduct.description}
                                            </p>
                                        </div>

                                        {/* Price Section */}
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-3 mb-1">
                                                <span className="text-3xl md:text-4xl font-black text-error">
                                                    {formatCurrency(currentProduct.flashSalePrice)}
                                                </span>
                                                <span className="text-lg text-base-content/40 line-through">
                                                    {formatCurrency(currentProduct.originalPrice)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-success text-sm font-medium">
                                                <TrendingUp className="h-4 w-4" />
                                                Hemat {formatCurrency(currentProduct.originalPrice - currentProduct.flashSalePrice)}
                                            </div>
                                        </div>

                                        {/* Stock Progress */}
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-base-content/60" />
                                                    <span className="text-base-content/60">Stok tersedia</span>
                                                </div>
                                                <span className="font-bold text-base-content">
                                                    {currentProduct.availableStock} / {currentProduct.limitedQuantity}
                                                </span>
                                            </div>
                                            <div className="relative h-3 bg-base-200 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                                                        stockPercentage >= 80 ? "bg-error" : stockPercentage >= 50 ? "bg-warning" : "bg-success"
                                                    )}
                                                    style={{ width: `${stockPercentage}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-base-content/50 mt-1">
                                                {stockPercentage >= 80 ? '🔥 Hampir habis!' : stockPercentage >= 50 ? '⏰ Stok menipis' : '✨ Stok masih tersedia'}
                                            </p>
                                        </div>

                                        {/* Quantity & Actions */}
                                        {!isEnded && (
                                            <div className="space-y-4">
                                                {/* Quantity Selector */}
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-medium text-base-content/60">Jumlah:</span>
                                                    <div className="flex items-center gap-2 bg-base-200 rounded-full p-1">
                                                        <button
                                                            onClick={() => handleQuantityChange(currentProduct.id, -1, currentProduct)}
                                                            disabled={quantity <= 1}
                                                            className="h-10 w-10 rounded-full flex items-center justify-center bg-base-100 hover:bg-base-300 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                                                        <button
                                                            onClick={() => handleQuantityChange(currentProduct.id, 1, currentProduct)}
                                                            disabled={quantity >= (currentProduct.maxOrderQuantity || currentProduct.availableStock)}
                                                            className="h-10 w-10 rounded-full flex items-center justify-center bg-base-100 hover:bg-base-300 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {currentProduct.maxOrderQuantity && (
                                                        <span className="text-xs text-base-content/50">
                                                            Maks. {currentProduct.maxOrderQuantity}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-col gap-3">
                                                    {isButtonDisabled(currentProduct) && (
                                                        <div className="bg-info/20 text-info px-4 py-2 rounded-lg text-sm font-medium text-center">
                                                            {getDisabledReason(currentProduct)}
                                                        </div>
                                                    )}
                                                    <div className="flex gap-3">
                                                        <Button
                                                            onClick={() => handleAddToCart(currentProduct)}
                                                            disabled={isButtonDisabled(currentProduct)}
                                                            className="flex-1 h-14 rounded-xl bg-base-200 hover:bg-base-300 text-base-content font-bold gap-2 border border-base-content/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <ShoppingCart className="h-5 w-5" />
                                                            {isInCart(currentProduct) ? 'Sudah di Keranjang' : 'Keranjang'}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleBuyNow(currentProduct)}
                                                            disabled={isButtonDisabled(currentProduct)}
                                                            className="flex-1 h-14 rounded-xl bg-gradient-to-r from-error to-warning hover:opacity-90 text-white font-bold gap-2 shadow-lg shadow-error/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                                                        >
                                                            <CreditCard className="h-5 w-5" />
                                                            {hasBeenOrdered(currentProduct) ? 'Sudah Dipesan' : 'Beli Sekarang'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {isEnded && (
                                            <div className="bg-base-200 rounded-xl p-4 text-center">
                                                <p className="text-base-content/60 font-medium">
                                                    Flash Sale ini telah berakhir
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Other Flash Sales Preview */}
                    {flashSales.length > 1 && (
                        <div className="mt-12">
                            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-warning" />
                                Flash Sale Lainnya
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {flashSales.filter((_, idx) => idx !== currentIndex).slice(0, 4).map((product, idx) => (
                                    <button
                                        key={product.id}
                                        onClick={() => {
                                            const newIdx = flashSales.findIndex(p => p.id === product.id);
                                            setDirection(newIdx > currentIndex ? 1 : -1);
                                            setCurrentIndex(newIdx);
                                        }}
                                        className="group bg-base-100/50 backdrop-blur-sm rounded-xl p-4 border border-base-content/10 hover:border-warning/50 hover:bg-base-100 transition-all text-left"
                                    >
                                        <div className="relative mb-3">
                                            <Image
                                                src={product.image || '/placeholder.png'}
                                                alt={product.name}
                                                width={100}
                                                height={100}
                                                className="w-full h-24 object-contain rounded-lg"
                                            />
                                            <div className="absolute top-1 right-1 bg-error text-white text-xs font-bold px-2 py-1 rounded-md">
                                                -{calculateDiscount(product)}%
                                            </div>
                                        </div>
                                        <p className="font-medium text-sm text-base-content truncate group-hover:text-warning transition-colors">
                                            {product.name}
                                        </p>
                                        <p className="text-error font-bold text-sm">
                                            {formatCurrency(product.flashSalePrice)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
