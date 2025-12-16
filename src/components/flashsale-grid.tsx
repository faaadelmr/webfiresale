"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CartProduct } from '@/lib/types';
import { ProductCard } from './product-card';
import { Zap } from 'lucide-react';

export function FlashSaleGrid() {
  const [activeFlashSales, setActiveFlashSales] = useState<CartProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const response = await fetch('/api/flashsales?active=true&forCart=true');
        if (!response.ok) {
          throw new Error('Failed to fetch flash sales');
        }
        const data = await response.json();
        setActiveFlashSales(data);
      } catch (error) {
        console.error('Error fetching flash sales:', error);
        // Fallback to empty array on error
        setActiveFlashSales([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashSales();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Flash Sale Berlangsung!</h2>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card bg-base-100 shadow-xl overflow-hidden">
              <div className="skeleton h-48 w-full"></div>
              <div className="card-body p-4 space-y-3">
                <div className="skeleton h-5 w-3/4"></div>
                <div className="skeleton h-4 w-1/2"></div>
                <div className="flex justify-between items-center">
                  <div className="skeleton h-6 w-1/4"></div>
                  <div className="skeleton h-10 w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeFlashSales.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeFlashSales.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-base-content/20 rounded-lg text-center">
          <Image src="https://picsum.photos/seed/no-results/300/200" alt="No flash sales found" width={300} height={200} className="mb-4 rounded-md" data-ai-hint="empty box" />
          <h3 className="text-xl font-semibold">Tidak Ada Flash Sale Saat Ini</h3>
          <p className="text-base-content/70">Silakan kembali lagi nanti untuk melihat penawaran istimewa kami!</p>
        </div>
      )}
    </div>
  );
}
