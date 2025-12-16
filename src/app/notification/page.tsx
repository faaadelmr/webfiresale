"use client";

import { Header } from "@/components/header";
import { formatPrice } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Order } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Package, Truck, CheckCircle, XCircle, Coins, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NotificationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    // Load user orders from localStorage
    const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]') as Order[];
    setOrders(userOrders);
  }, []);

  useEffect(() => {
    let result = orders;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      result = result.filter(order => order.status === selectedStatus);
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredOrders(result);
  }, [orders, searchTerm, selectedStatus]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Waiting for Confirmation':
      case 'Re-upload Required':
        return <AlertCircle className="w-4 h-4" />;
      case 'Processing':
        return <Package className="w-4 h-4" />;
      case 'Shipped':
        return <Truck className="w-4 h-4" />;
      case 'Delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'Refund Required':
      case 'Refund Processing':
        return <Coins className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
        return "bg-success/10 text-success border-success/20";
      case 'Processing':
        return "bg-info/10 text-info border-info/20";
      case 'Pending':
        return "bg-warning/10 text-warning border-warning/20";
      case 'Waiting for Confirmation':
      case 'Re-upload Required':
        return "bg-primary/10 text-primary border-primary/20";
      case 'Cancelled':
      case 'Refund Required':
        return "bg-error/10 text-error border-error/20";
      case 'Refund Processing':
        return "bg-warning/10 text-warning border-warning/20";
      case 'Shipped':
      default:
        return "bg-base-200 text-base-content border-base-300";
    }
  };

  // Get all unique statuses for filter
  const allStatuses = Array.from(new Set(orders.map(order => order.status)));

  return (
    <div className="flex min-h-screen w-full flex-col bg-base-100">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="bg-primary text-primary-content p-2 rounded-lg">
                <Clock className="w-6 h-6" />
              </span>
              <span>Notifikasi Pesanan</span>
            </h1>
            <p className="text-base-content/70 mt-2">Lihat semua pembaruan status pesanan Anda di sini</p>
          </div>

          <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari pesanan..."
                  className="input input-bordered w-full md:w-80 pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <select
                className="select select-bordered w-full md:w-64"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                {allStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href={`/order-detail/${order.id}`}>
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                Status Pesanan: {order.status}
                                <span className={`badge ${order.status === 'Delivered' ? 'badge-success' : 
                                  order.status === 'Cancelled' ? 'badge-error' : 
                                  order.status === 'Refund Required' || order.status === 'Refund Processing' ? 'badge-warning' : 
                                  'badge-primary'}`}>
                                  #{order.id}
                                </span>
                              </h3>
                              <p className="text-base-content/70 mt-1">
                                Diperbarui pada {new Date(order.date).toLocaleDateString('id-ID', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="mt-2">
                                Total Pembelian: <span className="font-bold">{formatPrice(order.total)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              <span>{order.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className="flex flex-col items-center justify-center py-20 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-base-200 p-5 rounded-full mb-6">
                    <Clock className="w-12 h-12 text-base-content/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Tidak Ada Notifikasi</h3>
                  <p className="text-base-content/70 max-w-md mb-6">
                    Tidak ada pembaruan status pesanan untuk saat ini.
                  </p>
                  <Link href="/" className="btn btn-primary">
                    Belanja Sekarang
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}