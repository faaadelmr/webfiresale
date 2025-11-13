'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProductList from './components/ProductList';
import Link from 'next/link';
import { LuShoppingCart, LuUser, LuPackage, LuSearch, LuHeart, LuMenu } from 'react-icons/lu';

// Mock data for flash sale products
const flashSaleProducts = [
  {
    id: 'prod1',
    name: 'Smartphone X',
    description: 'Smartphone terbaru dengan kamera triple dan prosesor generasi terbaru.',
    price: 2999.99,
    discountPrice: 1999.99,
    stock: 45,
    images: ['/placeholder.jpg'],
    category: 'Elektronik',
    isFlashSale: true,
    saleStartTime: new Date(Date.now() - 3600000), // Started 1 hour ago
    saleEndTime: new Date(Date.now() + 86400000), // Ends in 24 hours
    isActive: true,
  },
  {
    id: 'prod2',
    name: 'Headphone Nirkabel',
    description: 'Headphone dengan peredam kebisingan dan baterai tahan lama.',
    price: 899.99,
    discountPrice: 599.99,
    stock: 120,
    images: ['/placeholder.jpg'],
    category: 'Elektronik',
    isFlashSale: true,
    saleStartTime: new Date(Date.now() - 7200000), // Started 2 hours ago
    saleEndTime: new Date(Date.now() + 43200000), // Ends in 24 hours
    isActive: true,
  },
  {
    id: 'prod3',
    name: 'Tablet Pro',
    description: 'Tablet dengan layar resolusi tinggi dan stylus terincluded.',
    price: 1999.99,
    discountPrice: 1499.99,
    stock: 30,
    images: ['/placeholder.jpg'],
    category: 'Elektronik',
    isFlashSale: true,
    saleStartTime: new Date(Date.now() - 1800000), // Started 30 minutes ago
    saleEndTime: new Date(Date.now() + 3600000), // Ends in 1 hour
    isActive: true,
  },
  {
    id: 'prod4',
    name: 'Jam Pintar',
    description: 'Jam tangan pintar dengan pemantau detak jantung dan GPS.',
    price: 1299.99,
    discountPrice: 899.99,
    stock: 80,
    images: ['/placeholder.jpg'],
    category: 'Elektronik',
    isFlashSale: true,
    saleStartTime: new Date(Date.now() - 14400000), // Started 4 hours ago
    saleEndTime: new Date(Date.now() + 172800000), // Ends in 48 hours
    isActive: true,
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Flashfire
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="hover:text-orange-400 transition-colors">Beranda</Link>
              <Link href="/products" className="hover:text-orange-400 transition-colors">Produk</Link>
              <Link href="/flash-sales" className="hover:text-orange-400 transition-colors">Flash Sale</Link>
              <Link href="/categories" className="hover:text-orange-400 transition-colors">Kategori</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-gray-800 rounded-full px-4 py-2">
              <LuSearch className="text-gray-400 mr-2" size={18} />
              <input 
                type="text" 
                placeholder="Cari produk..." 
                className="bg-transparent outline-none text-white placeholder-gray-400 w-64"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/wishlist" className="relative p-2 hover:text-orange-400 transition-colors">
                <LuHeart size={20} />
              </Link>
              
              <Link href="/cart" className="relative p-2 hover:text-orange-400 transition-colors">
                <LuShoppingCart size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>
              
              {status === 'loading' ? (
                <div className="hidden md:flex items-center gap-1 bg-gray-700 px-4 py-2 rounded-full">
                  <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Memuat...</span>
                </div>
              ) : !session ? (
                <Link href="/login" className="hidden md:flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-full font-medium transition-all duration-300">
                  <LuUser size={16} />
                  <span>Masuk</span>
                </Link>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-gray-300">Halo, {session.user.name}</span>
                  <img 
                    src={session.user.image || '/placeholder.jpg'} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full border border-gray-400"
                  />
                </div>
              )}
              
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:text-orange-400 transition-colors"
              >
                <LuMenu size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
            <div className="flex flex-col gap-4">
              <Link href="/" className="hover:text-orange-400 transition-colors">Beranda</Link>
              <Link href="/products" className="hover:text-orange-400 transition-colors">Produk</Link>
              <Link href="/flash-sales" className="hover:text-orange-400 transition-colors">Flash Sale</Link>
              <Link href="/categories" className="hover:text-orange-400 transition-colors">Kategori</Link>
              <div className="flex items-center bg-gray-800 rounded-full px-4 py-2 mt-2">
                <LuSearch className="text-gray-400 mr-2" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari produk..." 
                  className="bg-transparent outline-none text-white placeholder-gray-400 w-full"
                />
              </div>
              {status !== 'loading' && !session && (
                <Link href="/login" className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-medium mt-2 w-fit">
                  <LuUser size={16} />
                  <span>Masuk</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                  FLASH SALE
                </span>
                <br />
                <span className="text-white">MURAH MERIAH</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                Nikmati diskon eksklusif untuk waktu terbatas. Produk terpilih hingga diskon 70%!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link 
                  href="/products" 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105"
                >
                  Belanja Sekarang
                </Link>
                <Link 
                  href="/flash-sales" 
                  className="border-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300"
                >
                  Lihat Flash Sale
                </Link>
              </div>
              
              {/* Countdown Timer */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 max-w-md mx-auto lg:mx-0">
                <h3 className="text-lg font-semibold mb-4 text-center">Penawaran Berakhir Dalam</h3>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="bg-gray-700 rounded-lg p-3 font-bold text-2xl">23</div>
                    <div className="text-xs mt-1 text-gray-400">JAM</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-700 rounded-lg p-3 font-bold text-2xl">59</div>
                    <div className="text-xs mt-1 text-gray-400">MENIT</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-700 rounded-lg p-3 font-bold text-2xl">59</div>
                    <div className="text-xs mt-1 text-gray-400">DETIK</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🔥</div>
                    <h2 className="text-4xl font-bold mb-4">PENAWARAN EKSKLUSIF</h2>
                    <p className="text-xl text-gray-300">Hanya untuk waktu terbatas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Sale Products */}
      <section className="py-16 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Produk dalam Flash Sale</h2>
            <p className="text-gray-400 text-lg">Temukan produk-produk berkualitas dengan harga terjangkau</p>
          </div>
          <ProductList products={flashSaleProducts} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-bold mb-2">Pengiriman Cepat</h3>
              <p className="text-gray-400">Dikirim dalam 24 jam ke seluruh Indonesia</p>
            </div>
            <div className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-2">Pembayaran Aman</h3>
              <p className="text-gray-400">Sistem pembayaran terjamin dan aman</p>
            </div>
            <div className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">😊</div>
              <h3 className="text-xl font-bold mb-2">Garansi Uang Kembali</h3>
              <p className="text-gray-400">Garansi 30 hari jika tidak puas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Jadilah yang Pertama Tahu!</h2>
          <p className="text-gray-300 text-lg mb-8">Dapatkan notifikasi penawaran terbaru langsung ke email Anda</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Masukkan email Anda" 
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300">
              Berlangganan
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}