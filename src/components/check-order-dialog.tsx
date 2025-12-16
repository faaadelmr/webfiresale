"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import type { Order } from '@/lib/types';

export function CheckOrderDialog() {
  const [orderId, setOrderId] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from localStorage when dialog opens
  useEffect(() => {
    if (isOpen) {
      const storedOrders: Order[] = JSON.parse(localStorage.getItem('userOrders') || '[]');
      setOrders(storedOrders);
    }
  }, [isOpen]);

  // Filter orders based on active tab
  const activeOrders = orders.filter(order =>
    order.status !== 'Delivered' &&
    order.status !== 'Cancelled' &&
    order.status !== 'Refund Processing' &&
    order.status !== 'Refund Required'
  );

  const completedOrders = orders.filter(order =>
    order.status === 'Delivered' ||
    order.status === 'Cancelled' ||
    order.status === 'Refund Processing' ||
    order.status === 'Refund Required'
  );

  const handleTrackOrder = (order?: Order) => {
    const orderIdToUse = order ? order.id : orderId.trim();
    if (orderIdToUse) {
      router.push(`/order-detail/${orderIdToUse}`);
      setIsOpen(false);
      setOrderId('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrackOrder();
    }
  };

  return (
    <div>
      <button
        className="btn btn-outline"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Cek Pemesanan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)}></div>
          <div className="relative bg-base-100 rounded-lg p-6 w-full max-w-md mx-4 z-10">
            <h3 className="text-lg font-semibold mb-4">Lacak Pesanan Anda</h3>

            {/* Tab navigation */}
            <div className="tabs tabs-boxed mb-4">
              <button
                className={`tab tab-lg ${activeTab === 'active' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Pemesanan
              </button>
              <button
                className={`tab tab-lg ${activeTab === 'completed' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Selesai
              </button>
            </div>

            {/* Orders list or search input */}
            {activeTab === 'active' && activeOrders.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <ul className="menu bg-base-100 w-full">
                  {activeOrders.map(order => (
                    <li key={order.id}>
                      <a onClick={() => handleTrackOrder(order)}>
                        <div>
                          <div className="font-bold">{order.id}</div>
                          <div className="text-sm opacity-70">
                            {new Date(order.date).toLocaleDateString('id-ID')} •
                            <span className="ml-1 badge badge-ghost">{order.status}</span>
                          </div>
                          <div className="text-xs">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total)}
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : activeTab === 'completed' && completedOrders.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <ul className="menu bg-base-100 w-full">
                  {completedOrders.map(order => (
                    <li key={order.id}>
                      <a onClick={() => handleTrackOrder(order)}>
                        <div>
                          <div className="font-bold">{order.id}</div>
                          <div className="text-sm opacity-70">
                            {new Date(order.date).toLocaleDateString('id-ID')} •
                            <span className="ml-1 badge badge-ghost">{order.status}</span>
                          </div>
                          <div className="text-xs">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total)}
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mb-4">
                <label htmlFor="order-id" className="text-sm font-medium block mb-2">
                  No. Pesanan
                </label>
                <input
                  id="order-id"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="e.g., ORD123"
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost"
                onClick={() => setIsOpen(false)}
              >
                Batal
              </button>
              {activeTab === 'active' || activeTab === 'completed' ? null : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleTrackOrder()}
                >
                  Lacak Pesanan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}