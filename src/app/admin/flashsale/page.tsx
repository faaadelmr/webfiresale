"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Edit, Trash2, Calendar, Timer, DollarSign, Package, Clock, Zap, ShoppingBasket } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import type { FlashSale, Product } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Combine flash sale data with product data for display
const useEnhancedFlashSales = () => {
  const [enhancedFlashSales, setEnhancedFlashSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch products from API
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();

      // Fetch flash sales from API
      const flashSalesRes = await fetch('/api/flashsales');
      const flashSalesData = await flashSalesRes.json();

      setProducts(productsData);
      setFlashSales(flashSalesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const enhanced = flashSales.map(fs => {
      const product = products.find(p => p.id === fs.productId);
      return { ...fs, product };
    }).filter(fs => fs.product);
    setEnhancedFlashSales(enhanced);
  }, [flashSales, products]);

  return { enhancedFlashSales, products, refreshData: fetchData, loading };
};


export default function AdminFlashSalePage() {
  const { enhancedFlashSales, products, refreshData, loading } = useEnhancedFlashSales();
  const [filteredFlashSales, setFilteredFlashSales] = useState<FlashSale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [flashSaleToDelete, setFlashSaleToDelete] = useState<string | null>(null);
  const [currentFlashSale, setCurrentFlashSale] = useState<Partial<FlashSale> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let result = enhancedFlashSales;

    if (searchTerm) {
      result = result.filter(fs =>
        fs.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fs.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      result = result.filter(fs => {
        const now = new Date();
        const start = new Date(fs.startDate);
        const end = new Date(fs.endDate);
        let status: FlashSale["status"] = "ended";
        if (now < start) status = "upcoming";
        else if (now >= start && now <= end) {
          status = fs.sold >= fs.limitedQuantity ? "sold-out" : "active";
        }
        return status === selectedStatus;
      });
    }

    setFilteredFlashSales(result);
  }, [searchTerm, selectedStatus, enhancedFlashSales]);

  const handleAddFlashSale = () => {
    setIsEditing(false);
    setCurrentFlashSale({
      productId: "",
      flashSalePrice: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      limitedQuantity: 0,
      sold: 0,
      maxOrderQuantity: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEditFlashSale = (flashSale: FlashSale) => {
    setIsEditing(true);
    setCurrentFlashSale({ ...flashSale });
    setIsDialogOpen(true);
  };

  const handleDeleteFlashSale = (id: string) => {
    setFlashSaleToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteFlashSale = async () => {
    if (!flashSaleToDelete) return;

    try {
      const response = await fetch(`/api/flashsales/${flashSaleToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: "Flash Sale Dihapus", description: "Flash sale berhasil dihapus" });
        refreshData();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus flash sale", variant: "destructive" });
    }

    setIsDeleteDialogOpen(false);
    setFlashSaleToDelete(null);
  };

  const saveFlashSale = async () => {
    if (!currentFlashSale || !currentFlashSale.productId) return;

    try {
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `/api/flashsales/${currentFlashSale.id}` : '/api/flashsales';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentFlashSale.productId,
          flashSalePrice: currentFlashSale.flashSalePrice,
          startDate: currentFlashSale.startDate,
          endDate: currentFlashSale.endDate,
          limitedQuantity: currentFlashSale.limitedQuantity,
          sold: isEditing ? currentFlashSale.sold : 0,
          maxOrderQuantity: currentFlashSale.maxOrderQuantity,
          status: "active",
        }),
      });

      if (response.ok) {
        toast({ title: isEditing ? "Flash Sale Diperbarui" : "Flash Sale Ditambahkan" });
        refreshData();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan flash sale",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (flashSale: FlashSale) => {
    const now = new Date();
    const start = new Date(flashSale.startDate);
    const end = new Date(flashSale.endDate);

    if (now < start) {
      return <div className="badge badge-neutral">Akan Datang</div>;
    } else if (now >= start && now <= end) {
      if (flashSale.sold >= flashSale.limitedQuantity) {
        return <div className="badge badge-error">Habis</div>;
      }
      return <div className="badge badge-primary">Aktif</div>;
    } else {
      return <div className="badge badge-secondary">Berakhir</div>;
    }
  };

  const getDiscountPercentage = (originalPrice: number, flashSalePrice: number) => {
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - flashSalePrice) / originalPrice) * 100);
  };

  const calculateTimeLeft = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Berakhir";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} hari ${hours} jam`;
    if (hours > 0) return `${hours} jam ${minutes} menit`;
    return `${minutes} menit`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Flash Sale</h1>
          <p className="text-base-content/70">Atur dan kelola produk flash sale</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddFlashSale}>
          <Zap className="mr-2 h-4 w-4" />
          Tambah Flash Sale
        </button>
      </div>

      <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-base-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Daftar Flash Sale</h2>
              <p className="text-sm text-base-content/60">{filteredFlashSales.length} flash sale ditemukan</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                <input type="search" placeholder="Cari nama produk..." className="input input-bordered w-full md:w-64 pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="select select-bordered w-full sm:w-40" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="all">Semua Status</option>
                <option value="upcoming">Akan Datang</option>
                <option value="active">Aktif</option>
                <option value="sold-out">Habis</option>
                <option value="ended">Berakhir</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga</th>
                <th>Diskon</th>
                <th>Stok</th>
                <th>Sisa Waktu</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlashSales.length > 0 ? (
                filteredFlashSales.map((flashSale) => (
                  flashSale.product && (
                    <tr key={flashSale.id} className="hover">
                      <td className="font-medium">
                        <div className="flex items-center gap-4">
                          <Image src={flashSale.product.image} alt={flashSale.product.name} width={64} height={64} className="rounded-md object-cover" />
                          <div>
                            <div>{flashSale.product.name}</div>
                            <div className="text-xs text-base-content/60">ID: {flashSale.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold">{formatPrice(flashSale.flashSalePrice)}</div>
                          <div className="text-xs text-base-content/60 line-through">{formatPrice(flashSale.product.originalPrice)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-secondary">-{getDiscountPercentage(flashSale.product.originalPrice, flashSale.flashSalePrice)}%</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-base-content/60" />
                          <span>{flashSale.limitedQuantity - flashSale.sold} / {flashSale.limitedQuantity}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-base-content/60" />
                          <span>{calculateTimeLeft(flashSale.endDate)}</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(flashSale)}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-outline btn-sm" onClick={() => handleEditFlashSale(flashSale)}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="btn btn-error btn-sm" onClick={() => handleDeleteFlashSale(flashSale.id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-base-content/60 py-8">
                    Belum ada flash sale. Tambahkan flash sale baru untuk memulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flash Sale Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold">{isEditing ? "Edit Flash Sale" : "Tambah Flash Sale Baru"}</h3>
              <p className="text-sm text-base-content/60 mb-4">{isEditing ? "Ubah informasi flash sale yang dipilih" : "Pilih produk untuk ditambahkan ke flash sale"}</p>

              <div className="space-y-4 pt-4">
                <div className="form-control">
                  <Label htmlFor="product">Pilih Produk</Label>
                  <select
                    id="product"
                    value={currentFlashSale?.productId}
                    onChange={(e) => setCurrentFlashSale({ ...currentFlashSale!, productId: e.target.value })}
                    disabled={isEditing}
                    className="select select-bordered"
                  >
                    <option value="" disabled>Pilih produk dari daftar</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <Label htmlFor="flashSalePrice">Harga Flash Sale</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                      <Input id="flashSalePrice" type="number" value={currentFlashSale?.flashSalePrice || 0} onChange={(e) => setCurrentFlashSale({ ...currentFlashSale!, flashSalePrice: parseFloat(e.target.value) || 0 })} placeholder="0" className="pl-8" />
                    </div>
                  </div>
                  <div className="form-control">
                    <Label htmlFor="limitedQuantity">Jumlah Stok Flash Sale</Label>
                    <Input id="limitedQuantity" type="number" value={currentFlashSale?.limitedQuantity || 0} onChange={(e) => setCurrentFlashSale({ ...currentFlashSale!, limitedQuantity: parseInt(e.target.value) || 0 })} placeholder="0" />
                  </div>
                </div>

                <div className="form-control">
                  <Label htmlFor="maxOrderQuantity">Maks. Pembelian per Pelanggan</Label>
                  <div className="relative">
                    <ShoppingBasket className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                    <Input id="maxOrderQuantity" type="number" value={currentFlashSale?.maxOrderQuantity || 0} onChange={(e) => setCurrentFlashSale({ ...currentFlashSale!, maxOrderQuantity: parseInt(e.target.value) || 0 })} placeholder="0 (0 = tidak terbatas)" className="pl-8" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                      <Input id="startDate" type="datetime-local" value={currentFlashSale?.startDate instanceof Date ? new Date(currentFlashSale.startDate.getTime() - (currentFlashSale.startDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} onChange={(e) => setCurrentFlashSale({ ...currentFlashSale!, startDate: new Date(e.target.value) })} className="pl-8" />
                    </div>
                  </div>

                  <div className="form-control">
                    <Label htmlFor="endDate">Tanggal Berakhir</Label>
                    <div className="relative">
                      <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                      <Input id="endDate" type="datetime-local" value={currentFlashSale?.endDate instanceof Date ? new Date(currentFlashSale.endDate.getTime() - (currentFlashSale.endDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} onChange={(e) => setCurrentFlashSale({ ...currentFlashSale!, endDate: new Date(e.target.value) })} className="pl-8" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-6">
                <button className="btn btn-ghost" onClick={() => setIsDialogOpen(false)}>Batal</button>
                <button className="btn btn-primary" onClick={saveFlashSale} disabled={!currentFlashSale?.productId}>
                  {isEditing ? "Perbarui" : "Simpan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
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
              <h3 className="text-lg font-semibold">Hapus Flash Sale</h3>
              <p className="py-4">Apakah Anda yakin ingin menghapus flash sale ini? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={() => setIsDeleteDialogOpen(false)}>Batal</button>
                <button className="btn btn-error" onClick={confirmDeleteFlashSale}>Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
