'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Package, Grid3X3, LayoutList, SlidersHorizontal, X, Minus, Plus, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    description: string;
    image: string;
    originalPrice: number;
    quantityAvailable: number;
    weight: number;
    createdAt: string;
}

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name-az' | 'name-za';
type ViewMode = 'grid' | 'list';

export default function ProductsPage() {
    const { toast } = useToast();
    const { addToCart } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data.filter((p: Product) => p.quantityAvailable > 0));
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Reset quantity when product changes
    useEffect(() => {
        setQuantity(1);
    }, [selectedProduct]);

    // Filtered and sorted products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.description?.toLowerCase().includes(query)
            );
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case 'price-low':
                result.sort((a, b) => a.originalPrice - b.originalPrice);
                break;
            case 'price-high':
                result.sort((a, b) => b.originalPrice - a.originalPrice);
                break;
            case 'name-az':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-za':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }

        return result;
    }, [products, searchQuery, sortBy]);

    const handleAddToCart = (e: React.MouseEvent, product: Product, qty: number = 1) => {
        e.preventDefault();
        e.stopPropagation();

        for (let i = 0; i < qty; i++) {
            addToCart({
                id: product.id,
                name: product.name,
                description: product.description,
                originalPrice: product.originalPrice,
                flashSalePrice: product.originalPrice,
                image: product.image,
                weight: product.weight,
                quantity: product.quantityAvailable,
            });
        }

        toast({
            title: '🛒 Berhasil!',
            description: `${qty}x ${product.name} ditambahkan ke keranjang`,
        });

        if (selectedProduct) {
            setSelectedProduct(null);
        }
    };

    const openProductModal = (product: Product) => {
        setSelectedProduct(product);
        setQuantity(1);
    };

    const closeModal = () => {
        setSelectedProduct(null);
    };

    const handleQuantityChange = (amount: number) => {
        if (!selectedProduct) return;
        const newQty = quantity + amount;
        if (newQty >= 1 && newQty <= selectedProduct.quantityAvailable) {
            setQuantity(newQty);
        }
    };

    return (
        <div className="min-h-screen bg-base-100 pt-20">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary/10 via-base-200 to-secondary/10 border-b border-base-200">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Semua Produk</h1>
                            <p className="text-base-content/60">
                                {filteredProducts.length} produk tersedia
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
                            <Input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 h-11 bg-base-100 border-base-300 rounded-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="sticky top-16 z-30 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Filter Toggle (Mobile) */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="md:hidden gap-2"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filter
                        </Button>

                        {/* Sort Options */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-base-content/60 hidden sm:inline">Urutkan:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="select select-sm select-bordered bg-base-100 min-w-[140px]"
                            >
                                <option value="newest">Terbaru</option>
                                <option value="oldest">Terlama</option>
                                <option value="price-low">Harga Terendah</option>
                                <option value="price-high">Harga Tertinggi</option>
                                <option value="name-az">Nama A-Z</option>
                                <option value="name-za">Nama Z-A</option>
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-base-200 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                    ? 'bg-base-100 text-primary shadow-sm'
                                    : 'text-base-content/50 hover:text-base-content'
                                    }`}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                    ? 'bg-base-100 text-primary shadow-sm'
                                    : 'text-base-content/50 hover:text-base-content'
                                    }`}
                            >
                                <LayoutList className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Package className="h-16 w-16 text-base-content/20 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Tidak ada produk ditemukan</h3>
                        <p className="text-base-content/60 mb-6">
                            {searchQuery
                                ? `Coba kata kunci lain selain "${searchQuery}"`
                                : 'Belum ada produk yang tersedia saat ini'}
                        </p>
                        {searchQuery && (
                            <Button variant="outline" onClick={() => setSearchQuery('')}>
                                Hapus Pencarian
                            </Button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid View with 3D Effect */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="flex flex-col cursor-pointer"
                                onClick={() => openProductModal(product)}
                            >
                                {/* 3D Hover Image */}
                                <div className="hover-3d mb-3">
                                    <figure className="w-full aspect-square rounded-2xl overflow-hidden bg-base-200">
                                        <Image
                                            src={product.image || '/placeholder.png'}
                                            alt={product.name}
                                            width={300}
                                            height={300}
                                            className="w-full h-full object-cover"
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
                                {/* Product Info */}
                                <div className="px-1">
                                    <h3 className="font-medium text-sm mb-1 line-clamp-2 min-h-[40px]">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <p className="text-primary font-bold">
                                            {formatPrice(product.originalPrice)}
                                        </p>
                                        <span className="text-xs text-base-content/50">
                                            Stok: {product.quantityAvailable}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={(e) => handleAddToCart(e, product)}
                                        size="sm"
                                        className="w-full gap-1 text-xs"
                                    >
                                        <ShoppingCart className="h-3 w-3" />
                                        Tambah ke Keranjang
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="flex flex-col gap-3">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="group flex gap-4 bg-base-100 rounded-xl p-4 border border-base-200 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                                onClick={() => openProductModal(product)}
                            >
                                <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-base-200">
                                    <Image
                                        src={product.image || '/placeholder.png'}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <h3 className="font-semibold text-base md:text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-base-content/60 line-clamp-2 mb-2 hidden sm:block">
                                        {product.description}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-lg md:text-xl font-bold text-primary">
                                                {formatPrice(product.originalPrice)}
                                            </p>
                                            <p className="text-xs text-base-content/50">
                                                Stok: {product.quantityAvailable}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={(e) => handleAddToCart(e, product)}
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                            <span className="hidden sm:inline">Tambah</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Back to Home Link */}
            <div className="container mx-auto px-4 pb-8">
                <div className="flex justify-center">
                    <Link
                        href="/"
                        className="text-sm text-base-content/60 hover:text-primary transition-colors"
                    >
                        ← Kembali ke Beranda
                    </Link>
                </div>
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-base-100 rounded-3xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="grid md:grid-cols-2 gap-6 p-6">
                            {/* Product Image with 3D Effect */}
                            <div className="flex items-center justify-center">
                                <div className="hover-3d">
                                    <figure className="w-64 md:w-72 aspect-square rounded-2xl overflow-hidden bg-base-200">
                                        <Image
                                            src={selectedProduct.image || '/placeholder.png'}
                                            alt={selectedProduct.name}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover"
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

                            {/* Product Details */}
                            <div className="flex flex-col">
                                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                    {selectedProduct.name}
                                </h2>

                                <p className="text-base-content/60 mb-4 flex-1">
                                    {selectedProduct.description || 'Tidak ada deskripsi tersedia untuk produk ini.'}
                                </p>

                                {/* Product Info */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Package className="h-4 w-4 text-base-content/50" />
                                        <span className="text-base-content/60">Stok tersedia:</span>
                                        <span className="font-semibold">{selectedProduct.quantityAvailable} unit</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Scale className="h-4 w-4 text-base-content/50" />
                                        <span className="text-base-content/60">Berat:</span>
                                        <span className="font-semibold">{selectedProduct.weight} gram</span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <p className="text-sm text-base-content/60 mb-1">Harga</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {formatPrice(selectedProduct.originalPrice)}
                                    </p>
                                </div>

                                {/* Quantity Selector */}
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="text-sm text-base-content/60">Jumlah:</span>
                                    <div className="flex items-center gap-2 bg-base-200 rounded-full p-1">
                                        <button
                                            onClick={() => handleQuantityChange(-1)}
                                            disabled={quantity <= 1}
                                            className="p-2 rounded-full hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-10 text-center font-bold">{quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(1)}
                                            disabled={quantity >= selectedProduct.quantityAvailable}
                                            className="p-2 rounded-full hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div className="flex items-center justify-between py-3 border-t border-base-200 mb-4">
                                    <span className="text-base-content/60">Subtotal:</span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatPrice(selectedProduct.originalPrice * quantity)}
                                    </span>
                                </div>

                                {/* Add to Cart Button */}
                                <Button
                                    onClick={(e) => handleAddToCart(e, selectedProduct, quantity)}
                                    size="lg"
                                    className="w-full gap-2 rounded-full"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    Tambah ke Keranjang
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
