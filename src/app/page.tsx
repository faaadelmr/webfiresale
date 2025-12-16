
"use client";

import { Header } from "@/components/header";
import { FlashSaleGrid } from "@/components/flashsale-grid";
import { ProductGrid } from "@/components/product-grid";
import { CartSidebar } from "@/components/cart-sidebar";
import { PromotionBanner } from "@/components/promotion-banner";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { AuctionGrid } from "@/components/auction-grid";

export default function Home() {
  useEffect(() => {
    // Add a class to body to enable smooth scrolling
    document.body.classList.add('scroll-smooth');
    return () => {
      document.body.classList.remove('scroll-smooth');
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-base-100">
      <Header />
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <PromotionBanner />
        </motion.div>
        
        <div className="py-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FlashSaleGrid />
          </motion.div>
        </div>

        <div className="container mx-auto px-4 md:px-6">
            <Separator className="my-8" />
        </div>

        <div className="py-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AuctionGrid />
          </motion.div>
        </div>

        <div className="container mx-auto px-4 md:px-6">
            <Separator className="my-8" />
        </div>
        
        <div className="py-8">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tight mb-6">Produk Lainnya</h2>
            </div>
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <ProductGrid />
            </motion.div>
        </div>

      </main>
      <CartSidebar />
    </div>
  );
}
