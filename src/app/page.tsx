'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { motion } from 'framer-motion';

interface HotItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  type: 'auction' | 'flashsale';
  price?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  quantityAvailable: number;
  weight: number;
}

interface Settings {
  bannerEnabled: boolean;
  bannerImage?: string;
  heroTagline?: string;
  heroSubtitle?: string;
}

export default function Home() {
  const [hotItems, setHotItems] = useState<HotItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [auctionRes, flashSaleRes, productsRes, settingsRes] = await Promise.all([
          fetch('/api/auctions?limit=1'),
          fetch('/api/flashsales?active=true&limit=1'),
          fetch('/api/products'),
          fetch('/api/settings')
        ]);

        // Process Hot Items
        const items: HotItem[] = [];

        if (auctionRes.ok) {
          const auctions = await auctionRes.json();
          const activeAuction = auctions.find((a: any) => a.status === 'active');
          if (activeAuction && activeAuction.product) {
            items.push({
              id: activeAuction.id,
              title: activeAuction.product.name,
              subtitle: 'Lelang Aktif',
              image: activeAuction.product.image || '/placeholder.png',
              href: '/auctions',
              type: 'auction',
              price: activeAuction.currentBid || activeAuction.minBid,
            });
          }
        }

        if (flashSaleRes.ok) {
          const flashSales = await flashSaleRes.json();
          if (flashSales.length > 0) {
            const fs = flashSales[0];
            const imageUrl = fs.product?.image || fs.image || '/placeholder.png';
            const productName = fs.product?.name || fs.name || 'Flash Sale';
            items.push({
              id: fs.id,
              title: productName,
              subtitle: 'Promo Kilat',
              image: imageUrl,
              href: '/flashsales',
              type: 'flashsale',
              price: fs.flashSalePrice,
            });
          }
        }
        setHotItems(items);

        // Process Products
        if (productsRes.ok) {
          const allProducts = await productsRes.json();
          setProducts(allProducts.filter((p: Product) => p.quantityAvailable > 0));
        }

        // Process Settings
        if (settingsRes.ok) {
          setSettings(await settingsRes.json());
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); // Prevent link navigation if wrapped in link

    addToCart({
      id: product.id,
      name: product.name,
      description: product.description,
      originalPrice: product.originalPrice,
      flashSalePrice: product.originalPrice, // Regular products sold at original price
      image: product.image,
      weight: product.weight,
      quantity: product.quantityAvailable, // Pass available stock as 'quantity' prop (Product type definition)
    });

    toast({
      title: "Success",
      description: "Product added to cart",
    });
  };

  return (
    <div className="flex w-full flex-col overflow-hidden">
      {/* Banner Section (if enabled) */}
      {settings?.bannerEnabled && settings.bannerImage && (
        <div className="w-full h-[300px] md:h-[400px] relative mt-16 md:mt-20">
          <Image
            src={settings.bannerImage}
            alt="Banner Promosi"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Hero Section */}
      <section className={`relative w-full overflow-hidden bg-base-100 ${settings?.bannerEnabled ? 'pt-10' : 'pt-16 md:pt-20'} pb-0`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
            <div className="flex flex-col justify-center space-y-6 z-10 text-center lg:text-left items-center lg:items-start">
              <Badge
                variant="outline"
                className="w-fit border-primary/30 bg-primary/5 py-1 text-sm font-medium text-primary"
              >
                Official Store Terpercaya
              </Badge>
              {isLoading ? (
                <div className="space-y-4 w-full">
                  <div className="h-16 md:h-20 w-3/4 bg-base-200 animate-pulse rounded-xl"></div>
                  <div className="h-16 md:h-20 w-1/2 bg-base-200 animate-pulse rounded-xl"></div>
                  <div className="h-6 w-full max-w-[500px] bg-base-200 animate-pulse rounded-lg mt-4"></div>
                </div>
              ) : (
                <>
                  <h1
                    className="font-headline text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl leading-tight"
                    dangerouslySetInnerHTML={{
                      __html: settings?.heroTagline ||
                        'Temukan Barang <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Impianmu</span> Disini.'
                    }}
                  />
                  <p className="max-w-[600px] text-base-content/70 md:text-lg">
                    {settings?.heroSubtitle || 'Platform eksklusif yang menggabungkan lelang barang mewah dan flash sale elektronik dengan harga terbaik.'}
                  </p>
                </>
              )}
              <div className="flex flex-col gap-4 sm:flex-row pt-4">
                <Button asChild size="lg" className="rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20">
                  <Link href="/products">Mulai Belanja</Link>
                </Button>
              </div>
            </div>

            {/* Cards Section - Only show if has items */}
            {!isLoading && hotItems.length > 0 && (
              <div className="relative flex min-h-[450px] items-center justify-center lg:min-h-[600px] py-10 lg:py-0">
                {/* Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl -z-10"></div>

                <div className="relative h-full w-full max-w-md sm:max-w-lg md:max-w-xl flex items-center justify-center mb-10">
                  {hotItems.map((item, index) => {
                    const isFirst = index === 0;
                    const isSingle = hotItems.length === 1;
                    return (
                      <Link href={item.href} key={item.id} className="block absolute transition-all duration-500 hover:z-20 z-0">
                        <Card
                          className="group relative w-[260px] sm:w-[280px] overflow-hidden rounded-3xl border-0 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-primary/20 ring-1 ring-white/10"
                          style={{
                            transform: isSingle
                              ? 'rotate(0deg) translate(0, 0)'
                              : `rotate(${isFirst ? -6 : 6}deg) translate(${isFirst ? '-30%' : '30%'}, ${isFirst ? '0%' : '10%'})`,
                            zIndex: isFirst ? 20 : 10,
                          }}
                        >
                          <Badge className={`absolute right-4 top-4 z-10 border-0 shadow-lg ${item.type === 'auction' ? 'badge-primary' : 'badge-error'} text-white`}>
                            {item.type === 'auction' ? 'LELANG' : 'PROMO'}
                          </Badge>
                          <div className="relative aspect-[3/4] w-full bg-muted">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                          </div>
                          <div className="absolute bottom-0 left-0 w-full p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <h3 className="font-bold text-xl mb-1 line-clamp-1">{item.title}</h3>
                            <p className="text-sm text-white/80 font-medium">{item.subtitle}</p>
                            {item.price && (
                              <p className="text-lg font-bold text-primary mt-2">{formatPrice(item.price)}</p>
                            )}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Available Products Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-base-100 via-base-200/30 to-base-100 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary w-fit">
                Koleksi Pilihan
              </h2>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Lihat Semua Produk
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <span className="loading loading-dots loading-lg text-primary"></span>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group relative bg-base-100 rounded-2xl overflow-hidden border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    {/* Badge Stock */}
                    <div className="absolute top-3 left-3 z-10">
                      {product.quantityAvailable < 5 ? (
                        <Badge variant="destructive" className="bg-error/90 backdrop-blur-sm shadow-sm">
                          Stok Menipis: {product.quantityAvailable}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-base-100/80 backdrop-blur-sm shadow-sm backdrop-brightness-110">
                          Tersedia
                        </Badge>
                      )}
                    </div>

                    <div className="relative aspect-[4/5] overflow-hidden bg-base-200/50">
                      <Image
                        src={product.image || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-base-content/50 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-base-200/50">
                        <div className="flex flex-col">
                          <span className="text-xs text-base-content/50">Harga Normal</span>
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(product.originalPrice)}
                          </span>
                        </div>
                        <Button
                          onClick={(e) => handleAddToCart(e, product)}
                          size="icon"
                          className="h-10 w-10 rounded-full bg-base-100 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all active:scale-95"
                          title="Tambah ke Keranjang"
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-base-300 rounded-3xl bg-base-50/50">
              <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-base-content/30" />
              </div>
              <h3 className="text-lg font-semibold text-base-content/70">Stok Kosong</h3>
              <p className="text-sm text-base-content/50">Belum ada produk yang tersedia saat ini.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
