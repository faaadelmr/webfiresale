"use client";

import { APP_NAME } from "@/lib/app-config";
import { useState, Dispatch, SetStateAction } from "react";
import { Flame, LogOut, Package, Truck, Zap, Settings, Menu, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

interface NavProps {
  mobile: boolean;
  setSidebarOpen?: Dispatch<SetStateAction<boolean>>;
}

export default function AdminNavClient({ mobile, setSidebarOpen }: NavProps) {
  const { data: session, status } = useSession();

  // Only show the users link for superadmins
  const navLinks = [
    ...(session?.user?.role === 'superadmin'
      ? [{ href: "/admin/users", icon: Package, label: "Manajemen Pengguna" }]
      : []
    ),
    { href: "/admin/orders", icon: Package, label: "Pemesanan" },
    { href: "/admin/products", icon: ShoppingBasket, label: "Produk" },
    { href: "/admin/auction", icon: Flame, label: "Lelang" },
    { href: "/admin/flashsale", icon: Zap, label: "Flash Sale" },
    { href: "/admin/shipping", icon: Truck, label: "Pengiriman" },
    { href: "/admin/settings", icon: Settings, label: "Pengaturan" },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center gap-2 text-lg font-semibold p-4 border-b">
        <Flame className="h-6 w-6 text-primary" />
        <span>{APP_NAME} Admin</span>
      </div>
      <nav className="flex flex-col gap-2 p-4">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors"
            onClick={() => mobile && setSidebarOpen && setSidebarOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-lg font-medium h-full w-full">
      <NavContent />
    </div>
  );
}

export function AdminHeaderClient({ setSidebarOpen }: { setSidebarOpen?: Dispatch<SetStateAction<boolean>> }) {
  const handleSignOut = () => {
    signOut({
      callbackUrl: '/signin'
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-base-100 px-4 md:px-6">
      <button
        className="lg:hidden btn btn-ghost btn-square"
        onClick={(e) => {
          e.stopPropagation();
          setSidebarOpen && setSidebarOpen(true);
        }}
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      </div>
      <button
        className="btn btn-ghost btn-circle"
        onClick={handleSignOut}
      >
        <LogOut className="w-5 h-5" />
      </button>
    </header>
  );
}