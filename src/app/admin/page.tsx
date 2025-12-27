'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Package, Users, ShoppingCart, DollarSign,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, Truck, XCircle,
  BarChart3, Activity, Calendar, MoreHorizontal
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  recentOrders: any[];
  topProducts: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch orders
        const ordersRes = await fetch('/api/orders?admin=true');
        const orders = ordersRes.ok ? await ordersRes.json() : [];

        // Fetch products
        const productsRes = await fetch('/api/products');
        const products = productsRes.ok ? await productsRes.json() : [];

        // Fetch users (admin only)
        const usersRes = await fetch('/api/users');
        const users = usersRes.ok ? await usersRes.json() : [];

        // Calculate stats
        const totalRevenue = orders
          .filter((o: any) => o.status === 'Delivered')
          .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        const pendingOrders = orders.filter((o: any) => o.status === 'Pending' || o.status === 'Waiting for Confirmation').length;
        const processingOrders = orders.filter((o: any) => o.status === 'Processing').length;
        const shippedOrders = orders.filter((o: any) => o.status === 'Shipped').length;
        const completedOrders = orders.filter((o: any) => o.status === 'Delivered').length;

        // Get top products by counting order items
        const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
        orders.forEach((order: any) => {
          order.items?.forEach((item: any) => {
            const productId = item.productId;
            if (!productCounts[productId]) {
              productCounts[productId] = {
                name: item.product?.name || 'Unknown',
                count: 0,
                revenue: 0
              };
            }
            productCounts[productId].count += item.quantity;
            productCounts[productId].revenue += item.price * item.quantity;
          });
        });

        const topProducts = Object.entries(productCounts)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 5)
          .map(([id, data]) => ({ id, ...data }));

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalProducts: products.length,
          totalUsers: users.length || 0,
          pendingOrders,
          processingOrders,
          shippedOrders,
          completedOrders,
          recentOrders: orders.slice(0, 5),
          topProducts
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pendapatan',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      change: '+12.5%',
      isPositive: true,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Total Pesanan',
      value: stats?.totalOrders.toString() || '0',
      icon: ShoppingCart,
      change: '+8.2%',
      isPositive: true,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Produk',
      value: stats?.totalProducts.toString() || '0',
      icon: Package,
      change: '+3.1%',
      isPositive: true,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Pengguna',
      value: stats?.totalUsers.toString() || '0',
      icon: Users,
      change: '+15.3%',
      isPositive: true,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50'
    },
  ];

  const orderStatusCards = [
    { label: 'Menunggu', value: stats?.pendingOrders || 0, icon: Clock, color: 'text-warning bg-warning/10' },
    { label: 'Diproses', value: stats?.processingOrders || 0, icon: Activity, color: 'text-info bg-info/10' },
    { label: 'Dikirim', value: stats?.shippedOrders || 0, icon: Truck, color: 'text-primary bg-primary/10' },
    { label: 'Selesai', value: stats?.completedOrders || 0, icon: CheckCircle, color: 'text-success bg-success/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Selamat datang kembali! Berikut ringkasan toko Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="join">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                className={`join-item btn btn-sm ${selectedPeriod === period ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period === 'week' ? 'Minggu' : period === 'month' ? 'Bulan' : 'Tahun'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${stat.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {orderStatusCards.map((status, index) => (
          <motion.div
            key={status.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${status.color}`}>
              <status.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{status.value}</p>
              <p className="text-xs text-gray-500">{status.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Statistik Penjualan</h3>
              <p className="text-sm text-gray-500">Pendapatan mingguan</p>
            </div>
            <button className="btn btn-ghost btn-sm btn-circle">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Simple Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, index) => {
              const height = Math.random() * 70 + 30;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  />
                  <span className="text-xs text-gray-500">{day}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"></div>
              <span className="text-gray-600">Pendapatan</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity / Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Pesanan Terbaru</h3>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentOrders.slice(0, 5).map((order: any, index: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    #{order.id.substring(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.date || order.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {formatPrice(order.total)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-success/10 text-success' :
                      order.status === 'Pending' ? 'bg-warning/10 text-warning' :
                        order.status === 'Processing' ? 'bg-info/10 text-info' :
                          'bg-gray-100 text-gray-600'
                    }`}>
                    {order.status}
                  </span>
                </div>
              </motion.div>
            )) || (
                <p className="text-center text-gray-500 py-8">Belum ada pesanan</p>
              )}
          </div>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Produk Terlaris</h3>
            <p className="text-sm text-gray-500">Berdasarkan pendapatan</p>
          </div>
          <Link href="/admin/products" className="btn btn-ghost btn-sm">
            Lihat Semua
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Terjual</th>
                <th>Pendapatan</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {stats?.topProducts.map((product, index) => {
                const maxRevenue = stats.topProducts[0]?.revenue || 1;
                const percentage = (product.revenue / maxRevenue) * 100;
                return (
                  <tr key={product.id}>
                    <td className="font-medium">{product.name}</td>
                    <td>{product.count} unit</td>
                    <td className="font-semibold text-emerald-600">{formatPrice(product.revenue)}</td>
                    <td className="w-32">
                      <progress
                        className="progress progress-success w-full"
                        value={percentage}
                        max="100"
                      />
                    </td>
                  </tr>
                );
              })}
              {(!stats?.topProducts || stats.topProducts.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">
                    Belum ada data produk
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
