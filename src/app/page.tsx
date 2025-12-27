'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';

interface HotItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  type: 'auction' | 'flashsale';
  price?: number;
}

export default function Home() {
  const [hotItems, setHotItems] = useState<HotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHotItems = async () => {
      try {
        const items: HotItem[] = [];

        // Fetch latest auction
        const auctionRes = await fetch('/api/auctions?limit=1');
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

        // Fetch latest flash sale
        const flashSaleRes = await fetch('/api/flashsales?active=true&limit=1');
        if (flashSaleRes.ok) {
          const flashSales = await flashSaleRes.json();
          if (flashSales.length > 0) {
            const fs = flashSales[0];
            // API returns product.image for admin format, or image for cart format
            const imageUrl = fs.product?.image || fs.image || '/placeholder.png';
            const productName = fs.product?.name || fs.name || 'Flash Sale';
            const salePrice = fs.flashSalePrice;

            items.push({
              id: fs.id,
              title: productName,
              subtitle: 'Promo Kilat',
              image: imageUrl,
              href: '/flashsales',
              type: 'flashsale',
              price: salePrice,
            });
          }
        }

        setHotItems(items);
      } catch (error) {
        console.error('Error fetching hot items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotItems();
  }, []);

  return (
    <div className="flex w-full flex-col overflow-hidden">
      <section className="relative w-full overflow-hidden bg-base-100 pt-24 md:pt-32 pb-0">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
            <div className="flex flex-col justify-center space-y-6 z-10 text-center lg:text-left items-center lg:items-start">
              <Badge
                variant="outline"
                className="w-fit border-primary/30 bg-primary/5 py-1 text-sm font-medium text-primary"
              >
                Official Store Terpercaya
              </Badge>
              <h1 className="font-headline text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl leading-tight">
                Temukan Barang <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Impianmu</span> Disini.
              </h1>
              <p className="max-w-[600px] text-base-content/70 md:text-lg">
                Platform eksklusif yang menggabungkan lelang barang mewah dan flash sale elektronik
                dengan harga terbaik.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row pt-4">
                <Button asChild size="lg" className="rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20">
                  <Link href="/auctions">Mulai Belanja</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-base-300 bg-base-100 px-8 py-6 text-base hover:bg-base-200 hover:text-base-content"
                >
                  <Link href="/about">Pelajari Cara Kerja</Link>
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

            {/* Loading State */}
            {isLoading && (
              <div className="relative flex min-h-[450px] items-center justify-center lg:min-h-[600px] py-10 lg:py-0">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
