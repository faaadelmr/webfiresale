'use client';

import { LuShoppingCart, LuClock } from 'react-icons/lu';
import Link from 'next/link';

export default function ProductCard({ product }) {
  const isFlashSale = product.isFlashSale && product.saleEndTime;
  
  // Calculate time remaining if it's a flash sale
  let timeRemaining = null;
  if (isFlashSale && product.saleEndTime) {
    const endTime = new Date(product.saleEndTime);
    const now = new Date();
    const diff = endTime - now;
    
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeRemaining = `${hours}h ${minutes}m`;
    } else {
      timeRemaining = 'Encerrado';
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
      {product.images && product.images.length > 0 && (
        <div className="relative">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          {isFlashSale && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
              FLASH SALE!
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        {isFlashSale && timeRemaining && timeRemaining !== 'Encerrado' && (
          <div className="flex items-center gap-1 mb-2 text-red-400">
            <LuClock size={16} />
            <span className="text-xs">{timeRemaining} restantes</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            {isFlashSale && product.discountPrice && (
              <>
                <span className="text-xl font-bold text-green-400">
                  Rp{product.discountPrice.toFixed(2)}
                </span>
                <span className="text-gray-500 line-through ml-2">
                  Rp{product.price.toFixed(2)}
                </span>
              </>
            )}
            {!isFlashSale && (
              <span className="text-xl font-bold">Rp{product.price.toFixed(2)}</span>
            )}
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded-full transition-colors">
            <LuShoppingCart />
          </button>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          Estoque: {product.stock} unidades
        </div>
      </div>
    </div>
  );
}