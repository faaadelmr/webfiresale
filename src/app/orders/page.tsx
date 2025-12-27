'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { formatPrice } from '@/lib/utils';
import { Package, Clock, CheckCircle, XCircle, Truck, CreditCard, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Order } from '@/lib/types';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch('/api/orders');
                if (response.ok) {
                    const data = await response.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const activeOrders = orders.filter(order =>
        order.status !== 'Delivered' &&
        order.status !== 'Cancelled'
    );

    const completedOrders = orders.filter(order =>
        order.status === 'Delivered' ||
        order.status === 'Cancelled'
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending':
                return <Clock className="h-4 w-4" />;
            case 'Waiting for Confirmation':
                return <CreditCard className="h-4 w-4" />;
            case 'Processing':
                return <Package className="h-4 w-4" />;
            case 'Shipped':
                return <Truck className="h-4 w-4" />;
            case 'Delivered':
                return <CheckCircle className="h-4 w-4" />;
            case 'Cancelled':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'badge-warning';
            case 'Waiting for Confirmation':
                return 'badge-info';
            case 'Processing':
                return 'badge-primary';
            case 'Shipped':
                return 'badge-accent';
            case 'Delivered':
                return 'badge-success';
            case 'Cancelled':
                return 'badge-error';
            default:
                return 'badge-ghost';
        }
    };

    const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

    return (
        <div className="flex min-h-screen w-full flex-col bg-base-100">
            <Header />
            <main className="container mx-auto flex-1 px-4 py-8 pt-24">
                <motion.div
                    className="max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                <ShoppingBag className="w-7 h-7 text-primary" />
                                Pesanan Saya
                            </h1>
                            <p className="text-base-content/70 mt-1">Kelola dan lacak semua pesanan Anda</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs tabs-boxed bg-base-200 p-1 rounded-xl mb-6">
                        <button
                            className={`tab tab-lg flex-1 ${activeTab === 'active' ? 'tab-active bg-primary text-primary-content rounded-lg' : ''}`}
                            onClick={() => setActiveTab('active')}
                        >
                            Berlangsung ({activeOrders.length})
                        </button>
                        <button
                            className={`tab tab-lg flex-1 ${activeTab === 'completed' ? 'tab-active bg-primary text-primary-content rounded-lg' : ''}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Selesai ({completedOrders.length})
                        </button>
                    </div>

                    {/* Orders List */}
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                        </div>
                    ) : displayOrders.length > 0 ? (
                        <div className="space-y-4">
                            {displayOrders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link href={`/order-detail/${order.id}`}>
                                        <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                            <div className="card-body p-4">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    {/* Order Info */}
                                                    <div className="flex items-start gap-4">
                                                        {/* First Product Image */}
                                                        {order.items && order.items.length > 0 && order.items[0].product?.image && (
                                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-base-200 flex-shrink-0">
                                                                <Image
                                                                    src={order.items[0].product.image}
                                                                    alt={order.items[0].product.name || 'Product'}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                                {order.items.length > 1 && (
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                        <span className="text-white text-xs font-bold">+{order.items.length - 1}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-mono text-sm text-base-content/60">
                                                                    #{order.id.substring(0, 12)}...
                                                                </span>
                                                                <span className={`badge ${getStatusColor(order.status)} gap-1`}>
                                                                    {getStatusIcon(order.status)}
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-base-content/70">
                                                                {new Date(order.date).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })}
                                                            </p>
                                                            {order.items && order.items.length > 0 && (
                                                                <p className="text-sm line-clamp-1 mt-1">
                                                                    {order.items.map(item => item.product?.name).filter(Boolean).join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Price & Action */}
                                                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                                                        <div className="text-right">
                                                            <p className="text-xs text-base-content/60">Total</p>
                                                            <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                                                        </div>
                                                        <div className="btn btn-ghost btn-sm gap-1">
                                                            Detail <ArrowRight className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <ShoppingBag className="h-16 w-16 mx-auto text-base-content/30 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {activeTab === 'active' ? 'Tidak ada pesanan berlangsung' : 'Tidak ada pesanan selesai'}
                            </h3>
                            <p className="text-base-content/60 mb-6">
                                {activeTab === 'active'
                                    ? 'Mulai belanja untuk membuat pesanan baru!'
                                    : 'Pesanan yang sudah selesai akan muncul di sini.'}
                            </p>
                            {activeTab === 'active' && (
                                <Link href="/flashsales" className="btn btn-primary">
                                    Mulai Belanja
                                </Link>
                            )}
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
