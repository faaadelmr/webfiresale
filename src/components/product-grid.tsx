
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useCart } from '@/hooks/use-cart';

// Define the Product type to match the API response
type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  quantityAvailable: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
};

function RegularProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    // Adapt Product to CartProduct for adding to cart
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      originalPrice: product.originalPrice,
      quantity: product.quantityAvailable, // Map quantityAvailable to quantity
      weight: product.weight,
      flashSalePrice: product.originalPrice, // Use original price for non-flash-sale items
    };
    addToCart(cartProduct);
  };

  return (
    <motion.div
      className="card bg-base-100 shadow-xl overflow-hidden flex flex-col h-full"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
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
          className="aspect-[3/2] w-full object-cover"
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
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.originalPrice)}
            </span>
          </div>
           <motion.button
            className="btn btn-primary mt-4 w-full"
            onClick={handleAddToCart}
          >
            Tambah ke Keranjang
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}


export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data: Product[] = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="card bg-base-100 shadow-xl overflow-hidden">
                    <div className="skeleton h-48 w-full"></div>
                    <div className="card-body p-4 space-y-3">
                        <div className="skeleton h-5 w-3/4"></div>
                        <div className="skeleton h-4 w-1/2"></div>
                        <div className="skeleton h-10 w-full mt-4"></div>
                    </div>
                </div>
            ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <RegularProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-xl font-semibold">Tidak Ada Produk</h3>
            <p className="text-base-content/70">Toko belum memiliki produk.</p>
        </div>
      )}
    </div>
  );
}
