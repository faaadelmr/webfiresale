'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HiMenu, HiX } from 'react-icons/hi';
import { useSession } from 'next-auth/react';
import SidebarNav from './SidebarNav';
import UserProfile from './UserProfile';

export default function MobileHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <Link href="/" className="text-xl font-bold text-white">
          Flashfire
        </Link>
        <div className="flex items-center gap-3">
          {status === 'authenticated' ? (
            <Link href="/profile" className="text-white hover:text-gray-300">
              <span className="mr-3">Halo, {session.user.name}</span>
              <img 
                src={session.user.image || '/placeholder.jpg'} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-gray-400"
              />
            </Link>
          ) : (
            <Link href="/login" className="text-white hover:text-gray-300">
              Masuk
            </Link>
          )}
          {status === 'authenticated' && (
            <Link href="/orders" className="text-white hover:text-gray-300">
              Pesanan Saya
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-300 hover:text-white"
            aria-label="Abrir menu"
          >
            <HiMenu size={24} />
          </button>
        </div>
      </header>

      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />

          <aside className="fixed top-0 left-0 h-full w-64 bg-gray-800 p-6 flex flex-col justify-between z-50 transform transition-transform duration-300 ease-in-out md:hidden"
            style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <div>
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-bold">Flashfire</h1>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Fechar menu"
                >
                  <HiX size={24} />
                </button>
              </div>
              <div onClick={() => setIsSidebarOpen(false)}> 
                 <SidebarNav />
              </div>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <UserProfile />
            </div>
          </aside>
        </>
      )}
    </>
  );
}