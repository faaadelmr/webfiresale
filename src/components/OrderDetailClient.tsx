"use client";

import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { PackageCheck, CreditCard, Clock, Warehouse, Truck, CheckCircle, Upload, AlertCircle, MessageSquare, Star, XCircle, Info, Banknote, Calendar, MapPin, Phone, Mail, FileText, Check, Home, Building, User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from 'react';
import type { Order, AccountSettings } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getStatusSteps } from "./OrderDetailUtils";
import { Header } from "@/components/header";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const PaymentCountdown = ({ expiresAt, onExpire }: { expiresAt: Date, onExpire: () => void }) => {
  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const difference = +expiration - +now;

    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }, [expiresAt]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.days <= 0 && newTimeLeft.hours <= 0 && newTimeLeft.minutes <= 0 && newTimeLeft.seconds <= 0) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onExpire]);

  return (
    <motion.div
      className="p-4 rounded-xl bg-warning/10 text-warning border border-warning/20 flex items-center justify-between"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h3 className="font-semibold flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          Batas Waktu Pembayaran
        </h3>
        <p className="text-sm mt-1">Selesaikan pembayaran dalam:</p>
      </div>
      <div className="text-2xl font-bold tracking-widest bg-warning text-warning-content px-3 py-1.5 rounded-lg">
        {timeLeft.days > 0 && <span>{String(timeLeft.days).padStart(2, '0')}:</span>}
        {timeLeft.hours > 0 && <span>{String(timeLeft.hours).padStart(2, '0')}:</span>}
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </motion.div>
  );
};

export default function OrderDetailClient({ initialOrder, orderId }: { initialOrder: Order | null, orderId?: string }) {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isLoading, setIsLoading] = useState(!initialOrder);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [fileName, setFileName] = useState("Pilih file bukti pembayaran");
  const [reviews, setReviews] = useState<{ [productId: string]: { comment: string; rating: number } }>({});
  const [reviewedItems, setReviewedItems] = useState<string[]>([]);
  const { toast } = useToast();
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);
  const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);
  const [refundRequested, setRefundRequested] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [viewingRefundProof, setViewingRefundProof] = useState<string | null>(null);

  const updateOrderStatus = useCallback(async (newStatus: string) => {
    if (!order) return;

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update the order in the component state with the new status
        const updatedOrder = {
          ...order,
          status: result.order.status as any,
          // Update other status-related properties if needed
          expiresAt: result.order.expiresAt ? new Date(result.order.expiresAt) : undefined
        };
        setOrder(updatedOrder);
        toast({
          title: "Status Pesanan Diperbarui",
          description: `Status pesanan telah diubah menjadi ${newStatus}.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal memperbarui status pesanan");
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Gagal Memperbarui Status",
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui status pesanan',
        variant: "destructive"
      });
    }
  }, [order, toast]);

  const handleOrderExpiration = useCallback(() => {
    if (order && order.status === 'Pending') {
      updateOrderStatus('Cancelled');
    }
  }, [order, updateOrderStatus]);

  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);

      const initialReviews: { [productId: string]: { comment: string; rating: number } } = {};
      const alreadyReviewed: string[] = [];
      initialOrder.items.forEach(item => {
        initialReviews[item.product.id] = { comment: '', rating: 0 };
        if (item.product.hasReviewed) {
          alreadyReviewed.push(item.product.id);
        }
      });
      setReviews(initialReviews);
      setReviewedItems(alreadyReviewed);

      // Initialize refund form data if available
      if (initialOrder.status === 'Refund Processing' && initialOrder.refundDetails) {
        setRefundRequested(true);
        setBankName(initialOrder.refundDetails.bankName || "");
        setAccountNumber(initialOrder.refundDetails.accountNumber || "");
        setAccountName(initialOrder.refundDetails.accountName || "");
        setRefundReason(initialOrder.refundDetails.reason || "");
      }
    } else if (orderId) {
      // Fetch order data from API if not provided initially
      const fetchOrder = async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}`);
          if (response.ok) {
            const orderData = await response.json();
            setOrder(orderData);

            // Initialize reviews and refund form for the fetched order
            const initialReviews: { [productId: string]: { comment: string; rating: number } } = {};
            const alreadyReviewed: string[] = [];

            (orderData.items as any[]).forEach(item => {
              initialReviews[item.product.id] = { comment: '', rating: 0 };
              if (item.product.hasReviewed) {
                alreadyReviewed.push(item.product.id);
              }
            });
            setReviews(initialReviews);
            setReviewedItems(alreadyReviewed);

            // Initialize refund form data if available
            if (orderData.status === 'Refund Processing' && orderData.refundDetails) {
              setRefundRequested(true);
              setBankName(orderData.refundDetails.bankName || "");
              setAccountNumber(orderData.refundDetails.accountNumber || "");
              setAccountName(orderData.refundDetails.accountName || "");
              setRefundReason(orderData.refundDetails.reason || "");
            }
          } else if (response.status === 404) {
            // Order not found
            setOrder(null);
          }
        } catch (error) {
          console.error('Error fetching order:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrder();
      return; // Skip the rest of the initialization since we're fetching data
    }

    // Fetch account settings from API instead of localStorage
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setAccountSettings(data))
      .catch(err => console.error('Error fetching settings:', err));

    setIsLoading(false);
  }, [initialOrder, orderId]);

  const handleRequestRefund = async () => {
    if (!order || !bankName || !accountNumber || !accountName || !refundReason) {
      toast({
        variant: "destructive",
        title: "Form tidak lengkap",
        description: "Silakan isi semua informasi pengembalian dana.",
      });
      return;
    }

    const refundDetails = {
      reason: refundReason,
      processedDate: new Date(),
      bankName,
      accountNumber,
      accountName,
    };

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refundDetails
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update the order in the component state
        setOrder(result.order);
        toast({
          title: "Permintaan Pengembalian Dana Terkirim",
          description: "Admin akan segera memproses pengembalian dana Anda.",
        });

        // Reset form
        setRefundRequested(false);
        setBankName("");
        setAccountNumber("");
        setAccountName("");
        setRefundReason("");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengirim permintaan pengembalian dana");
      }
    } catch (error) {
      console.error('Error requesting refund:', error);
      toast({
        title: "Gagal Mengirim Permintaan",
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim permintaan pengembalian dana',
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Ukuran File Terlalu Besar",
          description: "Ukuran file maksimal adalah 2MB.",
          variant: "destructive",
        });
        return;
      }
      setPaymentProof(file);
      setFileName(file.name);
    }
  };

  const handleUpload = async () => {
    if (paymentProof && order) {
      try {
        const paymentProofDataUri = await fileToDataUri(paymentProof);

        // Send payment proof to the server
        const response = await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Waiting for Confirmation',
            paymentProof: paymentProofDataUri
          })
        });

        if (response.ok) {
          const result = await response.json();
          // Update the order in the component state
          setOrder(result.order);
          toast({
            title: "Bukti Pembayaran Terkirim",
            description: `Status pesanan #${order.id} telah diperbarui.`,
          });
          setFileName("Pilih file bukti pembayaran");
          setPaymentProof(null);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Gagal mengunggah bukti pembayaran");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Gagal Mengunggah",
          description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah bukti pembayaran',
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah",
        description: "Silakan pilih file bukti pembayaran terlebih dahulu.",
      });
    }
  };

  const handleCompleteOrder = () => {
    if (order) {
      updateOrderStatus('Delivered');
    }
    setIsConfirmingCompletion(false);
  };

  const handleSubmitReview = async (productId: string) => {
    const review = reviews[productId];
    if (!review || !review.comment.trim()) {
      toast({
        variant: "destructive",
        title: "Ulasan Kosong",
        description: "Harap isi ulasan Anda.",
      });
      return;
    }
    if (review.rating === 0) {
      toast({
        variant: "destructive",
        title: "Peringkat Kosong",
        description: "Harap berikan peringkat bintang.",
      });
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: review.rating,
          comment: review.comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim ulasan');
      }

      setReviewedItems([...reviewedItems, productId]);
      toast({
        title: "Ulasan Terkirim",
        description: "Terima kasih atas ulasan Anda! Data telah disimpan.",
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Ulasan",
        description: "Terjadi kesalahan saat menyimpan ulasan Anda. Silakan coba lagi.",
      });
    }
  };

  const handleReviewChange = (productId: string, value: string | number, type: 'comment' | 'rating') => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [type]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-base-100">
        <Header />
        <div className="container mx-auto flex flex-1 items-center justify-center p-4 py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-base-100">
        <Header />
        <div className="container mx-auto flex flex-1 items-center justify-center p-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-base-content/70">Pesanan dengan ID tersebut tidak ditemukan.</p>
          </div>
        </div>
      </div>
    );
  }

  // Duplicate if (!order) check removed

  const statusSteps = getStatusSteps(order.status);
  const isPaymentSectionVisible = order.status === 'Pending' || order.status === 'Re-upload Required';

  const subtotal = (order.items || []).reduce((acc, item) => acc + item.product.flashSalePrice * item.quantity, 0);

  const getPaymentStatusMessage = () => {
    switch (order.status) {
      case 'Waiting for Confirmation':
        return {
          title: "Menunggu Konfirmasi",
          message: "Bukti pembayaran Anda sedang ditinjau oleh admin. Mohon tunggu.",
          className: "bg-info/10 text-info border border-info/20",
          icon: Clock
        };
      case 'Processing':
      case 'Shipped':
      case 'Delivered':
        return {
          title: "Pembayaran Dikonfirmasi",
          message: "Pembayaran Anda telah berhasil dikonfirmasi. Pesanan sedang diproses.",
          className: "bg-success/10 text-success border border-success/20",
          icon: CheckCircle
        };
      case 'Re-upload Required':
        return {
          title: "Upload Ulang Diperlukan",
          message: "Bukti pembayaran Anda ditolak. Silakan unggah ulang bukti yang valid.",
          className: "bg-warning/10 text-warning border border-warning/20",
          icon: AlertCircle
        };
      case 'Cancelled':
        return {
          title: "Pesanan Dibatalkan",
          message: order.refundDetails?.refundedDate ? "Pengembalian dana telah berhasil diproses." : order.expiresAt ? "Pesanan dibatalkan karena melewati batas waktu pembayaran." : "Pesanan ini telah dibatalkan.",
          className: "bg-error/10 text-error border border-error/20",
          icon: XCircle
        };
      case 'Refund Required':
        return {
          title: "Pengembalian Dana Diperlukan",
          message: "Pesanan Anda dibatalkan oleh admin dan memerlukan pengembalian dana. Harap isi informasi rekening Anda.",
          className: "bg-warning/10 text-warning border border-warning/20",
          icon: Banknote
        };
      case 'Refund Processing':
        return {
          title: "Pengembalian Dana Diproses",
          message: "Informasi rekening Anda telah diterima. Admin akan segera memproses pengembalian dana.",
          className: "bg-warning/10 text-warning border border-warning/20",
          icon: Clock
        };
      default:
        return null;
    }
  }

  const paymentStatusMessage = getPaymentStatusMessage();

  const fullAddress = order.address ? `${order.address.street}, ${order.address.village}, ${order.address.district}, ${order.address.city}, ${order.address.province}, ${order.address.postalCode}` : '';

  const addressLabelIcon = {
    'Rumah': <Home className="w-4 h-4" />,
    'Kantor': <Building className="w-4 h-4" />,
    'Apartemen': <Building className="w-4 h-4" />
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-base-100">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8 pt-24">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <FileText className="w-7 h-7 text-primary" />
                <span>Detail Pesanan #{order.id}</span>
              </h1>
              <p className="text-base-content/70 mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Dipesan pada {new Date(order.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${order.status === "Delivered"
                ? "bg-success/10 text-success border border-success/20"
                : order.status === "Processing"
                  ? "bg-info/10 text-info border border-info/20"
                  : order.status === "Pending"
                    ? "bg-warning/10 text-warning border border-warning/20"
                    : order.status === "Waiting for Confirmation" || order.status === 'Re-upload Required'
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : order.status === "Cancelled" || order.status === 'Refund Required'
                        ? "bg-error/10 text-error border border-error/20"
                        : order.status === 'Refund Processing'
                          ? "bg-warning/10 text-warning border border-warning/20"
                          : "bg-base-300 text-base-content"
                }`}>
                <span>{order.status}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Items & Customer Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Items Card */}
              <motion.div
                className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="p-6 border-b border-base-200">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <PackageCheck className="w-5 h-5" />
                    <span>Item Pesanan</span>
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {(order.items ?? []).map((item, index) => (
                      <motion.div
                        key={`${item.product.id}-${index}`}
                        className="flex items-start gap-4 border-b border-base-200 pb-6 last:border-0 last:pb-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover w-20 h-20"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-base-content/70 mt-1">
                            {item.quantity} x {formatPrice(item.product.flashSalePrice)}
                          </p>
                          <p className="font-bold text-primary mt-1.5">
                            {formatPrice(item.product.flashSalePrice * item.quantity)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                          <span className="badge badge-primary/10 text-primary border border-primary/20">
                            Flash Sale
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="divider my-6"></div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    {order.discount && order.discount > 0 && (
                      <div className="flex justify-between text-success">
                        <span>
                          Diskon
                          {order.voucherCode && <span className="ml-2 px-1.5 py-0.5 bg-success/10 text-xs rounded font-mono font-medium">{order.voucherCode}</span>}
                        </span>
                        <span className="font-medium">-{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Pengiriman ({order.shippingCity || 'N/A'})</span>
                      <span className="font-medium">{formatPrice(order.shippingCost || 0)}</span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Customer Information Card */}
              <motion.div
                className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="p-6 border-b border-base-200">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span>Informasi Pelanggan & Pengiriman</span>
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-primary/10 text-primary rounded-lg"><User className="w-4 h-4" /></div>
                      <div>
                        <p className="text-sm text-base-content/70">Nama Penerima</p>
                        <p className="font-medium">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-primary/10 text-primary rounded-lg"><Phone className="w-4 h-4" /></div>
                      <div>
                        <p className="text-sm text-base-content/70">Nomor Telepon</p>
                        <p className="font-medium">{order.customerPhone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-primary/10 text-primary rounded-lg"><Mail className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm text-base-content/70">Email</p>
                      <p className="font-medium">{order.customerEmail}</p>
                    </div>
                  </div>
                  <div className="divider"></div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-primary/10 text-primary rounded-lg"><MapPin className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm text-base-content/70 flex items-center gap-2">
                        Alamat Pengiriman
                        {order.address?.label && (
                          <span className="badge badge-outline badge-sm gap-1">
                            {addressLabelIcon[order.address.label as keyof typeof addressLabelIcon]}
                            {order.address.label}
                          </span>
                        )}
                      </p>
                      <p className="font-medium">{fullAddress}</p>
                      {order.address?.notes && (
                        <div className="mt-2 text-xs italic bg-base-200 p-2 rounded-md">
                          Catatan: {order.address.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Shipping Information Card */}
              {(order.status === 'Shipped' || order.status === 'Delivered') && order.shippingCode && (
                <motion.div
                  className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-6 border-b border-base-200">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      <span>Informasi Pengiriman</span>
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 space-y-3">
                        {order.shippingName && (
                          <div>
                            <p className="text-sm text-base-content/70">Jasa Pengiriman</p>
                            <p className="font-semibold text-lg">{order.shippingName}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-base-content/70">Nomor Resi</p>
                          <p className="text-lg font-semibold font-mono bg-base-200 px-3 py-2 rounded-lg inline-block">
                            {order.shippingCode}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://cekresi.com/?v=wi1&noresi=${order.shippingCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline w-full sm:w-auto"
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Lacak Pengiriman
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Review Section */}
              {order.status === 'Delivered' && (
                <motion.div
                  className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="p-6 border-b border-base-200">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Beri Ulasan Produk</span>
                    </h2>
                    <p className="text-base-content/70 mt-1">Bagikan pendapat Anda tentang produk yang Anda beli.</p>
                  </div>
                  <div className="p-6">
                    {(order.items ?? []).map((item, index) => (
                      <motion.div
                        key={item.product.id}
                        className="border-b border-base-200 pb-6 last:border-0 last:pb-0"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start gap-4">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{item.product.name}</h3>

                            {reviewedItems.includes(item.product.id) ? (
                              <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                                <Check className="h-4 w-4" />
                                <span>Terima kasih, Anda sudah memberi ulasan.</span>
                              </div>
                            ) : (
                              <div className="mt-3 space-y-3">
                                <div className="flex items-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={cn(
                                        "h-5 w-5 cursor-pointer",
                                        reviews[item.product.id]?.rating >= star
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-base-content/30"
                                      )}
                                      onClick={() => handleReviewChange(item.product.id, star, 'rating')}
                                    />
                                  ))}
                                </div>
                                <textarea
                                  placeholder={`Bagaimana pendapat Anda tentang ${item.product.name}?`}
                                  value={reviews[item.product.id]?.comment || ''}
                                  onChange={(e) => handleReviewChange(item.product.id, e.target.value, 'comment')}
                                  className="textarea textarea-bordered w-full h-24"
                                />
                                <button
                                  className="btn btn-primary btn-sm w-full sm:w-auto"
                                  onClick={() => handleSubmitReview(item.product.id)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Kirim Ulasan
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column - Status, Payment, etc. */}
            <div className="space-y-8">
              {/* Order Status Card */}
              <motion.div
                className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="p-6 border-b border-base-200">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <PackageCheck className="w-5 h-5" />
                    <span>Status Pesanan</span>
                  </h2>
                </div>
                <div className="p-6">
                  {order.status === 'Cancelled' ? (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-error/10 border border-error/20">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-error" />
                      <div>
                        <h4 className="font-semibold text-error">Pesanan Dibatalkan</h4>
                        <p className="text-sm mt-1">{paymentStatusMessage?.message}</p>
                        {order.refundDetails?.refundedDate && (
                          <p className="text-xs text-base-content/70 mt-2">
                            Pengembalian dana diproses pada: {new Date(order.refundDetails.refundedDate).toLocaleString('id-ID')}
                          </p>
                        )}

                        {/* Refund details and proof */}
                        {order.refundDetails && (
                          <div className="mt-3 pt-3 border-t border-error/30">
                            <h5 className="font-semibold text-sm">Detail Pengembalian Dana</h5>
                            <div className="text-xs mt-1 space-y-1">
                              {order.refundDetails.bankName && (
                                <p>Bank: {order.refundDetails.bankName}</p>
                              )}
                              {order.refundDetails.accountNumber && (
                                <p>No. Rekening: {order.refundDetails.accountNumber}</p>
                              )}
                              {order.refundDetails.accountName && (
                                <p>Atas Nama: {order.refundDetails.accountName}</p>
                              )}
                            </div>

                            {/* Refund proof if available */}
                            {order.refundDetails.refundProof && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold">Bukti Pengembalian Dana:</p>
                                <div className="mt-2">
                                  <Image
                                    src={order.refundDetails.refundProof}
                                    alt="Bukti Pengembalian Dana"
                                    width={150}
                                    height={150}
                                    className="rounded-lg object-contain max-h-40 max-w-full"
                                    onClick={() => setViewingRefundProof(order.refundDetails!.refundProof!)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {statusSteps.map((step, index) => (
                        <div key={step.name} className="flex items-start mb-6 last:mb-0">
                          {index < statusSteps.length - 1 && (
                            <div
                              className={cn(
                                "absolute left-5 top-8 h-8 w-0.5",
                                step.isCompleted && statusSteps[index + 1].isCompleted ? "bg-primary" : "bg-base-300"
                              )}
                            />
                          )}
                          <div className={cn(
                            "z-10 flex h-10 w-10 items-center justify-center rounded-full",
                            step.isCompleted ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/50",
                            order.status === 'Re-upload Required' && step.name.includes('Upload Ulang') && "bg-warning text-warning-content"
                          )}>
                            <step.icon className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <h4 className="font-medium">{step.name}</h4>
                            <p className="text-sm text-base-content/70">
                              {order.status === 'Re-upload Required' && step.name.includes('Upload Ulang') ? 'Perlu tindakan' : step.isCompleted ? "Selesai" : "Menunggu"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Confirmation Button */}
              {order.status === 'Shipped' && (
                <motion.div
                  className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">Konfirmasi Penerimaan</h3>
                    <p className="text-base-content/70 mb-4">Jika Anda sudah menerima pesanan, silakan konfirmasi.</p>
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => setIsConfirmingCompletion(true)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Pesanan Sudah Diterima
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Payment Status Card */}
              {paymentStatusMessage && order.status !== 'Pending' && (
                <motion.div
                  className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="p-6">
                    <div className={cn("flex items-start gap-4 p-4 rounded-lg", paymentStatusMessage.className)}>
                      <paymentStatusMessage.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{paymentStatusMessage.title}</h4>
                        <p className="text-sm mt-1">{paymentStatusMessage.message}</p>
                      </div>
                    </div>
                    {order.refundDetails && (
                      <div className="mt-4 flex items-start gap-4 p-4 rounded-lg bg-info/10 border border-info/20">
                        <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-info" />
                        <div>
                          <h4 className="font-semibold">Alasan Pembatalan</h4>
                          <p className="text-sm">{order.refundDetails.reason}</p>
                          <p className="text-xs text-base-content/70 mt-1">
                            Diproses pada: {new Date(order.refundDetails.processedDate).toLocaleString('id-ID')}
                          </p>

                          {/* Refund details */}
                          {order.status === 'Refund Processing' && (
                            <div className="mt-3 pt-3 border-t border-info/30">
                              <h5 className="font-semibold text-sm">Informasi Pengembalian Dana</h5>
                              <div className="text-xs mt-1 space-y-1">
                                <p>Bank: {order.refundDetails.bankName || '-'}</p>
                                <p>No. Rekening: {order.refundDetails.accountNumber || '-'}</p>
                                <p>Atas Nama: {order.refundDetails.accountName || '-'}</p>
                              </div>

                              {/* Refund proof if available */}
                              {order.refundDetails.refundProof && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold">Bukti Pengembalian Dana:</p>
                                  <div className="mt-2">
                                    <Image
                                      src={order.refundDetails.refundProof}
                                      alt="Bukti Pengembalian Dana"
                                      width={150}
                                      height={150}
                                      className="rounded-lg object-contain max-h-40 max-w-full"
                                      onClick={() => setViewingRefundProof(order.refundDetails!.refundProof!)}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Refund request section for cancelled orders */}
                    {(order.status === 'Cancelled' || order.status === 'Refund Required') && !order.refundDetails && (
                      <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
                        <h4 className="font-semibold text-warning flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Pengembalian Dana
                        </h4>
                        <p className="text-sm mt-2">Pesanan ini telah dibatalkan. Apakah Anda ingin mengajukan pengembalian dana?</p>

                        <div className="mt-4 space-y-4">
                          <div className="form-control">
                            <label className="label cursor-pointer">
                              <span className="label-text">Ajukan pengembalian dana</span>
                              <input
                                type="checkbox"
                                className="checkbox checkbox-warning"
                                checked={refundRequested}
                                onChange={(e) => setRefundRequested(e.target.checked)}
                              />
                            </label>
                          </div>

                          {refundRequested && (
                            <div className="space-y-4 pl-2 border-l-2 border-warning/50">
                              <div className="space-y-2">
                                <label className="label font-medium">
                                  <span className="label-text">Bank Tujuan</span>
                                </label>
                                <input
                                  type="text"
                                  value={bankName}
                                  onChange={(e) => setBankName(e.target.value)}
                                  placeholder="Nama bank"
                                  className="input input-bordered w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="label font-medium">
                                  <span className="label-text">Nomor Rekening</span>
                                </label>
                                <input
                                  type="text"
                                  value={accountNumber}
                                  onChange={(e) => setAccountNumber(e.target.value)}
                                  placeholder="Nomor rekening"
                                  className="input input-bordered w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="label font-medium">
                                  <span className="label-text">Atas Nama</span>
                                </label>
                                <input
                                  type="text"
                                  value={accountName}
                                  onChange={(e) => setAccountName(e.target.value)}
                                  placeholder="Nama pemilik rekening"
                                  className="input input-bordered w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="label font-medium">
                                  <span className="label-text">Alasan Pengembalian</span>
                                </label>
                                <textarea
                                  value={refundReason}
                                  onChange={(e) => setRefundReason(e.target.value)}
                                  placeholder="Jelaskan alasan pengembalian dana"
                                  className="textarea textarea-bordered w-full"
                                  rows={3}
                                />
                              </div>
                              <button
                                className="btn btn-warning w-full mt-2"
                                onClick={handleRequestRefund}
                                disabled={!bankName || !accountNumber || !accountName || !refundReason}
                              >
                                Ajukan Pengembalian Dana
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Refund information form for Refund Processing orders */}
                    {order.status === 'Refund Processing' && !order.refundDetails?.bankName && (
                      <div className="mt-4 p-4 rounded-lg bg-info/10 border border-info/20">
                        <h4 className="font-semibold text-info flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Informasi Pengembalian Dana
                        </h4>
                        <p className="text-sm mt-2">Admin telah memutuskan untuk memproses pengembalian dana. Silakan lengkapi informasi rekening Anda.</p>

                        <div className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <label className="label font-medium">
                              <span className="label-text">Bank Tujuan</span>
                            </label>
                            <input
                              type="text"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              placeholder="Nama bank"
                              className="input input-bordered w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="label font-medium">
                              <span className="label-text">Nomor Rekening</span>
                            </label>
                            <input
                              type="text"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              placeholder="Nomor rekening"
                              className="input input-bordered w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="label font-medium">
                              <span className="label-text">Atas Nama</span>
                            </label>
                            <input
                              type="text"
                              value={accountName}
                              onChange={(e) => setAccountName(e.target.value)}
                              placeholder="Nama pemilik rekening"
                              className="input input-bordered w-full"
                            />
                          </div>
                          <button
                            className="btn btn-info w-full mt-2"
                            onClick={handleRequestRefund}
                            disabled={!bankName || !accountNumber || !accountName}
                          >
                            Simpan Informasi Pengembalian
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Payment Instructions Card */}
              {isPaymentSectionVisible && (
                <motion.div
                  className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="p-6 border-b border-base-200">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      <span>
                        {order.status === 'Re-upload Required' ? 'Unggah Ulang Bukti Pembayaran' : 'Instruksi Pembayaran'}
                      </span>
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-5">
                      {order.status === 'Re-upload Required' && (
                        <div className="p-4 rounded-lg bg-warning/10 text-warning border border-warning/20">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold">Bukti Pembayaran Sebelumnya Ditolak</h3>
                              <p className="text-sm mt-1">Admin telah menolak bukti pembayaran yang sebelumnya Anda kirim. Silakan unggah bukti pembayaran yang valid.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.expiresAt && order.status !== 'Re-upload Required' && <PaymentCountdown expiresAt={order.expiresAt} onExpire={handleOrderExpiration} />}

                      {accountSettings ? (
                        <div className="bg-base-200 rounded-lg p-4">
                          <p className="text-base-content/70 mb-3">Silakan lakukan pembayaran sejumlah <span className="font-bold text-primary">{formatPrice(order.total)}</span> ke rekening berikut:</p>
                          <div className="space-y-2">
                            <p className="font-semibold">{accountSettings.bankName}</p>
                            <p className="font-mono text-lg">{accountSettings.accountNumber}</p>
                            <p className="text-sm font-medium">a.n. {accountSettings.accountName}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-warning/10 text-warning border border-warning/20 rounded-lg p-4">
                          <p className="text-sm">Informasi rekening pembayaran belum diatur oleh admin.</p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="label font-medium">
                            <span className="label-text">
                              {order.status === 'Re-upload Required' ? 'Unggah Ulang Bukti Pembayaran' : 'Unggah Bukti Pembayaran'}
                            </span>
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              id="payment-proof"
                              type="file"
                              className="file-input file-input-bordered w-full"
                              onChange={handleFileChange}
                              accept="image/*,.pdf"
                            />
                          </div>
                          <p className="text-sm text-base-content/70 mt-1.5">{fileName}</p>
                        </div>
                        <button
                          className="btn btn-primary w-full"
                          onClick={handleUpload}
                          disabled={!paymentProof}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {order.status === 'Re-upload Required' ? 'Kirim Ulang Bukti Pembayaran' : 'Kirim Bukti Pembayaran'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {isConfirmingCompletion && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>Konfirmasi Penerimaan Pesanan</span>
              </h3>
              <p className="mb-6 text-base-content/70">Apakah Anda yakin telah menerima pesanan ini? Tindakan ini akan menyelesaikan pesanan dan tidak dapat diurungkan.</p>
              <div className="flex justify-end gap-3">
                <button
                  className="btn btn-ghost"
                  onClick={() => setIsConfirmingCompletion(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCompleteOrder}
                >
                  Ya, Saya Sudah Terima
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund Proof Modal */}
      <AnimatePresence>
        {viewingRefundProof && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-base-100 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Bukti Pengembalian Dana
              </h3>
              <div className="flex justify-center">
                <Image
                  src={viewingRefundProof}
                  alt="Bukti Pengembalian Dana"
                  width={800}
                  height={1200}
                  className="object-contain max-h-[70vh]"
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="btn btn-ghost"
                  onClick={() => setViewingRefundProof(null)}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}