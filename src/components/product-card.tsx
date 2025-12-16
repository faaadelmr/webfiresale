"use client";

import Image from 'next/image';
import type { CartProduct } from '@/lib/types';
import { CountdownTimer } from './countdown-timer';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: CartProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isSaleActive, setIsSaleActive] = useState(false);

  useEffect(() => {
    const checkSaleStatus = () => {
      if (!product.startDate || !product.endDate) {
        setIsSaleActive(false);
        return;
      }
      const now = new Date();
      const start = new Date(product.startDate);
      const end = new Date(product.endDate);
      setIsSaleActive(now >= start && now < end);
    };

    checkSaleStatus();
    const interval = setInterval(checkSaleStatus, 1000);

    return () => clearInterval(interval);
  }, [product.startDate, product.endDate]);

  const soldQuantity = product.sold || 0;
  const limitedQuantity = product.limitedQuantity || 0;
  const progress = limitedQuantity ? (soldQuantity / limitedQuantity) * 100 : 0;
  const quantityAvailable = limitedQuantity - soldQuantity;
  const isSoldOut = limitedQuantity ? quantityAvailable <= 0 : false;
  
  const discountPercentage = Math.round(((product.originalPrice - product.flashSalePrice) / product.originalPrice) * 100);

  return (
    <motion.div 
      className="card bg-base-100 shadow-xl overflow-hidden flex flex-col h-full"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <figure className="relative overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          width={600}
          height={400}
          className="aspect-[3/2] w-full object-cover transition-transform duration-500"
          data-ai-hint="product image"
        />
      </figure>
      <div className="card-body p-4 flex flex-col flex-1">
        <div className='flex-1'>
            <h3 className="card-title text-lg">{product.name}</h3>
            <p className="mt-1 text-sm text-base-content/70 h-10 overflow-hidden text-ellipsis">
                {product.description}
            </p>
        </div>
        <div className="mt-4">
          <div className="space-y-2">
            <progress className="progress progress-primary" value={progress} max="100" aria-label={`${progress}% terjual`}></progress>
            <div className="flex justify-between text-xs text-base-content/70">
              <span>Tersisa: {quantityAvailable}</span>
              <span>Terjual: {soldQuantity}</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.flashSalePrice)}
            </span>
            <span className="text-sm text-base-content/70 line-through">
              {formatPrice(product.originalPrice)}
            </span>
            {discountPercentage > 0 && (
                <div className="badge badge-outline border-primary text-primary">
                    {discountPercentage}% OFF
                </div>
            )}
          </div>
          <CountdownTimer saleStartDate={product.startDate} saleEndDate={product.endDate} />
          <motion.button
            className={`btn mt-4 w-full ${isSoldOut || !isSaleActive ? 'btn-disabled' : 'btn-primary'}`}
            onClick={() => addToCart(product)}
            disabled={isSoldOut || !isSaleActive}
            whileHover={!isSoldOut && isSaleActive ? { scale: 1.02 } : {}}
            whileTap={!isSoldOut && isSaleActive ? { scale: 0.98 } : {}}
          >
            {isSoldOut ? 'Stok Habis' : !isSaleActive ? 'Promo Belum Aktif' : 'Tambah ke Keranjang'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
