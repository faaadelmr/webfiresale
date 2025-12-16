"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CartProduct } from '@/lib/types';
import { AuctionCard } from '@/components/auction-card';
import { Hammer } from 'lucide-react';

export function AuctionGrid() {
  const [activeAuctions, setActiveAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const response = await fetch('/api/auctions?active=true');
        if (!response.ok) {
          throw new Error('Failed to fetch auctions');
        }
        const data = await response.json();
        setActiveAuctions(data);
      } catch (error) {
        console.error('Error fetching auctions:', error);
        // Fallback to empty array on error
        setActiveAuctions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Hammer className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Lelang Saat Ini</h2>
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
      ) : activeAuctions.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeAuctions.map((product) => (
            <AuctionCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-base-content/20 rounded-lg text-center">
          <Image src="https://picsum.photos/seed/no-results/300/200" alt="No auctions found" width={300} height={200} className="mb-4 rounded-md" data-ai-hint="empty box" />
          <h3 className="text-xl font-semibold">Tidak Ada Lelang Saat Ini</h3>
          <p className="text-base-content/70">Silakan kembali lagi nanti untuk melihat barang lelang kami!</p>
        </div>
      )}
    </div>
  );
}
