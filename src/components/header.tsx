"use client"

import { APP_NAME } from "@/lib/app-config"
import { Flame, LogOut, ShoppingCart, User, Bell } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { CheckOrderDialog } from "./check-order-dialog"
import { ThemeSwitcher } from "./ThemeSwitcher"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import type { Order } from "@/lib/types"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  date: Date;
  url: string;
  read: boolean;
}

export function Header() {
  const { toggleCart, totalItems } = useCart()
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  // Generate notifications from orders and auctions
  const generateNotifications = useCallback((orders: Order[], auctions: any[]): Notification[] => {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
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
          read: readNotifications.includes(`auction-${auction.id}`)
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
        read: readNotifications.includes(`order-status-${order.id}`)
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
          read: readNotifications.includes(`order-payment-${order.id}`)
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
          read: readNotifications.includes(`order-shipped-${order.id}`)
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
          read: readNotifications.includes(`order-delivered-${order.id}`)
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
          read: readNotifications.includes(`order-cancelled-${order.id}`)
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
          read: readNotifications.includes(`order-refund-${order.id}`)
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
      const [ordersRes, auctionsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/auctions')
      ]);

      let orders: Order[] = [];
      let auctions: any[] = [];

      if (ordersRes.ok) {
        orders = await ordersRes.json();
      }

      if (auctionsRes.ok) {
        auctions = await auctionsRes.json();
      }

      const notifs = generateNotifications(orders, auctions);
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

  // Listen for read status changes
  useEffect(() => {
    const handleReadStatusChange = () => {
      // Re-apply read status from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          read: readNotifications.includes(n.id)
        }))
      );
    };

    window.addEventListener('notificationReadStatusChanged', handleReadStatusChange);
    window.addEventListener('storage', handleReadStatusChange);

    return () => {
      window.removeEventListener('notificationReadStatusChanged', handleReadStatusChange);
      window.removeEventListener('storage', handleReadStatusChange);
    };
  }, []);

  const markNotificationAsRead = (notificationId: string) => {
    // Update localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
      window.dispatchEvent(new Event('notificationReadStatusChanged'));
    }

    // Update state
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    const currentReadNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    const allNotificationIds = notifications.map(n => n.id);
    const allIds = Array.from(new Set([...currentReadNotifications, ...allNotificationIds]));
    localStorage.setItem('readNotifications', JSON.stringify(allIds));

    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    window.dispatchEvent(new Event('notificationReadStatusChanged'));
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-base-100 shadow-md">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Flame className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {APP_NAME}
          </h1>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <ThemeSwitcher />
          <CheckOrderDialog />

          {/* Notification Badge */}
          <div className="relative">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle relative">
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="badge badge-xs badge-error absolute right-0 top-0 transform translate-x-1/2 -translate-y-1/2">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center px-3 pt-2">
                  <span className="font-semibold">Notifikasi</span>
                  <div className="flex items-center gap-2">
                    <div className="badge badge-primary badge-sm">
                      {notifications.filter(n => !n.read).length}
                    </div>
                    <button
                      className="text-xs text-base-content/70 hover:text-base-content/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                    >
                      Tandai semua
                    </button>
                  </div>
                </div>

                <div className="divider my-0"></div>
                {isLoadingNotifications ? (
                  <li>
                    <a className="p-3 text-center text-base-content/60">
                      <span className="loading loading-spinner loading-sm"></span>
                    </a>
                  </li>
                ) : notifications.filter(n => !n.read).length > 0 ? (
                  <>
                    <div className="max-h-48 overflow-y-auto">
                      {notifications.filter(n => !n.read).map((notification) => (
                        <li
                          key={notification.id}
                          className="bg-base-200"
                        >
                          <div className="flex items-center gap-3 p-3">
                            <Link
                              href={notification.url}
                              className="flex-1 hover:bg-transparent"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`rounded-full p-2 ${notification.type === 'auction' ? 'bg-success text-success-content' :
                                  notification.type === 'delivery' ? 'bg-success text-success-content' :
                                    notification.type === 'cancellation' ? 'bg-error text-error-content' :
                                      notification.type === 'refund' ? 'bg-warning text-warning-content' :
                                        notification.type === 'payment' ? 'bg-info text-info-content' :
                                          notification.type === 'shipping' ? 'bg-primary text-primary-content' :
                                            'bg-accent text-accent-content'
                                  }`}>
                                  {notification.type === 'auction' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : notification.type === 'delivery' || notification.type === 'shipping' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                      <path fillRule="evenodd" d="M3 4a1 1 0 00-1 1v4a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zm1 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                      <path d="M13.5 4a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1h-1z" />
                                    </svg>
                                  ) : notification.type === 'cancellation' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                  ) : notification.type === 'refund' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                  ) : notification.type === 'payment' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{notification.title}</p>
                                  <p className="text-xs text-base-content/60">{notification.message}</p>
                                </div>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2">
                              <span className="badge badge-xs badge-primary">baru</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </div>
                    <li className="px-3 pt-2">
                      <Link href="/notification" className="btn btn-outline btn-sm w-full">
                        Lihat Semua
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <a className="p-3 text-center text-base-content/60">
                      Tidak ada notifikasi
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="relative">
            <button
              className="btn btn-ghost btn-circle relative"
              onClick={toggleCart}
              aria-label="Open shopping cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="badge badge-sm badge-error text-xs absolute right-0 top-0 transform translate-x-1/2 -translate-y-1/2">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {status === 'authenticated' ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  {session?.user?.avatar ? (
                    <img alt="User Avatar" src={session.user.avatar} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-base-300 text-base-content">
                      <span>{session?.user?.name ? getInitials(session.user.name) : <User />}</span>
                    </div>
                  )}
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li className="menu-title">
                  <span className="font-semibold">{session?.user?.name || "Guest"}</span>
                </li>
                <li>
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                    Profil
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <a
                    onClick={() => {
                      localStorage.removeItem('userProfile');
                      signOut({ callbackUrl: '/' });
                    }}
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </a>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signin">
                <button className="btn btn-ghost">
                  Masuk
                </button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  )
}
