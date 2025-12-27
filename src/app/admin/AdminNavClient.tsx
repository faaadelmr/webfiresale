"use client";

import { APP_NAME } from "@/lib/app-config";
import { Dispatch, SetStateAction } from "react";
import {
  Flame, LayoutDashboard, Users, Package, ShoppingBasket, Zap, Truck, Settings, ChevronRight, Home
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavProps {
  mobile: boolean;
  setSidebarOpen?: Dispatch<SetStateAction<boolean>>;
  expanded?: boolean;
}

export default function AdminNavClient({ mobile, setSidebarOpen, expanded = true }: NavProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    ...(session?.user?.role === 'superadmin'
      ? [{ href: "/admin/users", icon: Users, label: "Pengguna" }]
      : []
    ),
    { href: "/admin/orders", icon: Package, label: "Pesanan" },
    { href: "/admin/products", icon: ShoppingBasket, label: "Produk" },
    { href: "/admin/auction", icon: Flame, label: "Lelang" },
    { href: "/admin/flashsale", icon: Zap, label: "Flash Sale" },
    { href: "/admin/shipping", icon: Truck, label: "Pengiriman" },
    { href: "/admin/settings", icon: Settings, label: "Pengaturan" },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <span className="loading loading-spinner loading-lg text-primary-content"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-primary text-primary-content rounded-xl overflow-hidden">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-primary-content/10",
        !expanded && !mobile && "justify-center"
      )}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-content/20 backdrop-blur-sm">
          <Flame className="h-6 w-6 text-primary-content" />
        </div>
        {(expanded || mobile) && (
          <span className="text-lg font-bold">{APP_NAME}</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
              !expanded && !mobile && "justify-center",
              isActive(href)
                ? "bg-primary-content/20 text-primary-content shadow-lg font-medium"
                : "text-primary-content/70 hover:bg-primary-content/10 hover:text-primary-content"
            )}
            onClick={() => mobile && setSidebarOpen && setSidebarOpen(false)}
            title={!expanded && !mobile ? label : undefined}
          >
            <Icon className={cn("h-5 w-5 flex-shrink-0", isActive(href) && "text-primary-content")} />
            {(expanded || mobile) && (
              <>
                <span className="flex-1 truncate">{label}</span>
                {isActive(href) && <ChevronRight className="h-4 w-4 opacity-50" />}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className={cn(
        "p-4 border-t border-primary-content/10",
        !expanded && !mobile && "flex justify-center"
      )}>
        {(expanded || mobile) ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary-content/20">
              {session?.user?.image ? (
                <AvatarImage src={session.user.image} />
              ) : (
                <AvatarFallback className="bg-primary-content/20 text-primary-content">
                  {session?.user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-primary-content/60 truncate capitalize">{session?.user?.role}</p>
            </div>
          </div>
        ) : (
          <Avatar className="h-10 w-10 ring-2 ring-primary-content/20">
            <AvatarFallback className="bg-primary-content/20 text-primary-content">
              {session?.user?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Back to Store */}
      <div className={cn("p-4 border-t border-primary-content/10", !expanded && !mobile && "flex justify-center")}>
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-content/10 hover:bg-primary-content/20 transition-colors",
            !expanded && !mobile && "justify-center p-2"
          )}
          title={!expanded && !mobile ? "Kembali ke Toko" : undefined}
        >
          <Home className="h-5 w-5" />
          {(expanded || mobile) && <span className="text-sm">Kembali ke Toko</span>}
        </Link>
      </div>
    </div>
  );
}