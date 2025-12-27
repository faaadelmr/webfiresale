'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Minus,
    Package,
    Plus,
    Zap,
    Clock,
    ShoppingCart,
    CreditCard,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
    const { addToCart } = useCart();
    const [flashSales, setFlashSales] = useState<FlashSaleProduct[]>([]);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    // Fetch flash sales from API
    useEffect(() => {
        const fetchFlashSales = async () => {
            try {
                const response = await fetch('/api/flashsales?active=true&forCart=true');
                if (response.ok) {
                    const data = await response.json();
                    setFlashSales(data);
                }
            } catch (error) {
                console.error('Error fetching flash sales:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFlashSales();
    }, []);

    const product = flashSales[currentProductIndex];

    // Countdown timer
    useEffect(() => {
        if (!product) return;

        const interval = setInterval(() => {
            const now = new Date();
            const endDate = new Date(product.endDate);
            const diff = endDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                clearInterval(interval);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(interval);
    }, [product]);

    const handleNavigation = (navDirection: number) => {
        setDirection(navDirection);
        setCurrentProductIndex((prevIndex) => {
            const newIndex = prevIndex + navDirection;
            if (newIndex < 0) return flashSales.length - 1;
            if (newIndex >= flashSales.length) return 0;
            return newIndex;
        });
        setQuantity(1);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);

    const handleAddToCart = () => {
        if (!product) return;

        // Check stock
        if (product.availableStock <= 0) {
            toast({
                title: 'Stok Habis',
                description: 'Maaf, produk ini sudah habis.',
                variant: 'destructive',
            });
            return;
        }

        // Check max order quantity
        if (product.maxOrderQuantity && quantity > product.maxOrderQuantity) {
            toast({
                title: 'Melebihi Batas',
                description: `Maksimal pembelian ${product.maxOrderQuantity} item per transaksi.`,
                variant: 'destructive',
            });
            return;
        }

        // Add to cart with flash sale info (CartProduct structure)
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

        // Add each item individually (cart context handles quantity)
        for (let i = 0; i < quantity; i++) {
            addToCart(cartProduct);
        }

        toast({
            title: '🛒 Ditambahkan ke Keranjang!',
            description: `${quantity} x "${product.name}" telah ditambahkan.`,
        });
    };

    const handleBuyNow = async () => {
        if (!product) return;

        // Check stock
        if (product.availableStock <= 0) {
            toast({
                title: 'Stok Habis',
                description: 'Maaf, produk ini sudah habis.',
                variant: 'destructive',
            });
            return;
        }

        // Check max order quantity
        if (product.maxOrderQuantity && quantity > product.maxOrderQuantity) {
            toast({
                title: 'Melebihi Batas',
                description: `Maksimal pembelian ${product.maxOrderQuantity} item per transaksi.`,
                variant: 'destructive',
            });
            return;
        }

        try {
            // Add to cart directly via API and wait for it to complete
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: quantity,
                    price: product.flashSalePrice,
                    flashSaleId: product.flashSaleId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add to cart');
            }

            // Wait for cart sync to complete, then redirect
            toast({
                title: '🛒 Menuju Checkout...',
                description: `${quantity} x "${product.name}" ditambahkan.`,
            });

            // Small delay to ensure cart is synced, then redirect
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

    const handleQuantityChange = (amount: number) => {
        if (!product) return;
        const maxQty = product.maxOrderQuantity || product.availableStock;
        setQuantity((prev) => Math.min(Math.max(1, prev + amount), maxQty));
    };

    const calculateDiscount = () => {
        if (!product) return 0;
        return Math.round(((product.originalPrice - product.flashSalePrice) / product.originalPrice) * 100);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    if (isLoading) {
        return (
            <div className="flex w-full min-h-screen items-center justify-center bg-primary">
                <div className="text-center text-primary-content">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4">Memuat Promo Kilat...</p>
                </div>
            </div>
        );
    }

    if (flashSales.length === 0) {
        return (
            <div className="flex w-full min-h-screen items-center justify-center bg-base-200">
                <div className="text-center text-base-content max-w-md mx-auto p-8">
                    <Zap className="h-20 w-20 mx-auto mb-6 opacity-50" />
                    <h2 className="text-3xl font-bold">Tidak Ada Promo Kilat</h2>
                    <p className="mt-4 opacity-80">Kembali lagi nanti untuk promo menarik!</p>
                    <Button
                        onClick={() => window.location.href = '/'}
                        className="mt-6 btn btn-primary"
                    >
                        Kembali ke Beranda
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full min-h-screen items-center justify-center bg-gradient-to-br from-primary to-secondary p-4 sm:p-8 overflow-hidden pt-20 sm:pt-0">
            <div className="relative flex flex-col justify-center w-full max-w-6xl rounded-3xl bg-base-100/20 backdrop-blur-md p-4 sm:p-6 shadow-2xl min-h-[80vh] sm:min-h-[70vh] border border-base-content/10">

                {/* Header with Navigation & Timer */}
                <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleNavigation(-1)} className="rounded-full text-primary-content/70 hover:bg-primary-content/20 hover:text-primary-content h-10 w-10">
                            <ArrowLeft size={20} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleNavigation(1)} className="rounded-full text-primary-content/70 hover:bg-primary-content/20 hover:text-primary-content h-10 w-10">
                            <ArrowRight size={20} />
                        </Button>
                        <span className="text-primary-content/60 text-sm ml-2">
                            {currentProductIndex + 1} / {flashSales.length}
                        </span>
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex items-center gap-2 bg-base-100/30 rounded-full px-4 py-2 backdrop-blur-sm">
                        <Clock className="h-4 w-4 text-primary-content" />
                        <span className="font-mono font-bold text-primary-content">
                            {String(timeLeft.hours).padStart(2, '0')}:
                            {String(timeLeft.minutes).padStart(2, '0')}:
                            {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* Discount Badge */}
                <div className="absolute top-20 left-4 sm:top-20 sm:left-6 z-20">
                    <div className="bg-accent text-accent-content font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        <span className="text-xl">-{calculateDiscount()}%</span>
                    </div>
                </div>

                {/* Main Content */}
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.main
                        key={currentProductIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="grid grid-cols-1 items-center gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 mt-24 sm:mt-20 p-4 sm:p-6"
                    >
                        {/* Left Column: Info */}
                        <div className="flex flex-col justify-center text-primary-content order-2 md:order-1 lg:col-span-1 text-center md:text-left">
                            <div>
                                <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl leading-tight">
                                    {product.name}
                                </h1>
                                <p className="mt-2 sm:mt-4 text-base sm:text-lg font-medium text-primary-content/80">
                                    {product.description}
                                </p>

                                {/* Stock Info */}
                                <div className="mt-4 sm:mt-6 flex flex-col gap-3">
                                    <div className="flex items-center justify-center md:justify-start gap-3 rounded-lg border border-primary-content/20 bg-base-100/20 p-3 max-w-max mx-auto md:mx-0">
                                        <Package className="h-6 w-6 text-primary-content/80" />
                                        <p className="text-sm font-medium text-primary-content">
                                            Stok: {product.availableStock} / {product.limitedQuantity}
                                        </p>
                                    </div>

                                    {/* Stock Progress Bar */}
                                    <div className="w-full max-w-xs mx-auto md:mx-0">
                                        <progress
                                            className="progress progress-accent w-full"
                                            value={product.sold}
                                            max={product.limitedQuantity}
                                        ></progress>
                                        <p className="text-xs text-primary-content/60 mt-1">
                                            {product.sold} terjual
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Center Column (Image with 3D Hover Effect) */}
                        <div className="relative flex flex-col items-center order-1 md:order-2 lg:col-span-1">
                            <div className="hover-3d">
                                <figure className="w-60 sm:w-72 md:w-80 rounded-2xl overflow-hidden">
                                    <Image
                                        src={product.image || '/placeholder.png'}
                                        alt={product.name}
                                        width={320}
                                        height={320}
                                        className="w-full h-auto object-contain drop-shadow-2xl"
                                    />
                                </figure>
                                {/* 8 empty divs needed for the 3D effect */}
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                        </div>

                        {/* Right Column: Actions */}
                        <div className="flex flex-col items-center justify-center text-primary-content order-3 md:order-3 lg:col-span-1">
                            <div className="text-center md:text-right w-full">
                                <p className="text-4xl sm:text-5xl font-bold text-primary-content">
                                    {formatCurrency(product.flashSalePrice)}
                                </p>
                                <p className="mt-1 text-base sm:text-lg font-medium text-primary-content/50 line-through">
                                    {formatCurrency(product.originalPrice)}
                                </p>
                            </div>

                            {/* Quantity & Action Buttons */}
                            <div className="mt-6 flex flex-col gap-4 w-full max-w-sm">
                                {/* Quantity Selector */}
                                <div className="flex items-center justify-center gap-3 rounded-full border border-primary-content/20 bg-base-100/10 p-1 w-fit mx-auto">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-base-100 text-base-content shadow hover:bg-base-200 transition-colors"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-8 text-center font-bold text-primary-content text-xl">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-base-100 text-base-content shadow hover:bg-base-200 transition-colors"
                                        disabled={quantity >= (product.maxOrderQuantity || product.availableStock)}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <Button
                                        onClick={handleAddToCart}
                                        disabled={product.availableStock <= 0}
                                        className="h-12 flex-1 rounded-full bg-base-100 text-base-content px-6 text-base font-semibold shadow-lg hover:bg-base-200 disabled:opacity-50 gap-2 border border-primary-content/20"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        Keranjang
                                    </Button>
                                    <Button
                                        onClick={handleBuyNow}
                                        disabled={product.availableStock <= 0}
                                        className="h-12 flex-1 rounded-full bg-accent text-accent-content px-6 text-base font-bold shadow-lg hover:bg-accent/90 disabled:opacity-50 gap-2"
                                    >
                                        <CreditCard className="h-5 w-5" />
                                        {product.availableStock <= 0 ? 'Habis' : 'Beli Sekarang'}
                                    </Button>
                                </div>
                            </div>

                            {/* Max Order Info */}
                            {product.maxOrderQuantity && (
                                <p className="mt-3 text-sm text-primary-content/60">
                                    Maks. {product.maxOrderQuantity} item per transaksi
                                </p>
                            )}
                        </div>
                    </motion.main>
                </AnimatePresence>
            </div>
        </div>
    );
}
