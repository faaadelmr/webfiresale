"use client"

import { APP_NAME } from "@/lib/app-config"
import { Flame, LogOut, User, Bell, ShoppingBag, Search, Settings } from "lucide-react"
import { CartDropdown } from "./cart-dropdown"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import type { Order } from "@/lib/types"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  date: Date;
  url: string;
  read: boolean;
}

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/auctions', label: 'Lelang' },
  { href: '/flashsales', label: 'Promo Kilat' },
];

export function Header() {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)
  const pathname = usePathname()

  // Fetch business logo from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.businessLogoUrl) {
            setBusinessLogo(data.businessLogoUrl);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate notifications from orders and auctions
  const generateNotifications = useCallback((orders: Order[], auctions: any[], readIds: string[]): Notification[] => {
    const now = new Date();

    const allNotifications: Notification[] = [];

    // Auction wins
    auctions
      .filter((auction: any) => now >= new Date(auction.endDate) && (auction.status === 'sold' || auction.status === 'ended'))
      .forEach((auction: any) => {
        allNotifications.push({
          id: `auction-${auction.id}`,
          type: 'auction',
          title: 'Lelang Dimenangkan!',
          message: `${auction.product?.name || 'Item Lelang'} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(auction.currentBid || auction.minBid)}`,
          date: new Date(auction.endDate),
          url: `/checkout?auctionId=${auction.id}`,
          read: readIds.includes(`auction-${auction.id}`)
        });
      });

    // Order notifications
    orders.forEach((order: Order) => {
      // Add order status update notification
      allNotifications.push({
        id: `order-status-${order.id}`,
        type: 'order',
        title: `Status Pesanan: ${order.status}`,
        message: `Pesanan #${order.id.substring(0, 8)} - ${order.status}`,
        date: new Date(order.date),
        url: `/order-detail/${order.id}`,
        read: readIds.includes(`order-status-${order.id}`)
      });

      // Add payment confirmation notification if needed
      if (order.status === 'Waiting for Confirmation') {
        allNotifications.push({
          id: `order-payment-${order.id}`,
          type: 'payment',
          title: 'Konfirmasi Pembayaran Diperlukan',
          message: `Pesanan #${order.id.substring(0, 8)} menunggu konfirmasi pembayaran`,
          date: new Date(order.date),
          url: `/order-detail/${order.id}`,
          read: readIds.includes(`order-payment-${order.id}`)
        });
      }

      // Add delivery notification if shipped
      if (order.status === 'Shipped') {
        allNotifications.push({
          id: `order-shipped-${order.id}`,
          type: 'shipping',
          title: 'Pesanan Dikirim',
          message: `Pesanan #${order.id.substring(0, 8)} telah dikirim`,
          date: new Date(order.date),
          url: `/order-detail/${order.id}`,
          read: readIds.includes(`order-shipped-${order.id}`)
        });
      }

      // Add delivery notification if delivered
      if (order.status === 'Delivered') {
        allNotifications.push({
          id: `order-delivered-${order.id}`,
          type: 'delivery',
          title: 'Pesanan Diterima',
          message: `Pesanan #${order.id.substring(0, 8)} telah diterima`,
          date: new Date(order.date),
          url: `/order-detail/${order.id}`,
          read: readIds.includes(`order-delivered-${order.id}`)
        });
      }

      // Add cancellation notification
      if (order.status === 'Cancelled') {
        allNotifications.push({
          id: `order-cancelled-${order.id}`,
          type: 'cancellation',
          title: 'Pesanan Dibatalkan',
          message: `Pesanan #${order.id.substring(0, 8)} telah dibatalkan`,
          date: new Date(order.date),
          url: `/order-detail/${order.id}`,
          read: readIds.includes(`order-cancelled-${order.id}`)
        });
      }

      // Add refund notification
      if (order.status === 'Refund Required' || order.status === 'Refund Processing') {
        allNotifications.push({
          id: `order-refund-${order.id}`,
          type: 'refund',
          title: 'Refund Diperlukan',
          message: `Proses refund untuk pesanan #${order.id.substring(0, 8)}`,
          date: new Date(order.date),
          url: `/order-detail/${order.id}`,
          read: readIds.includes(`order-refund-${order.id}`)
        });
      }
    });

    // Sort by date, newest first
    return allNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch orders and auctions in parallel
      const [ordersRes, auctionsRes, readRes] = await Promise.all([
        fetch('/api/orders', { cache: 'no-store' }),
        fetch('/api/auctions', { cache: 'no-store' }),
        fetch('/api/notifications/read', { cache: 'no-store' })
      ]);

      let orders: Order[] = [];
      let auctions: any[] = [];

      if (ordersRes.ok) {
        orders = await ordersRes.json();
      }

      if (auctionsRes.ok) {
        auctions = await auctionsRes.json();
      }

      let readIds: string[] = [];
      if (readRes.ok) {
        readIds = await readRes.json();
        setReadNotificationIds(readIds);
      }

      const notifs = generateNotifications(orders, auctions, readIds);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [generateNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Listen for read status changes (deprecated logic removed)
  // We rely on API and state now.
  useEffect(() => {
    // Optional: socket or polling for real-time read status if needed
  }, []);

  const markNotificationAsRead = async (notificationId: string) => {
    // Optimistic update
    setReadNotificationIds(prev => [...prev, notificationId]);
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    // Call API
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic
    setReadNotificationIds(prev => [...prev, ...unreadIds]);
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    // Call API
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds })
      });
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  const renderNavLink = (href: string, label: string) => {
    const isActive =
      (href === '/' && pathname === href) ||
      (href !== '/' && href !== '/#flash-sales' && pathname.startsWith(href));

    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-full transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-base-content hover:bg-base-content/10 dark:hover:bg-base-content/10'
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-base-100/80 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer no-underline">
          {businessLogo ? (
            <Image
              src={businessLogo}
              alt={APP_NAME}
              width={32}
              height={32}
              className="h-8 w-8 object-contain rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Flame className="h-5 w-5 fill-current" />
            </div>
          )}
          <span className="text-xl font-bold tracking-tight text-base-content">
            {APP_NAME}
          </span>
        </Link>

        {/* Navigation Links - Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
          <nav className="flex items-center gap-2 bg-base-200/50 p-1 rounded-full border border-base-200 backdrop-blur-sm shadow-sm">
            {navLinks.map(({ href, label }) => renderNavLink(href, label))}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Notifications */}
          <div className="relative">
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle relative hover:bg-base-content/10"
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                  </span>
                )}
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-0 shadow-lg bg-base-100 rounded-xl w-80 max-h-[28rem] overflow-hidden border border-base-200"
              >
                <div className="flex justify-between items-center px-4 py-3 bg-base-200/50 backdrop-blur-sm border-b border-base-200">
                  <span className="font-semibold text-sm">Notifikasi</span>
                  <div className="flex items-center gap-2">
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="badge badge-error badge-xs font-mono">
                        {notifications.filter(n => !n.read).length} new
                      </span>
                    )}
                    <button
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                    >
                      Tandai semua
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[20rem]">
                  {isLoadingNotifications ? (
                    <div className="p-8 text-center text-base-content/60">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  ) : notifications.filter(n => !n.read).length > 0 ? (
                    <ul className="divide-y divide-base-200">
                      {notifications.filter(n => !n.read).map((notification) => (
                        <li key={notification.id} className="hover:bg-base-200/50 transition-colors">
                          <Link
                            href={notification.url}
                            className="flex gap-4 p-4 !rounded-none"
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className={`mt-1 flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${notification.type === 'auction' ? 'bg-success/10 text-success' :
                              notification.type === 'delivery' ? 'bg-info/10 text-info' :
                                notification.type === 'cancellation' ? 'bg-error/10 text-error' :
                                  'bg-neutral/10 text-neutral'
                              }`}>
                              {notification.type === 'auction' ? <Flame size={14} /> :
                                notification.type === 'delivery' ? <ShoppingBag size={14} /> :
                                  <Bell size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-none mb-1 text-base-content">
                                {notification.title}
                              </p>
                              <p className="text-xs text-base-content/60 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-base-content/60 mt-1.5 font-medium">
                                {new Date(notification.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-base-200 mb-3">
                        <Bell className="h-6 w-6 text-base-content/30" />
                      </div>
                      <p className="text-sm text-base-content/60">Tidak ada notifikasi baru</p>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-base-200 bg-base-200/30">
                  <Link href="/notification" className="btn btn-ghost btn-sm btn-block text-xs font-normal h-8 min-h-0">
                    Lihat Semua Aktivitas
                  </Link>
                </div>
              </ul>
            </div>
          </div>

          {/* Cart Dropdown */}
          <CartDropdown />

          {/* User Profile */}
          {status === 'authenticated' ? (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar ml-1"
              >
                <div className="w-10 rounded-full ring-2 ring-primary/10 ring-offset-2 ring-offset-base-100">
                  <Avatar>
                    {session?.user?.image ? (
                      <AvatarImage alt="User Avatar" src={session.user.image} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {session?.user?.name ? getInitials(session.user.name) : <User />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-xl w-56 border border-base-200"
              >
                <li className="menu-title px-4 py-2 border-b border-base-200 mb-1">
                  <span className="font-semibold text-base-content text-sm">
                    {session?.user?.name || 'Guest'}
                  </span>
                  <span className="text-xs font-normal text-base-content/60 lowercase truncate block mt-0.5">
                    {session?.user?.email}
                  </span>
                </li>
                <li>
                  <Link href="/profile" className="py-2.5">
                    <User className="h-4 w-4" />
                    Profil Saya
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="py-2.5">
                    <ShoppingBag className="h-4 w-4" />
                    Pesanan Saya
                  </Link>
                </li>
                <li>
                  <Link href="/settings" className="py-2.5">
                    <Settings className="h-4 w-4" />
                    Pengaturan
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <a
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                    }}
                    className="text-error hover:bg-error/10 py-2.5"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </a>
                </li>
              </ul>
            </div>
          ) : (
            <Link href="/signin">
              <button className="btn btn-primary rounded-full px-6 min-h-0 h-10 shadow-sm shadow-primary/20">
                Masuk
              </button>
            </Link>
          )}
        </div>
      </div>
    </header >
  )
}
