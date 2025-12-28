'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Package, Users, ShoppingCart, DollarSign,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, Truck, XCircle,
  BarChart3, Activity, Calendar, MoreHorizontal, Download, FileSpreadsheet, FileText, RefreshCw
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
  allOrders: any[]; // Changed to include all orders for chart calculation
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Export date range
  const [exportStartDate, setExportStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [exportEndDate, setExportEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter orders by date range
  const getFilteredOrders = () => {
    if (!stats) return [];
    return stats.allOrders.filter((order: any) => {
      const orderDate = new Date(order.date || order.createdAt).toISOString().split('T')[0];
      return orderDate >= exportStartDate && orderDate <= exportEndDate;
    });
  };

  // Export to CSV/Excel with date range - DETAILED VERSION
  const exportToExcel = () => {
    const filteredOrders = getFilteredOrders();
    if (filteredOrders.length === 0) {
      alert('Tidak ada data untuk periode yang dipilih');
      return;
    }

    // Detailed headers including product info
    const headers = [
      'Tanggal Order',
      'Order ID',
      'Nama Customer',
      'Email Customer',
      'Telepon Customer',
      'Alamat Pengiriman',
      'Kota',
      'Provinsi',
      'Kode Pos',
      'Status Order',
      'Nama Produk',
      'Jumlah',
      'Harga Satuan',
      'Subtotal Produk',
      'Expedisi',
      'Ongkos Kirim',
      'Kode Voucher',
      'Diskon Voucher',
      'Total Pesanan',
      'Metode Pembayaran'
    ];

    // Create rows for each product in each order (one row per product)
    const rows: string[][] = [];

    filteredOrders.forEach((order: any) => {
      const orderDate = new Date(order.date || order.createdAt).toLocaleDateString('id-ID');
      const customerName = order.customer?.name || order.customerName || '-';
      const customerEmail = order.customer?.email || order.customerEmail || '-';
      const customerPhone = order.customer?.phone || order.customerPhone || order.address?.phone || '-';
      const shippingAddress = order.address?.detail || order.shippingAddress || '-';
      const city = order.address?.city || order.shippingCity || '-';
      const province = order.address?.province || '-';
      const postalCode = order.address?.postalCode || '-';
      const shippingName = order.shippingName || '-';
      const shippingCost = order.shippingCost || 0;
      const voucherCode = order.voucherCode || '-';
      const discount = order.discount || 0;
      const paymentMethod = order.paymentMethod || '-';

      // If order has items, create a row for each item
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any, index: number) => {
          const productName = item.product?.name || item.productName || '-';
          const quantity = item.quantity || 0;
          const unitPrice = item.price || item.product?.flashSalePrice || item.product?.originalPrice || 0;
          const subtotal = quantity * unitPrice;

          rows.push([
            orderDate,
            index === 0 ? order.id : '', // Only show order ID on first row
            index === 0 ? customerName : '',
            index === 0 ? customerEmail : '',
            index === 0 ? customerPhone : '',
            index === 0 ? shippingAddress.replace(/,/g, ';') : '', // Replace commas to avoid CSV issues
            index === 0 ? city : '',
            index === 0 ? province : '',
            index === 0 ? postalCode : '',
            index === 0 ? order.status : '',
            productName,
            quantity.toString(),
            unitPrice.toString(),
            subtotal.toString(),
            index === 0 ? shippingName : '',
            index === 0 ? shippingCost.toString() : '',
            index === 0 ? voucherCode : '',
            index === 0 ? discount.toString() : '',
            index === 0 ? (order.total || 0).toString() : '',
            index === 0 ? paymentMethod : ''
          ]);
        });
      } else {
        // Order without items detail
        rows.push([
          orderDate,
          order.id,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress.replace(/,/g, ';'),
          city,
          province,
          postalCode,
          order.status,
          '-',
          '-',
          '-',
          '-',
          shippingName,
          shippingCost.toString(),
          voucherCode,
          discount.toString(),
          (order.total || 0).toString(),
          paymentMethod
        ]);
      }
    });

    // Calculate summary stats
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders
      .filter((o: any) => o.status === 'Delivered')
      .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
    const completedOrders = filteredOrders.filter((o: any) => o.status === 'Delivered').length;

    const csvContent = [
      '=== LAPORAN PENJUALAN ===',
      `Periode: ${exportStartDate} s/d ${exportEndDate}`,
      `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`,
      '',
      '=== RINGKASAN ===',
      `Total Pesanan: ${totalOrders}`,
      `Pesanan Selesai: ${completedOrders}`,
      `Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}`,
      '',
      '=== DETAIL PESANAN ===',
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-penjualan-detail-${exportStartDate}-to-${exportEndDate}.csv`;
    link.click();
    setShowExportModal(false);
  };

  // Export to PDF (printable format) with date range
  const exportToPDF = () => {
    const filteredOrders = getFilteredOrders();
    if (filteredOrders.length === 0) {
      alert('Tidak ada data untuk periode yang dipilih');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const periodRevenue = filteredOrders
      .filter((o: any) => o.status === 'Delivered')
      .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Penjualan</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
          .stat-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
          .stat-label { color: #6b7280; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background: #f9fafb; font-weight: 600; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📊 Laporan Penjualan</h1>
        <p>Tanggal: ${reportDate}</p>
        
        <div class="summary">
          <div class="stat-card">
            <div class="stat-value">Rp ${(periodRevenue || 0).toLocaleString('id-ID')}</div>
            <div class="stat-label">Total Pendapatan</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${filteredOrders.length}</div>
            <div class="stat-label">Total Pesanan</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${filteredOrders.filter((o: any) => o.status === 'Delivered').length}</div>
            <div class="stat-label">Pesanan Selesai</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${filteredOrders.filter((o: any) => o.status === 'Pending').length}</div>
            <div class="stat-label">Menunggu</div>
          </div>
        </div>
        
        <h2>🏆 Produk Terlaris</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Produk</th><th>Terjual</th><th>Pendapatan</th></tr>
          </thead>
          <tbody>
            ${(stats?.topProducts || []).map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.count} unit</td>
                <td>Rp ${p.revenue.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2>📋 Pesanan Terbaru</h2>
        <table>
          <thead>
            <tr><th>Order ID</th><th>Tanggal</th><th>Status</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${filteredOrders.slice(0, 20).map((o: any) => `
              <tr>
                <td>${o.id.substring(0, 8)}...</td>
                <td>${new Date(o.date || o.createdAt).toLocaleDateString('id-ID')}</td>
                <td>${o.status}</td>
                <td>Rp ${(o.total || 0).toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Laporan ini digenerate otomatis pada ${reportDate}</p>
          <p>Periode: ${exportStartDate} s/d ${exportEndDate}</p>
        </div>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setShowExportModal(false);
  };

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

        // Get top products by counting order items - EXCLUDE cancelled/refunded orders
        const validStatuses = ['Pending', 'Waiting for Confirmation', 'Processing', 'Shipped', 'Delivered'];
        const productCounts: Record<string, { name: string; count: number; revenue: number; image?: string }> = {};
        orders
          .filter((order: any) => validStatuses.includes(order.status))
          .forEach((order: any) => {
            order.items?.forEach((item: any) => {
              const productId = item.product.id;
              if (!productCounts[productId]) {
                productCounts[productId] = {
                  name: item.product?.name || 'Unknown',
                  count: 0,
                  revenue: 0,
                  image: item.product?.image
                };
              }
              productCounts[productId].count += item.quantity;
              productCounts[productId].revenue += (item.price || item.product.flashSalePrice || 0) * item.quantity;
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
          topProducts,
          allOrders: orders // Store all orders for chart
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(fetchStats, 30000);

    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Calculate dynamic metrics
  const avgOrderValue = stats?.totalOrders && stats.totalOrders > 0
    ? stats.totalRevenue / stats.completedOrders
    : 0;

  const conversionRate = stats?.totalOrders && stats.totalOrders > 0
    ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)
    : '0';

  const statCards = [
    {
      title: 'Total Pendapatan',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      subtitle: `${stats?.completedOrders || 0} pesanan selesai`,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Rata-rata Pesanan',
      value: formatPrice(avgOrderValue || 0),
      icon: BarChart3,
      subtitle: 'Per transaksi selesai',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Produk',
      value: stats?.totalProducts.toString() || '0',
      icon: Package,
      subtitle: 'Produk aktif',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Tingkat Konversi',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      subtitle: `${stats?.completedOrders || 0}/${stats?.totalOrders || 0} pesanan`,
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
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            Selamat datang kembali! Berikut ringkasan toko Anda.
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">
              <RefreshCw className="w-3 h-3" /> Live
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn-sm btn-outline gap-2"
            disabled={!stats}
          >
            <Download className="h-4 w-4" />
            Export Laporan
          </button>
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <h3 className="text-lg font-bold mb-4">📊 Export Laporan Penjualan</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="input input-bordered w-full mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tanggal Akhir</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="input input-bordered w-full mt-1"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p className="font-medium">Data yang akan diexport:</p>
                <p>{getFilteredOrders().length} pesanan dalam periode ini</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="btn btn-ghost flex-1"
              >
                Batal
              </button>
              <button
                onClick={exportToExcel}
                className="btn btn-outline flex-1 gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
              <button
                onClick={exportToPDF}
                className="btn btn-primary flex-1 gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.subtitle}</p>
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

          {/* Real Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {(() => {
              // Calculate last 7 days revenue
              const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              const today = new Date();
              const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() - (6 - i));
                return d;
              });

              // Calculate max revenue for scaling
              let maxDayRevenue = 0;
              const dailyRevenues = last7Days.map(date => {
                const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
                const dayRevenue = stats?.allOrders
                  ?.filter((o: any) => {
                    // Check if order date matches this day
                    const orderDate = new Date(o.date || o.createdAt).toLocaleDateString('en-CA');
                    return orderDate === dateStr && o.status !== 'Cancelled' && o.status !== 'Refund Rejected';
                  })
                  .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;

                if (dayRevenue > maxDayRevenue) maxDayRevenue = dayRevenue;
                return { day: days[date.getDay()], revenue: dayRevenue, date: dateStr };
              });

              return dailyRevenues.map((item, index) => {
                const heightPercentage = maxDayRevenue > 0 ? (item.revenue / maxDayRevenue) * 100 : 0;
                // Min height 5% for visibility if 0
                const displayHeight = item.revenue > 0 ? Math.max(heightPercentage, 5) : 2;

                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        {formatPrice(item.revenue)}
                      </div>
                    </div>

                    <motion.div
                      className={`w-full rounded-t-lg ${item.revenue > 0 ? 'bg-gradient-to-t from-emerald-500 to-teal-400' : 'bg-gray-100'}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${displayHeight}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    />
                    <span className="text-xs text-gray-500">{item.day.substring(0, 3)}</span>
                  </div>
                );
              });
            })()}
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

      {/* Top Products - Enhanced Premium Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              🏆 Produk Terlaris
            </h3>
            <p className="text-sm text-gray-500">Berdasarkan pendapatan (pesanan aktif)</p>
          </div>
          <Link href="/admin/products" className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10">
            Lihat Semua
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {stats?.topProducts.map((product, index) => {
            const maxRevenue = stats.topProducts[0]?.revenue || 1;
            const percentage = (product.revenue / maxRevenue) * 100;
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
              >
                {/* Rank */}
                <div className="text-2xl font-bold min-w-[40px] text-center">
                  {medals[index] || `${index + 1}`}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-sm text-gray-500">{product.count} unit terjual</p>
                </div>

                {/* Revenue & Progress */}
                <div className="text-right min-w-[140px]">
                  <p className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    {formatPrice(product.revenue)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <motion.div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${isNaN(percentage) ? 0 : percentage}%` }}
                      transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {(!stats?.topProducts || stats.topProducts.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada data produk terlaris</p>
              <p className="text-sm">Data akan muncul setelah ada pesanan yang berhasil</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
