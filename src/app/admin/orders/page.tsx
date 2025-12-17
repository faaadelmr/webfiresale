

"use client";

import { useState, useEffect } from "react";
import { formatPrice, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Order, RefundDetails, OrderStatus, AddressDetails } from "@/lib/types";
import { Eye, UploadCloud, CheckCircle, Printer, Search, FileText, Package, PackageOpen, Truck, CheckCheck, X, AlertTriangle, Coins, Home, Building } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { motion, AnimatePresence } from "framer-motion";


function OrderTable({
  orders,
  onUpdateStatus,
  onAddShippingCode,
  onCancelOrder,
  onConfirmRefund,
  searchTerm = "",
  selectedStatus = "all",
  selectedOrders = [],
  onToggleOrderSelection = () => { },
  onSelectAll = () => { },
  toast,
  updateOrderInStateAndStorage
}: {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  onAddShippingCode: (orderId: string, shippingCode: string, shippingName: string) => void;
  onCancelOrder: (orderId: string, refundDetails?: RefundDetails) => void;
  onConfirmRefund: (orderId: string) => void;
  searchTerm?: string;
  selectedStatus?: string;
  selectedOrders?: string[];
  onToggleOrderSelection?: (orderId: string) => void;
  onSelectAll?: () => void;
  toast: any; // useToast hook
  updateOrderInStateAndStorage: (updatedOrder: Order) => void;
}) {
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [proofType, setProofType] = useState<'payment' | 'refund'>('payment');
  const [isZoomed, setIsZoomed] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [refundProofDialogOpen, setRefundProofDialogOpen] = useState(false);
  const [refundRequested, setRefundRequested] = useState(false); // Default to false, will be set based on order status when dialog opens
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingCode, setShippingCode] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [refundProof, setRefundProof] = useState<File | null>(null);
  const [refundProofName, setRefundProofName] = useState("Pilih file bukti pengembalian");
  const [confirmationDialog, setConfirmationDialog] = useState<{ isOpen: boolean; title: string; description: string; onConfirm: () => void }>({ isOpen: false, title: '', description: '', onConfirm: () => { } });

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const lowercasedTerm = searchTerm.toLowerCase();
    const fullAddress = `${order.address.street}, ${order.address.village}, ${order.address.district}, ${order.address.city}, ${order.address.province}`.toLowerCase();
    return (
      order.id.toLowerCase().includes(lowercasedTerm) ||
      order.customerName.toLowerCase().includes(lowercasedTerm) ||
      order.customerEmail.toLowerCase().includes(lowercasedTerm) ||
      order.customerPhone.toLowerCase().includes(lowercasedTerm) ||
      fullAddress.includes(lowercasedTerm)
    );
  });

  // Filter orders based on status
  const statusFilteredOrders = selectedStatus === "all"
    ? filteredOrders
    : filteredOrders.filter(order => order.status === selectedStatus);

  const handleOpenShippingDialog = (order: Order) => {
    setSelectedOrder(order);
    setShippingDialogOpen(true);
  };

  const handleOpenCancelDialog = (order: Order) => {
    setSelectedOrder(order);
    // Default to true for orders that are in process and would typically require refund
    setRefundRequested(['Processing', 'Shipped'].includes(order.status));
    setCancelDialogOpen(true);
  };

  const handleConfirmShipping = () => {
    if (selectedOrder && shippingCode && shippingName) {
      onAddShippingCode(selectedOrder.id, shippingCode, shippingName);
      setShippingDialogOpen(false);
      setShippingCode("");
      setShippingName("");
      setSelectedOrder(null);
    }
  };

  const handleConfirmCancel = () => {
    if (selectedOrder) {
      const needsRefund = ['Processing', 'Shipped'].includes(selectedOrder.status) && refundRequested;
      if (needsRefund && !cancelReason.trim()) {
        toast({
          variant: "destructive",
          title: "Alasan diperlukan",
          description: "Alasan pembatalan/pengembalian dana harus diisi.",
        });
        return;
      }

      const refundDetails: RefundDetails | undefined = needsRefund ? {
        reason: cancelReason,
        processedDate: new Date(),
      } : undefined;

      // Determine the status based on whether refund is requested
      const newStatus = needsRefund ? 'Refund Processing' as const : 'Cancelled' as const;

      const updatedOrder = { ...selectedOrder, status: newStatus, refundDetails };

      // Call the cancel handler which will update via API
      onCancelOrder(selectedOrder.id, refundDetails);

      // Also update state through the provided function
      updateOrderInStateAndStorage(updatedOrder);

      setCancelDialogOpen(false);
      setCancelReason("");
      setRefundRequested(true); // Reset to default state
      setSelectedOrder(null);
    }
  };

  const handleRefundProofUpload = async (orderId: string) => {
    if (!refundProof) {
      toast({
        variant: "destructive",
        title: "File tidak dipilih",
        description: "Silakan pilih file bukti pengembalian dana.",
      });
      return;
    }

    // Convert file to data URL
    const reader = new FileReader();
    reader.onload = async () => {
      const refundProofDataUri = reader.result as string;
      const order = orders.find(o => o.id === orderId);

      // Update the order with refund proof via API
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refundDetails: {
              ...order?.refundDetails,
              refundProof: refundProofDataUri,
              refundedDate: new Date()
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload refund proof');
        }

        const data = await response.json();
        updateOrderInStateAndStorage(data.order);

        toast({
          title: "Bukti Pengembalian Terkirim",
          description: `Bukti pengembalian dana untuk pesanan #${orderId} telah diperbarui.`,
        });

        setRefundProofDialogOpen(false);
        setRefundProof(null);
        setRefundProofName("Pilih file bukti pengembalian");
      } catch (error) {
        console.error('Error uploading refund proof:', error);
        toast({
          variant: "destructive",
          title: "Gagal mengunggah bukti",
          description: "Terjadi kesalahan saat mengunggah bukti pengembalian dana.",
        });
      }
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Gagal mengonversi file",
        description: "Terjadi kesalahan saat memproses file bukti pengembalian.",
      });
    };
    reader.readAsDataURL(refundProof);
  };

  const handleRefundProofFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: "destructive",
          title: "Ukuran File Terlalu Besar",
          description: "Ukuran file maksimal adalah 2MB.",
        });
        return;
      }
      setRefundProof(file);
      setRefundProofName(file.name);
    }
  };

  const handlePrintShippingLabel = async (order: Order) => {
    // Fetch business settings
    let businessInfo = { name: 'FireSale Indonesia', address: 'Alamat belum diatur', city: '', phone: '', email: '', logoUrl: '' };
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const s = await res.json();
        if (s.businessAddress) {
          const a = s.businessAddress;
          businessInfo = {
            name: a.fullName || 'FireSale Indonesia',
            address: `${a.street}${a.rtRwBlock ? ', ' + a.rtRwBlock : ''}`,
            city: `${a.village || ''}, ${a.district || ''}, ${a.city || ''}, ${a.province || ''} ${a.postalCode || ''}`.trim(),
            phone: a.phone || '',
            email: s.businessEmail || '',
            logoUrl: s.businessLogoUrl || ''
          };
        }
      }
    } catch (e) { console.error(e); }
    const printWindow = window.open('', '', 'height=800,width=600');
    if (printWindow) {
      const productList = order.items.map(item => `<li>${item.product.name} (x${item.quantity})</li>`).join('');
      const fullAddress = `${order.address.street}, ${order.address.village}, ${order.address.district}, ${order.address.city}`;
      const printContent = `
                <html>
                <head>
                    <title>Cetak Label Pengiriman - ${order.id}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        body {
                            font-family: 'Inter', sans-serif;
                            margin: 0;
                            padding: 10px;
                            -webkit-print-color-adjust: exact;
                        }
                        .label-container {
                            border: 2px solid #333;
                            padding: 15px;
                            width: 100%;
                            max-width: 580px;
                            box-sizing: border-box;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 1px solid #ccc;
                            padding-bottom: 10px;
                            margin-bottom: 10px;
                        }
                        .header .logo {
                            font-size: 24px;
                            font-weight: 700;
                        }
                        .header .order-id {
                            text-align: right;
                        }
                        .order-id h2 {
                            margin: 0;
                            font-size: 16px;
                            color: #555;
                        }
                        .order-id p {
                            margin: 0;
                            font-size: 18px;
                            font-weight: 600;
                        }
                        .address-section {
                            display: flex;
                            gap: 20px;
                            margin-bottom: 15px;
                        }
                        .address-box {
                            flex: 1;
                        }
                        .address-box h3 {
                            font-size: 14px;
                            color: #777;
                            margin: 0 0 5px 0;
                            text-transform: uppercase;
                        }
                        .address-box p {
                            margin: 2px 0;
                            font-size: 16px;
                        }
                        .address-box p.name {
                            font-weight: 600;
                            font-size: 18px;
                        }
                        .items-summary {
                             border-top: 1px solid #ccc;
                             padding-top: 10px;
                        }
                        .items-summary h3 {
                             font-size: 14px;
                             margin: 0 0 5px 0;
                             color: #777;
                             text-transform: uppercase;
                        }
                        .items-summary ul {
                            margin: 0;
                            padding-left: 20px;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        <div class="header">
                            <div class="logo">
                                ${businessInfo.logoUrl ? `<img src="${businessInfo.logoUrl}" alt="Logo" style="max-height:50px;max-width:100px;object-fit:contain;" />` : `<span style="font-size:24px;font-weight:700;">${businessInfo.name}</span>`}
                            </div>
                            <div class="order-id">
                                <h2>Order ID</h2>
                                <p>#${order.id}</p>
                            </div>
                        </div>
                        <div class="address-section">
                            <div class="address-box">
                                <h3>Dari:</h3>
                                <p class="name">${businessInfo.name}</p>
                                <p>${businessInfo.address}</p>
                                <p>${businessInfo.city}</p>
                                ${businessInfo.phone ? `<p>Tel: ${businessInfo.phone}</p>` : ''}
                                ${businessInfo.email ? `<p>Email: ${businessInfo.email}</p>` : ''}
                            </div>
                            <div class="address-box">
                                <h3>Untuk:</h3>
                                <p class="name">${order.customerName}</p>
                                <p>${fullAddress || 'Alamat tidak tersedia'}</p>
                                <p>${order.address.province} ${order.address.postalCode || ''}</p>
                                <p>${order.customerPhone || ''}</p>
                            </div>
                        </div>
                        <div class="items-summary">
                            <h3>Isi Paket:</h3>
                            <ul>${productList}</ul>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                           window.print();
                           window.close();
                        }
                    <\/script>
                </body>
                </html>
            `;
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const requestConfirmation = (orderId: string, newStatus: Order['status'], customTitle?: string, customDesc?: string) => {
    let title = customTitle || "Konfirmasi Tindakan";
    let description = customDesc || `Anda yakin ingin mengubah status pesanan ini menjadi "${newStatus}"?`;

    if (newStatus === 'Processing') {
      title = "Setujui Pembayaran?";
      description = `Apakah Anda yakin ingin menyetujui pembayaran untuk pesanan #${orderId}? Pesanan akan dilanjutkan ke tahap proses.`;
    } else if (newStatus === 'Re-upload Required') {
      title = "Minta Upload Ulang?";
      description = `Apakah Anda yakin ingin meminta pelanggan untuk mengunggah ulang bukti pembayaran untuk pesanan #${orderId}?`;
    }

    setConfirmationDialog({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        if (newStatus === 'Cancelled' && customTitle?.includes('Refund')) {
          onConfirmRefund(orderId);
        } else {
          onUpdateStatus(orderId, newStatus);
        }
        setConfirmationDialog({ isOpen: false, title: '', description: '', onConfirm: () => { } });
      }
    });
  };

  const addressLabelIcon = {
    'Rumah': <Home className="w-3 h-3" />,
    'Kantor': <Building className="w-3 h-3" />,
    'Apartemen': <Building className="w-3 h-3" />
  };


  if (statusFilteredOrders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-24 h-24 rounded-full bg-base-200 flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-base-content/50" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Tidak ada pesanan</h3>
        <p className="text-base-content/70">Tidak ada pesanan untuk ditampilkan.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="overflow-x-auto bg-base-100 rounded-xl border border-base-200">
          <table className="table">
            {/* head */}
            <thead className="bg-base-200">
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={statusFilteredOrders.length > 0 && selectedOrders.length === statusFilteredOrders.length}
                    onChange={onSelectAll}
                  />
                </th>
                <th className="font-semibold">Order ID</th>
                <th className="font-semibold">Pelanggan & Alamat</th>
                <th className="font-semibold">Tanggal</th>
                <th className="font-semibold">Status</th>
                <th className="font-semibold">Info</th>
                <th className="font-semibold text-right">Total</th>
                <th className="font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {statusFilteredOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`${selectedOrders.includes(order.id) ? "bg-blue-50" : ""} hover:bg-base-200 transition-colors`}
                >
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => onToggleOrderSelection(order.id)}
                    />
                  </td>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link href={`/order-detail/${order.id}`} className="text-primary hover:underline font-mono">
                        {order.id}
                      </Link>
                    </div>
                  </td>
                  <td>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-base-content/70 flex flex-col gap-1">
                      <span>{order.customerEmail}</span>
                      <span>{order.customerPhone}</span>
                      {order.address && (
                        <div className="text-xs mt-1 border-t pt-1">
                          {order.address.label && (
                            <span className="badge badge-outline badge-sm gap-1.5 mb-1">
                              {addressLabelIcon[order.address.label as keyof typeof addressLabelIcon]}
                              {order.address.label}
                            </span>
                          )}
                          <div>{order.address.street}, {order.address.village}</div>
                          <div>{order.address.district}, {order.address.city}</div>
                          <div>{order.address.province}, {order.address.postalCode}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {formatDate(order.date)}
                  </td>
                  <td>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${order.status === "Delivered"
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
                      {order.status === "Waiting for Confirmation" && <AlertTriangle className="w-3 h-3" />}
                      {order.status === "Processing" && <PackageOpen className="w-3 h-3" />}
                      {order.status === "Shipped" && <Truck className="w-3 h-3" />}
                      {order.status === "Delivered" && <CheckCheck className="w-3 h-3" />}
                      {order.status === "Cancelled" && <X className="w-3 h-3" />}
                      <span>{order.status}</span>
                    </div>
                  </td>
                  <td className="space-y-2 min-w-[150px]">
                    {(order.status === 'Waiting for Confirmation' || order.status === 'Re-upload Required') && order.paymentProof && (
                      <button
                        className="btn btn-ghost btn-xs flex items-center gap-1.5"
                        onClick={() => {
                          setViewingProof(order.paymentProof!);
                          setProofType('payment');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">Bukti</span>
                      </button>
                    )}
                    {(order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') && (
                      <button
                        className="btn btn-ghost btn-xs flex items-center gap-1.5"
                        onClick={() => handlePrintShippingLabel(order)}
                      >
                        <Printer className="w-4 h-4" />
                        <span className="text-xs">Cetak</span>
                      </button>
                    )}
                    {order.status === 'Refund Processing' && order.refundDetails?.bankName && (
                      <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs">
                        <div className="font-semibold flex items-center gap-1 mb-1">
                          <Coins className="w-3 h-3" />
                          <span>Refund Info</span>
                        </div>
                        <div>Bank: {order.refundDetails.bankName}</div>
                        <div>No. Rek: {order.refundDetails.accountNumber}</div>
                        <div>A.N: {order.refundDetails.accountName}</div>
                        {order.refundDetails.refundProof && (
                          <button
                            className="btn btn-xs btn-outline btn-primary mt-2 w-full"
                            onClick={() => {
                              setViewingProof(order.refundDetails!.refundProof!);
                              setProofType('refund');
                            }}
                          >
                            Lihat Bukti
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-right font-semibold">
                    {formatPrice(order.total)}
                  </td>
                  <td className="text-center space-y-1">
                    {order.status === 'Waiting for Confirmation' && (
                      <div className="space-y-1.5">
                        <button
                          className="btn btn-sm btn-primary btn-outline w-full"
                          onClick={() => requestConfirmation(order.id, 'Processing')}
                        >
                          Setujui
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            className="btn btn-sm btn-warning btn-outline flex-1"
                            onClick={() => requestConfirmation(order.id, 'Re-upload Required')}
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="btn btn-sm btn-error btn-outline flex-1"
                            onClick={() => handleOpenCancelDialog(order)}
                          >
                            Batalkan
                          </button>
                        </div>
                      </div>
                    )}
                    {order.status === 'Processing' && (
                      <div className="space-y-1.5">
                        <button
                          className="btn btn-sm btn-primary w-full"
                          onClick={() => handleOpenShippingDialog(order)}
                        >
                          Kirim
                        </button>
                        <button
                          className="btn btn-sm btn-error btn-outline w-full"
                          onClick={() => handleOpenCancelDialog(order)}
                        >
                          Batalkan
                        </button>
                      </div>
                    )}
                    {order.status === 'Shipped' && (
                      <button
                        className="btn btn-sm btn-error btn-outline w-full"
                        onClick={() => handleOpenCancelDialog(order)}
                      >
                        Batalkan
                      </button>
                    )}
                    {order.status === 'Refund Processing' && (
                      <div className="space-y-1.5">
                        <button
                          className="btn btn-sm btn-primary w-full"
                          onClick={() => {
                            setSelectedOrder(order);
                            setRefundProofDialogOpen(true);
                          }}
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Bukti Refund</span>
                        </button>
                        <button
                          className="btn btn-sm btn-success w-full mt-1"
                          onClick={() => requestConfirmation(order.id, 'Cancelled', 'Konfirmasi Pengembalian Dana', `Apakah Anda sudah mentransfer pengembalian dana untuk pesanan #${order.id}? Pesanan akan ditandai sebagai "Cancelled".`)}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Refund Selesai</span>
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Proof viewing modal */}
      <AnimatePresence>
        {viewingProof && (
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
                <Eye className="w-5 h-5" />
                {proofType === 'refund' ? 'Bukti Pengembalian Dana' : 'Bukti Pembayaran'}
              </h3>
              <div className="flex justify-center">
                <Image
                  src={viewingProof}
                  alt={proofType === 'refund' ? 'Bukti Pengembalian Dana' : 'Bukti Pembayaran'}
                  width={isZoomed ? 1200 : 800}
                  height={isZoomed ? 1800 : 1200}
                  className="object-contain max-h-[70vh] transition-transform duration-300 ease-in-out"
                  onClick={() => setIsZoomed(!isZoomed)}
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setViewingProof(null);
                    setIsZoomed(false);
                  }}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shipping dialog */}
      <AnimatePresence>
        {shippingDialogOpen && selectedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <span>Masukkan Kode Pengiriman</span>
              </h3>
              <p className="text-base-content/70 mb-4">Pesanan #{selectedOrder?.id}</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="shipping-name" className="label font-medium">
                    <span className="label-text">Jasa Pengiriman</span>
                  </label>
                  <select
                    id="shipping-name"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    <option value="">Pilih Jasa Pengiriman</option>
                    <option value="JNE">JNE</option>
                    <option value="J&T Express">J&T Express</option>
                    <option value="SiCepat">SiCepat</option>
                    <option value="AnterAja">AnterAja</option>
                    <option value="ID Express">ID Express</option>
                    <option value="Shopee Xpress">Shopee Xpress</option>
                    <option value="Lion Parcel">Lion Parcel</option>
                    <option value="Ninja Xpress">Ninja Xpress</option>
                    <option value="Wahana">Wahana</option>
                    <option value="TIKI">TIKI</option>
                    <option value="POS Indonesia">POS Indonesia</option>
                    <option value="Indah Logistik">Indah Logistik</option>
                    <option value="GrabExpress">GrabExpress</option>
                    <option value="GoSend">GoSend (Gojek)</option>
                    <option value="Lalamove">Lalamove</option>
                    <option value="Deliveree">Deliveree</option>
                    <option value="RajaKirim">RajaKirim</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="shipping-code" className="label font-medium">
                    <span className="label-text">Nomor Resi</span>
                  </label>
                  <input
                    id="shipping-code"
                    value={shippingCode}
                    onChange={(e) => setShippingCode(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="e.g., JNE123456789"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShippingDialogOpen(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleConfirmShipping}
                  disabled={!shippingCode || !shippingName}
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel dialog */}
      <AnimatePresence>
        {cancelDialogOpen && selectedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <X className="w-5 h-5 text-error" />
                <span>Batalkan Pesanan #{selectedOrder?.id}</span>
              </h3>
              <div className="py-2 space-y-4">
                <p>Anda yakin ingin membatalkan pesanan ini?</p>
                {selectedOrder && ['Processing', 'Shipped'].includes(selectedOrder.status) && (
                  <>
                    <div className="form-control mb-4">
                      <label className="label cursor-pointer">
                        <span className="label-text">Ajukan Pengembalian Dana</span>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={refundRequested}
                          onChange={(e) => setRefundRequested(e.target.checked)}
                        />
                      </label>
                    </div>

                    {refundRequested && (
                      <div className="space-y-4 pl-2 border-l-2 border-primary/50">
                        <div>
                          <label htmlFor="cancel-reason" className="label font-medium">
                            <span className="label-text">Alasan Pembatalan & Pengembalian Dana</span>
                          </label>
                          <textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="textarea textarea-bordered w-full"
                            placeholder="Contoh: Stok barang habis, dana akan dikembalikan penuh."
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="btn btn-ghost"
                  onClick={() => setCancelDialogOpen(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-error"
                  onClick={handleConfirmCancel}
                >
                  Batalkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund Proof Upload Dialog */}
      <AnimatePresence>
        {refundProofDialogOpen && selectedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <UploadCloud className="w-5 h-5" />
                <span>Unggah Bukti Pengembalian Dana</span>
              </h3>
              <p className="text-base-content/70 mb-4">Pesanan #{selectedOrder?.id}</p>
              <div className="py-2 space-y-4">
                <div>
                  <label className="label font-medium">
                    <span className="label-text">File Bukti Pengembalian</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      id="refund-proof"
                      type="file"
                      className="file-input file-input-bordered w-full"
                      onChange={handleRefundProofFileChange}
                      accept="image/*,.pdf"
                    />
                  </div>
                  <p className="text-sm text-base-content/70 mt-1.5">{refundProofName}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setRefundProofDialogOpen(false);
                    setRefundProof(null);
                    setRefundProofName("Pilih file bukti pengembalian");
                  }}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => selectedOrder && handleRefundProofUpload(selectedOrder.id)}
                  disabled={!refundProof}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Unggah
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirmationDialog.isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                {confirmationDialog.title.includes('Batalkan') || confirmationDialog.title.includes('Konfirmasi') ?
                  <AlertTriangle className="w-5 h-5 text-warning" /> :
                  <CheckCircle className="w-5 h-5 text-primary" />}
                <span>{confirmationDialog.title}</span>
              </h3>
              <p className="mb-6">{confirmationDialog.description}</p>
              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmationDialog.onConfirm}
                >
                  Konfirmasi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTabStatus, setSelectedTabStatus] = useState<string>("pembayaran");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]); // For bulk operations
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const { toast } = useToast();

  // Separate state for each tab's orders
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [waitingForConfirmationOrders, setWaitingForConfirmationOrders] = useState<Order[]>([]);
  const [processingOrders, setProcessingOrders] = useState<Order[]>([]);
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
  const [refundOrders, setRefundOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const ordersData = await response.json();
          // Sort orders by date (newest first)
          const sortedOrders = ordersData.sort((a: Order, b: Order) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setOrders(sortedOrders);
        } else {
          console.error('Failed to fetch orders:', response.status);
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    // This effect runs whenever `orders` state changes, and updates the tab-specific order lists.
    setPendingOrders(orders.filter((order) => order.status === "Pending"));
    setWaitingForConfirmationOrders(orders.filter((order) => order.status === "Waiting for Confirmation" || order.status === 'Re-upload Required'));
    setProcessingOrders(orders.filter((order) => order.status === "Processing"));
    setShippedOrders(orders.filter((order) => order.status === "Shipped"));
    setDeliveredOrders(orders.filter((order) => order.status === "Delivered"));
    setCancelledOrders(orders.filter((order) => order.status === "Cancelled"));
    setRefundOrders(orders.filter((order) => order.status === "Refund Required" || order.status === 'Refund Processing'));
  }, [orders]);


  const updateOrderInStateAndStorage = (updatedOrder: Order) => {
    // Update state only - API handles persistence
    setOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      updateOrderInStateAndStorage(data.order);

      toast({
        title: "Status Diperbarui",
        description: `Status pesanan #${orderId} telah diperbarui menjadi ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Gagal memperbarui status",
        description: "Terjadi kesalahan saat memperbarui status pesanan.",
      });
    }
  };

  const handleAddShippingCode = async (orderId: string, shippingCode: string, shippingName: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Shipped',
          shippingCode,
          shippingName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update shipping code');
      }

      const data = await response.json();
      updateOrderInStateAndStorage(data.order);

      toast({
        title: "Resi Disimpan",
        description: `Nomor resi untuk pesanan #${orderId} telah disimpan.`,
      });
    } catch (error) {
      console.error('Error updating shipping code:', error);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan resi",
        description: "Terjadi kesalahan saat menyimpan nomor resi.",
      });
    }
  };

  const handleCancelOrder = async (orderId: string, refundDetails?: RefundDetails) => {
    try {
      const newStatus = refundDetails ? 'Refund Processing' : 'Cancelled';
      const body: any = { status: newStatus };
      if (refundDetails) {
        body.refundDetails = refundDetails;
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      const data = await response.json();
      updateOrderInStateAndStorage(data.order);

      toast({
        title: "Pesanan Dibatalkan",
        description: `Pesanan #${orderId} telah dibatalkan.`,
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        variant: "destructive",
        title: "Gagal membatalkan pesanan",
        description: "Terjadi kesalahan saat membatalkan pesanan.",
      });
    }
  };

  const handleConfirmRefund = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm refund');
      }

      const data = await response.json();
      updateOrderInStateAndStorage(data.order);

      toast({
        title: "Refund Dikonfirmasi",
        description: `Pengembalian dana untuk pesanan #${orderId} telah dikonfirmasi.`,
      });
    } catch (error) {
      console.error('Error confirming refund:', error);
      toast({
        variant: "destructive",
        title: "Gagal mengonfirmasi refund",
        description: "Terjadi kesalahan saat mengonfirmasi pengembalian dana.",
      });
    }
  };

  const getStatusForTab = (tab: string): string => {
    switch (tab) {
      case 'pembayaran': return 'Waiting for Confirmation';
      case 'proses': return 'Processing';
      case 'kirim': return 'Shipped';
      case 'selesai': return 'Delivered';
      case 'dibatalkan': return 'Cancelled';
      case 'refund': return 'Refund Processing';
      default: return 'all';
    }
  };

  const handleBulkSelect = (orderIds: string[]) => {
    setSelectedOrders(prev => {
      const currentTabOrderIds = new Set(orderIds);
      const selectedOnOtherTabs = prev.filter(id => !currentTabOrderIds.has(id));
      const selectedOnThisTab = prev.filter(id => currentTabOrderIds.has(id));

      if (selectedOnThisTab.length === orderIds.length) {
        return selectedOnOtherTabs;
      } else {
        return [...selectedOnOtherTabs, ...orderIds];
      }
    });
  };

  const handleBulkStatusChange = () => {
    if (selectedOrders.length === 0 || !newStatus) return;

    selectedOrders.forEach(orderId => {
      handleUpdateOrderStatus(orderId, newStatus);
    });

    setSelectedOrders([]);
    setIsBulkStatusDialogOpen(false);
    setNewStatus("");
  };

  const getOrdersForTab = (tab: string) => {
    switch (tab) {
      case 'semua': return orders;
      case 'pembayaran': return waitingForConfirmationOrders;
      case 'proses': return processingOrders;
      case 'kirim': return shippedOrders;
      case 'selesai': return deliveredOrders;
      case 'dibatalkan': return cancelledOrders;
      case 'refund':
        return orders.filter((order) =>
          order.status === 'Refund Processing' ||
          order.status === 'Refund Required'
        );
      default: return orders;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              <span>Pengelolaan Pesanan</span>
            </h1>
            <p className="text-base-content/70 mt-1">Kelola dan pantau status pesanan pelanggan</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari pesanan..."
                  className="input input-bordered w-full lg:w-64 pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button
              className="btn btn-primary flex items-center gap-2"
              disabled={selectedOrders.length === 0}
              onClick={() => setIsBulkStatusDialogOpen(true)}
            >
              <FileText className="w-4 h-4" />
              <span>Aksi Massal</span>
              {selectedOrders.length > 0 && (
                <span className="badge badge-sm badge-primary/90 text-white">{selectedOrders.length}</span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 bg-base-200 rounded-xl p-1 w-full">
          <button
            className={`tab tab-sm rounded-lg ${selectedTabStatus === 'semua' ? 'tab-active bg-primary text-primary-content' : 'hover:bg-base-300'}`}
            onClick={() => setSelectedTabStatus('semua')}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span>Semua</span>
              <span className="text-xs opacity-70">{orders.length}</span>
            </div>
          </button>
          <button
            className={`tab tab-sm rounded-lg ${selectedTabStatus === 'pembayaran' ? 'tab-active bg-primary text-primary-content' : 'hover:bg-base-300'}`}
            onClick={() => setSelectedTabStatus('pembayaran')}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span>Pembayaran</span>
              <span className="text-xs opacity-70">{waitingForConfirmationOrders.length}</span>
            </div>
          </button>
          <button
            className={`tab tab-sm rounded-lg ${selectedTabStatus === 'proses' ? 'tab-active bg-info text-info-content' : 'hover:bg-base-300'}`}
            onClick={() => setSelectedTabStatus('proses')}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span>Proses</span>
              <span className="text-xs opacity-70">{processingOrders.length}</span>
            </div>
          </button>
          <button
            className={`tab tab-sm rounded-lg ${selectedTabStatus === 'kirim' ? 'tab-active bg-warning text-warning-content' : 'hover:bg-base-300'}`}
            onClick={() => setSelectedTabStatus('kirim')}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span>Dikirim</span>
              <span className="text-xs opacity-70">{shippedOrders.length}</span>
            </div>
          </button>
          <button
            className={`tab tab-sm rounded-lg ${selectedTabStatus === 'selesai' ? 'tab-active bg-success text-success-content' : 'hover:bg-base-300'}`}
            onClick={() => setSelectedTabStatus('selesai')}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span>Selesai</span>
              <span className="text-xs opacity-70">{deliveredOrders.length}</span>
            </div>
          </button>
          <button
            className={`tab tab-sm rounded-lg ${selectedTabStatus === 'dibatalkan' ? 'tab-active bg-error text-error-content' : 'hover:bg-base-300'}`}
            onClick={() => setSelectedTabStatus('dibatalkan')}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span>Dibatalkan</span>
              <span className="text-xs opacity-70">{cancelledOrders.length}</span>
            </div>
          </button>
          <button
            className={`tab tab-sm rounded-lg ${selectedTabStatus === 'refund' ? 'tab-active bg-warning text-warning-content' : 'hover:bg-base-300'}`}
            onClick={() => setSelectedTabStatus('refund')}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span>Refund</span>
              <span className="text-xs opacity-70">{refundOrders.length}</span>
            </div>
          </button>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-200 p-1">
          <OrderTable
            orders={getOrdersForTab(selectedTabStatus)}
            searchTerm={searchTerm}
            selectedStatus={getStatusForTab(selectedTabStatus)}
            onUpdateStatus={handleUpdateOrderStatus}
            onAddShippingCode={handleAddShippingCode}
            onCancelOrder={handleCancelOrder}
            onConfirmRefund={handleConfirmRefund}
            selectedOrders={selectedOrders}
            onToggleOrderSelection={(orderId) => {
              setSelectedOrders(prev =>
                prev.includes(orderId)
                  ? prev.filter(id => id !== orderId)
                  : [...prev, orderId]
              );
            }}
            onSelectAll={() => {
              const allOrderIds = getOrdersForTab(selectedTabStatus).map(o => o.id);
              handleBulkSelect(allOrderIds);
            }}
            toast={toast}
            updateOrderInStateAndStorage={updateOrderInStateAndStorage}
          />
        </div>
      </motion.div>

      {/* Bulk status change dialog */}
      <AnimatePresence>
        {isBulkStatusDialogOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>Ubah Status Massal</span>
              </h3>
              <p className="mb-2">Pesanan terpilih: <span className="font-semibold">{selectedOrders.length}</span></p>
              <div className="form-control mb-4">
                <label className="label font-medium">
                  <span className="label-text">Status Baru</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                >
                  <option value="">Pilih status</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setIsBulkStatusDialogOpen(false);
                    setNewStatus("");
                  }}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBulkStatusChange}
                  disabled={!newStatus}
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
