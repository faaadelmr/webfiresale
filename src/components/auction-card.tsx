"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import { CountdownTimer } from './countdown-timer';

export function AuctionCard({ product }: { product: any }) {
  return (
    <div className="card bg-base-100 shadow-xl overflow-hidden">
      <figure className="relative h-48 w-full">
        <Image
          src={product.product?.image || '/placeholder.svg'}
          alt={product.product?.name || 'Auction Item'}
          fill
          style={{ objectFit: "cover" }}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </figure>
      <div className="card-body p-4">
        <h3 className="font-semibold text-lg truncate">{product.product?.name || 'Unknown Item'}</h3>
        <p className="text-sm text-base-content/70">Tawaran saat ini: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.currentBid || product.minBid)}</p>
        <CountdownTimer saleStartDate={product.startDate} saleEndDate={product.endDate} />
        <div className="card-actions justify-end mt-4">
          {product.endDate && new Date() > new Date(product.endDate) && product.currentBid && product.currentBid > product.minBid ? (
            <Link href={`/checkout?auctionId=${product.id}`} passHref>
              <Button className="btn-success">Checkout Sekarang</Button>
            </Link>
          ) : (
            <Link href={`/auction/${product.id}`} passHref>
              <Button className="btn-primary">Lihat Lelang</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
