"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="card bg-base-100 shadow-2xl overflow-hidden">
          {/* Decorative top bar */}
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>

          <div className="card-body items-center text-center p-8 md:p-12">
            {/* Animated 404 */}
            <motion.div
              className="text-[120px] md:text-[160px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary"
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.9, 1, 0.9]
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              404
            </motion.div>

            {/* Divider with icon */}
            <div className="flex items-center gap-4 my-4">
              <div className="h-px flex-1 bg-base-300"></div>
              <motion.div
                className="text-4xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🔍
              </motion.div>
              <div className="h-px flex-1 bg-base-300"></div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-base-content mb-2">
              Halaman Tidak Ditemukan
            </h1>

            <p className="text-base-content/60 mb-8 max-w-md">
              Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
              Silakan kembali ke beranda untuk menemukan apa yang Anda butuhkan.
            </p>

            {/* Floating elements */}
            <div className="flex justify-center gap-4 mb-8">
              {['📦', '🛒', '💳', '🏷️', '⚡'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="text-3xl"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Link href="/" className="flex-1">
                <motion.button
                  className="btn btn-primary w-full gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Home className="w-4 h-4" />
                  Kembali ke Beranda
                </motion.button>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="btn btn-ghost flex-1 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Halaman Sebelumnya
              </button>
            </div>

            {/* Search suggestion */}
            <div className="mt-8 pt-6 border-t border-base-200 w-full">
              <p className="text-sm text-base-content/50 mb-3">
                Atau coba cari produk yang Anda inginkan:
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Link href="/flashsales" className="badge badge-primary badge-lg gap-1 cursor-pointer hover:badge-secondary transition-colors">
                  ⚡ Flash Sale
                </Link>
                <Link href="/auctions" className="badge badge-secondary badge-lg gap-1 cursor-pointer hover:badge-primary transition-colors">
                  🔨 Lelang
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-base-content/40 text-sm mt-6">
          Error 404 - Halaman tidak ditemukan
        </p>
      </motion.div>
    </div>
  );
}