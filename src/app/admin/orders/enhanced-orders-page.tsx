"use client";

import { useState, useEffect } from "react";
import { printShippingLabel } from "@/lib/print-label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Order, RefundDetails, OrderStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Eye, UploadCloud, CheckCircle, Printer, Search, FileText, XCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ORDER_STATUS_STANDARD } from "@/lib/order-standards";

import { NEXT_PUBLIC_APP_NAME } from "@/lib/app-config";

// Enhanced OrderTable with search and filtering
function EnhancedOrderTable({
  orders,
  onUpdateStatus,
  onAddShippingCode,
  onCancelOrder,
  onConfirmRefund,
  searchTerm = "",
  selectedStatus = "all",
  selectedOrders = [],
  onToggleOrderSelection = () => { },
  onSelectAll = () => { }
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
}) {
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingCode, setShippingCode] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [confirmationDialog, setConfirmationDialog] = useState<{ isOpen: boolean; title: string; description: string; onConfirm: () => void }>({ isOpen: false, title: '', description: '', onConfirm: () => { } });

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const lowercasedTerm = searchTerm.toLowerCase();
    return (
      order.displayId?.toLowerCase().includes(lowercasedTerm) ||
      order.id.toLowerCase().includes(lowercasedTerm) ||
      order.customerName.toLowerCase().includes(lowercasedTerm) ||
      order.customerEmail.toLowerCase().includes(lowercasedTerm) ||
      order.customerPhone.toLowerCase().includes(lowercasedTerm) ||
      order.address.street.toLowerCase().includes(lowercasedTerm) ||
      order.address.city.toLowerCase().includes(lowercasedTerm) ||
      order.address.district.toLowerCase().includes(lowercasedTerm) ||
      order.address.village.toLowerCase().includes(lowercasedTerm) ||
      order.address.province.toLowerCase().includes(lowercasedTerm) ||
      order.address.postalCode.toLowerCase().includes(lowercasedTerm) ||
      order.address.fullName.toLowerCase().includes(lowercasedTerm) ||
      order.address.phone.toLowerCase().includes(lowercasedTerm) ||
      order.address.notes?.toLowerCase().includes(lowercasedTerm)
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
      const needsRefund = ['Processing', 'Shipped'].includes(selectedOrder.status);
      if (needsRefund && !cancelReason.trim()) {
        // Simple validation for refund reason
        alert("Alasan pembatalan/pengembalian dana harus diisi.");
        return;
      }

      const refundDetails: RefundDetails | undefined = needsRefund ? {
        reason: cancelReason,
        processedDate: new Date(),
      } : undefined;

      onCancelOrder(selectedOrder.id, refundDetails);
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedOrder(null);
    }
  };

  const handlePrintShippingLabel = async (order: Order) => {
    // Fetch business settings for sender information
    let businessInfo = {
      name: NEXT_PUBLIC_APP_NAME,
      address: 'Alamat belum diatur',
      city: '',
      phone: '',
      email: '',
      logoUrl: ''
    };

    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const settings = await response.json();
        if (settings.businessAddress) {
          const addr = settings.businessAddress;
          businessInfo = {
            name: addr.fullName || NEXT_PUBLIC_APP_NAME,
            address: `${addr.street}${addr.rtRwBlock ? ', ' + addr.rtRwBlock : ''}`,
            city: `${addr.village || ''}, ${addr.district || ''}, ${addr.city || ''}, ${addr.province || ''} ${addr.postalCode || ''}`.trim(),
            phone: addr.phone || '',
            email: settings.businessEmail || '',
            logoUrl: settings.businessLogoUrl || ''
          };
        }
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    }

    const printWindow = window.open('', '', 'height=800,width=600');
    if (printWindow) {
      const fullAddress = order.address ? `${order.address.street}${order.address.rtRwBlock ? ', ' + order.address.rtRwBlock : ''}, ${order.address.village}` : '';
      const productList = order.items.map(item => `<li>${item.product.name} (x${item.quantity})</li>`).join('');
      const printContent = `
          <html>
          <head>
              <title>Cetak Label Pengiriman - ${order.displayId || order.id}</title>
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
                      display: flex;
                      align-items: center;
                      gap: 10px;
                  }
                  .header .logo img {
                      max-height: 50px;
                      max-width: 100px;
                      object-fit: contain;
                  }
                  .header .logo .company-name {
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
                          ${businessInfo.logoUrl ? `<img src="${businessInfo.logoUrl}" alt="Logo" />` : `<div class="company-name">${businessInfo.name}</div>`}
                      </div>
                      <div class="order-id">
                          <h2>Order ID</h2>
                          <p>#${order.displayId || order.id}</p>
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
                          <p>${order.address?.province || ''} ${order.address?.postalCode || ''}</p>
                          <p>Tel: ${order.customerPhone || ''}</p>
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

  if (statusFilteredOrders.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">Tidak ada pesanan untuk ditampilkan.</div>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={statusFilteredOrders.length > 0 && selectedOrders.length === statusFilteredOrders.length}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Info</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statusFilteredOrders.map((order) => (
            <TableRow
              key={order.id}
              className={selectedOrders.includes(order.id) ? "bg-blue-50" : ""}
            >
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={() => onToggleOrderSelection(order.id)}
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/order-detail/${order.id}`} className="text-primary hover:underline">
                  {order.displayId || order.id}
                </Link>
              </TableCell>
              <TableCell>
                <div className="font-medium">{order.customerName}</div>
                <div className="text-sm text-muted-foreground">
                  {order.customerEmail}
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.customerPhone}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {order.address.street}, {order.address.city} {order.shippingCity}
                </div>
              </TableCell>
              <TableCell>
                {formatDate(order.date)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    order.status === "Delivered"
                      ? "default"
                      : order.status === "Cancelled" || order.status === 'Re-upload Required' || order.status === 'Refund Required'
                        ? "destructive"
                        : "secondary"
                  }
                  className={cn(
                    "capitalize whitespace-nowrap",
                    ORDER_STATUS_STANDARD.statusColors[order.status] || ""
                  )}
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="space-y-1">
                {(order.status === 'Waiting for Confirmation' || order.status === 'Re-upload Required') && order.paymentProof && (
                  <Button variant="outline" size="sm" onClick={() => setViewingProof(order.paymentProof!)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Bukti
                  </Button>
                )}
                {(order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handlePrintShippingLabel(order)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Cetak
                    </Button>
                  </>
                )}
                {(order.status === 'Refund Processing' || order.status === 'Refund Required' || order.status === 'Refund Rejected') && order.refundDetails && (
                  <div className="text-xs p-2 rounded-md bg-orange-100 border border-orange-200 w-max space-y-1">
                    <p className="font-semibold text-orange-800">Permintaan Pengembalian</p>
                    <p className="text-orange-700 font-medium">Alasan:</p>
                    <p className="text-orange-700 italic">"{order.refundDetails.reason || '-'}"</p>

                    {order.refundDetails.refundProof && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-orange-700 hover:text-orange-800 hover:bg-orange-200 -ml-2 mt-1"
                        onClick={() => setViewingProof(order.refundDetails!.refundProof!)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Lihat Bukti Foto
                      </Button>
                    )}

                    {order.refundDetails.bankName && (
                      <div className="mt-2 pt-2 border-t border-orange-200/50">
                        <p className="font-semibold text-orange-800">Info Rekening</p>
                        <p className="text-orange-700">Bank: {order.refundDetails.bankName}</p>
                        <p className="text-orange-700">No. Rek: {order.refundDetails.accountNumber}</p>
                        <p className="text-orange-700">A.N: {order.refundDetails.accountName}</p>
                      </div>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                {formatPrice(order.total)}
              </TableCell>
              <TableCell className="text-center space-y-2">
                {order.status === 'Waiting for Confirmation' && (
                  <div className="flex flex-col items-center gap-2">
                    <Button size="sm" onClick={() => requestConfirmation(order.id, 'Processing')}>
                      Setujui Pembayaran
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => requestConfirmation(order.id, 'Re-upload Required')}>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Minta Upload Ulang
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenCancelDialog(order)}>
                      Batalkan
                    </Button>
                  </div>
                )}
                {order.status === 'Processing' && (
                  <div className="flex flex-col items-center gap-2">
                    <Button size="sm" onClick={() => handleOpenShippingDialog(order)}>
                      Kirim Pesanan
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenCancelDialog(order)}>
                      Batalkan
                    </Button>
                  </div>
                )}
                {order.status === 'Shipped' && (
                  <Button variant="outline" size="sm" onClick={() => handleOpenCancelDialog(order)}>
                    Batalkan
                  </Button>
                )}
                {order.status === 'Refund Processing' && (
                  <div className="flex flex-col gap-2">
                    <Button variant="default" size="sm" onClick={() => requestConfirmation(order.id, 'Cancelled', 'Konfirmasi Pengembalian Dana', `Apakah Anda sudah mentransfer pengembalian dana untuk pesanan #${order.displayId || order.id}? Pesanan akan ditandai sebagai "Cancelled" (Stok dikembalikan).`)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Refund Selesai
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => requestConfirmation(order.id, 'Refund Rejected', 'Tolak Pengembalian', `Apakah Anda yakin ingin menolak pengembalian dana ini? Status akan menjadi "Refund Rejected".`)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak Refund
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {viewingProof && (
        <AlertDialog open onOpenChange={() => {
          setViewingProof(null);
          setIsZoomed(false);
        }}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Bukti Pembayaran</AlertDialogTitle>
            </AlertDialogHeader>
            <div
              className="overflow-auto max-h-[70vh] cursor-grab"
            >
              <Image
                src={viewingProof}
                alt="Bukti Pembayaran"
                width={isZoomed ? 1200 : 800}
                height={isZoomed ? 1800 : 1200}
                className={cn(
                  "object-contain transition-transform duration-300 ease-in-out w-full",
                  isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                )}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Tutup</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masukkan Kode Pengiriman untuk Pesanan #{selectedOrder?.displayId || selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-name">Jasa Pengiriman</Label>
              <select
                id="shipping-name"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="space-y-2">
              <Label htmlFor="shipping-code">Kode Pengiriman (Resi)</Label>
              <Input
                id="shipping-code"
                value={shippingCode}
                onChange={(e) => setShippingCode(e.target.value)}
                placeholder="e.g., JNE123456789"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingDialogOpen(false)}>Batal</Button>
            <Button onClick={handleConfirmShipping} disabled={!shippingCode || !shippingName}>Kirim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><span>Batalkan Pesanan #{selectedOrder?.displayId || selectedOrder?.id}</span></DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>Anda yakin ingin membatalkan pesanan ini?</p>
            {selectedOrder && ['Processing', 'Shipped'].includes(selectedOrder.status) && (
              <div>
                <Label htmlFor="cancel-reason">Alasan Pembatalan & Pengembalian Dana</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Stok barang habis, dana akan dikembalikan penuh."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Jangan Batalkan</Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>Ya, Batalkan Pesanan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmationDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmationDialog({ ...confirmationDialog, isOpen: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmationDialog.onConfirm}>Konfirmasi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTabStatus, setSelectedTabStatus] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]); // For bulk operations
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(); // Initial fetch

    // Auto-refresh every 15 seconds
    const intervalId = setInterval(fetchOrders, 15000);

    return () => clearInterval(intervalId);
  }, []); // Remove toast dependency to avoid re-renders

  // Derived state for tabs
  const pendingOrders = orders.filter(o => o.status === "Pending");
  const waitingForConfirmationOrders = orders.filter(o => o.status === "Waiting for Confirmation" || o.status === 'Re-upload Required');
  const processingOrders = orders.filter(o => o.status === "Processing");
  const shippedOrders = orders.filter(o => o.status === "Shipped");
  const deliveredOrders = orders.filter(o => o.status === "Delivered");
  const cancelledOrders = orders.filter(o => o.status === "Cancelled");
  const refundOrders = orders.filter(o => o.status === "Refund Required" || o.status === 'Refund Processing');

  const updateOrderInState = (updatedOrder: Order) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      const data = await response.json();
      updateOrderInState(data.order);
      toast({ title: "Status Diperbarui", description: `Pesanan #${data.order.displayId || orderId} diubah menjadi ${newStatus}` });
    } catch (error) {
      toast({ title: "Gagal Mengubah Status", description: "Terjadi kesalahan server.", variant: "destructive" });
    }
  };

  const handleCancelOrder = async (orderId: string, refundDetails?: RefundDetails) => {
    try {
      const body: any = { status: refundDetails ? 'Refund Required' : 'Cancelled' };
      if (refundDetails) body.refundDetails = refundDetails;

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      const data = await response.json();
      updateOrderInState(data.order);
      toast({ title: "Pesanan Dibatalkan", description: `Pesanan #${data.order.displayId || orderId} telah dibatalkan.` });
    } catch (error) {
      toast({ title: "Gagal Membatalkan", description: "Terjadi kesalahan server.", variant: "destructive" });
    }
  };

  const handleConfirmRefund = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }) // Confirming refund usually means moving to Cancelled (fully processed)
      });

      if (!response.ok) throw new Error('Failed to confirm refund');

      const data = await response.json();
      updateOrderInState(data.order);
      toast({ title: "Refund Dikonfirmasi", description: "Pengembalian dana telah selesai." });
    } catch (error) {
      toast({ title: "Gagal Konfirmasi", description: "Terjadi kesalahan server.", variant: "destructive" });
    }
  };

  const handleAddShippingCode = async (orderId: string, shippingCode: string, shippingName: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Shipped', shippingCode: shippingCode, shippingName: shippingName })
      });

      if (!response.ok) throw new Error('Failed to add shipping code');

      const data = await response.json();
      updateOrderInState(data.order);
      toast({ title: "Resi Ditambahkan", description: `Pesanan #${data.order.displayId || orderId} telah dikirim.` });
    } catch (error) {
      toast({ title: "Gagal Menambah Resi", description: "Terjadi kesalahan server.", variant: "destructive" });
    }
  };

  // Bulk operations
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAllForTab = () => {
    let ordersForCurrentTab: Order[] = [];

    switch (selectedTabStatus) {
      case 'pembayaran':
        ordersForCurrentTab = [...pendingOrders, ...waitingForConfirmationOrders];
        break;
      case 'proses':
        ordersForCurrentTab = processingOrders;
        break;
      case 'pengiriman':
        ordersForCurrentTab = shippedOrders;
        break;
      case 'selesai':
        ordersForCurrentTab = deliveredOrders;
        break;
      case 'refund':
        ordersForCurrentTab = refundOrders;
        break;
      case 'dibatalkan':
        ordersForCurrentTab = cancelledOrders;
        break;
      case 'pesanan':
      default:
        ordersForCurrentTab = orders;
        break;
    }

    if (selectedOrders.length === ordersForCurrentTab.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(ordersForCurrentTab.map(order => order.id));
    }
  };

  const handleBulkStatusChange = () => {
    if (selectedOrders.length > 0) {
      setNewStatus("");
      setIsBulkStatusDialogOpen(true);
    }
  };

  const confirmBulkStatusChange = () => {
    if (selectedOrders.length > 0 && newStatus) {
      // Update all selected orders
      // Update all selected orders via API
      Promise.all(selectedOrders.map(id =>
        fetch(`/api/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }).then(res => {
          if (res.ok) return res.json();
          return null;
        })
      )).then(results => {
        const successfulUpdates = results.filter(r => r !== null).map(r => r.order);
        setOrders(prev => prev.map(o => {
          const updated = successfulUpdates.find((u: Order) => u.id === o.id);
          return updated || o;
        }));
        toast({ title: "Batch Update Berhasil", description: `${successfulUpdates.length} pesanan diperbarui.` });
      });

      setSelectedOrders([]);
      setIsBulkStatusDialogOpen(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    return ORDER_STATUS_STANDARD.statusColors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Pesanan</h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari Order ID, Nama, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 hidden md:block">
            Update: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 border rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedOrders.length} pesanan dipilih
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange()}
            >
              <FileText className="h-4 w-4 mr-1" />
              Ubah Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrders([])}
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Tabs
            defaultValue="pembayaran"
            className="w-full"
            onValueChange={(value) => {
              setSelectedTabStatus(value);
              setSelectedOrders([]); // Reset selections when changing tabs
            }}
          >
            <TabsList className="m-4 grid w-full grid-cols-7">
              <TabsTrigger value="pesanan">Semua Pesanan</TabsTrigger>
              <TabsTrigger value="pembayaran">Pembayaran</TabsTrigger>
              <TabsTrigger value="proses">Proses</TabsTrigger>
              <TabsTrigger value="pengiriman">Pengiriman</TabsTrigger>
              <TabsTrigger value="selesai">Selesai</TabsTrigger>
              <TabsTrigger value="refund">Refund</TabsTrigger>
              <TabsTrigger value="dibatalkan">Dibatalkan</TabsTrigger>
            </TabsList>

            <TabsContent value="pesanan" className="m-0 p-4">
              <EnhancedOrderTable
                orders={orders}
                onUpdateStatus={handleUpdateStatus}
                onAddShippingCode={handleAddShippingCode}
                onCancelOrder={handleCancelOrder}
                onConfirmRefund={handleConfirmRefund}
                searchTerm={searchTerm}
                selectedStatus="all"
                selectedOrders={selectedOrders}
                onToggleOrderSelection={toggleOrderSelection}
                onSelectAll={toggleSelectAllForTab}
              />
            </TabsContent>

            <TabsContent value="pembayaran" className="m-0 p-4">
              <EnhancedOrderTable
                orders={[...pendingOrders, ...waitingForConfirmationOrders]}
                onUpdateStatus={handleUpdateStatus}
                onAddShippingCode={handleAddShippingCode}
                onCancelOrder={handleCancelOrder}
                onConfirmRefund={handleConfirmRefund}
                searchTerm={searchTerm}
                selectedStatus="all"
                selectedOrders={selectedOrders}
                onToggleOrderSelection={toggleOrderSelection}
                onSelectAll={toggleSelectAllForTab}
              />
            </TabsContent>

            <TabsContent value="proses" className="m-0 p-4">
              <EnhancedOrderTable
                orders={processingOrders}
                onUpdateStatus={handleUpdateStatus}
                onAddShippingCode={handleAddShippingCode}
                onCancelOrder={handleCancelOrder}
                onConfirmRefund={handleConfirmRefund}
                searchTerm={searchTerm}
                selectedStatus="all"
                selectedOrders={selectedOrders}
                onToggleOrderSelection={toggleOrderSelection}
                onSelectAll={toggleSelectAllForTab}
              />
            </TabsContent>

            <TabsContent value="pengiriman" className="m-0 p-4">
              <EnhancedOrderTable
                orders={shippedOrders}
                onUpdateStatus={handleUpdateStatus}
                onAddShippingCode={handleAddShippingCode}
                onCancelOrder={handleCancelOrder}
                onConfirmRefund={handleConfirmRefund}
                searchTerm={searchTerm}
                selectedStatus="all"
                selectedOrders={selectedOrders}
                onToggleOrderSelection={toggleOrderSelection}
                onSelectAll={toggleSelectAllForTab}
              />
            </TabsContent>

            <TabsContent value="selesai" className="m-0 p-4">
              <EnhancedOrderTable
                orders={deliveredOrders}
                onUpdateStatus={handleUpdateStatus}
                onAddShippingCode={handleAddShippingCode}
                onCancelOrder={handleCancelOrder}
                onConfirmRefund={handleConfirmRefund}
                searchTerm={searchTerm}
                selectedStatus="all"
                selectedOrders={selectedOrders}
                onToggleOrderSelection={toggleOrderSelection}
                onSelectAll={toggleSelectAllForTab}
              />
            </TabsContent>

            <TabsContent value="refund" className="m-0 p-4">
              <EnhancedOrderTable
                orders={refundOrders}
                onUpdateStatus={handleUpdateStatus}
                onAddShippingCode={handleAddShippingCode}
                onCancelOrder={handleCancelOrder}
                onConfirmRefund={handleConfirmRefund}
                searchTerm={searchTerm}
                selectedStatus="all"
                selectedOrders={selectedOrders}
                onToggleOrderSelection={toggleOrderSelection}
                onSelectAll={toggleSelectAllForTab}
              />
            </TabsContent>

            <TabsContent value="dibatalkan" className="m-0 p-4">
              <EnhancedOrderTable
                orders={cancelledOrders}
                onUpdateStatus={handleUpdateStatus}
                onAddShippingCode={handleAddShippingCode}
                onCancelOrder={handleCancelOrder}
                onConfirmRefund={handleConfirmRefund}
                searchTerm={searchTerm}
                selectedStatus="all"
                selectedOrders={selectedOrders}
                onToggleOrderSelection={toggleOrderSelection}
                onSelectAll={toggleSelectAllForTab}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk Status Change Dialog */}
      <Dialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status Banyak Pesanan</DialogTitle>
            <DialogDescription>
              Pilih status baru untuk {selectedOrders.length} pesanan yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Jumlah pesanan yang akan diubah: {selectedOrders.length}</p>
            </div>

            <div>
              <Label htmlFor="bulkNewStatus">Status Baru</Label>
              <select
                id="bulkNewStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Pilih status baru</option>
                {Object.keys(ORDER_STATUS_STANDARD.statusColors).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-muted-foreground">
              Perhatian: Tindakan ini akan mengubah status untuk semua pesanan yang dipilih sekaligus.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkStatusDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={confirmBulkStatusChange}
              disabled={!newStatus}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
