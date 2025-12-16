"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Edit, Trash2, Calendar, Timer, DollarSign, Package, Clock, Hammer, ShoppingBasket } from "lucide-react";
import { formatPrice, getAuctionsFromStorage, saveAuctionsToStorage, getProductsFromStorage, reserveProductQuantity, restoreProductQuantity, getBidsForAuction } from "@/lib/utils";
import Image from "next/image";
import type { Auction, Product } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Combine auction data with product data for display
const useEnhancedAuctions = () => {
  const [enhancedAuctions, setEnhancedAuctions] = useState<Auction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);

  useEffect(() => {
    const productsFromStorage = getProductsFromStorage();
    const auctionsFromStorage = getAuctionsFromStorage();
    setProducts(productsFromStorage);
    setAuctions(auctionsFromStorage);
  }, []);

  useEffect(() => {
    const enhanced = auctions.map(a => {
      const product = products.find(p => p.id === a.productId);
      return { ...a, product };
    }).filter(a => a.product); // Filter out auctions with no matching product
    setEnhancedAuctions(enhanced);
  }, [auctions, products]);

  const refreshData = () => {
     setProducts(getProductsFromStorage());
     setAuctions(getAuctionsFromStorage());
  }

  return { enhancedAuctions, products, refreshData, setAuctions };
};

export default function AdminAuctionPage() {
  const { enhancedAuctions, products, refreshData, setAuctions } = useEnhancedAuctions();
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [auctionToDelete, setAuctionToDelete] = useState<string | null>(null);
  const [currentAuction, setCurrentAuction] = useState<Partial<Auction> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let result = enhancedAuctions;

    if (searchTerm) {
      result = result.filter(a =>
        a.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
        result = result.filter(a => {
            const now = new Date();
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);
            let status: Auction["status"] = "ended";
            if (now < start) status = "upcoming";
            else if (now >= start && now <= end) status = "active";
            else status = "ended";
            return status === selectedStatus;
        });
    }

    setFilteredAuctions(result);
  }, [searchTerm, selectedStatus, enhancedAuctions]);

  const handleAddAuction = () => {
    setIsEditing(false);
    setCurrentAuction({
      productId: "",
      minBid: 0,
      maxBid: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      bidCount: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEditAuction = (auction: Auction) => {
    setIsEditing(true);
    setCurrentAuction({ ...auction });
    setIsDialogOpen(true);
  };

  const handleDeleteAuction = (id: string) => {
    setAuctionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAuction = () => {
    if (auctionToDelete) {
      const allAuctions = getAuctionsFromStorage();
      const auctionToDeleteObj = allAuctions.find(a => a.id === auctionToDelete);

      if (auctionToDeleteObj) {
        // Restore the product quantity when deleting the auction
        restoreProductQuantity(auctionToDeleteObj.productId, 1); // Auctions reserve 1 item
      }

      const updatedAuctions = allAuctions.filter(a => a.id !== auctionToDelete);
      saveAuctionsToStorage(updatedAuctions);
      setAuctions(updatedAuctions); // Update local state to re-trigger effects
      setIsDeleteDialogOpen(false);
      setAuctionToDelete(null);
    }
  };

  const saveAuction = () => {
    if (!currentAuction || !currentAuction.productId) return;

    const allAuctions = getAuctionsFromStorage();

    // For new auctions, we need to reserve 1 product quantity (auctions are for single items)
    if (!isEditing) {
      try {
        reserveProductQuantity(currentAuction.productId, 1);
      } catch (error) {
        alert(`Gagal membuat lelang: ${(error as Error).message}`);
        return;
      }
    }

    const auctionToSave: Auction = {
      id: currentAuction.id || `auc_${Date.now()}`,
      productId: currentAuction.productId,
      minBid: currentAuction.minBid || 0,
      maxBid: currentAuction.maxBid || undefined,
      startDate: currentAuction.startDate ? new Date(currentAuction.startDate) : new Date(),
      endDate: currentAuction.endDate ? new Date(currentAuction.endDate) : new Date(),
      bidCount: isEditing ? (currentAuction.bidCount || 0) : 0,
      status: "active", // Status will be calculated dynamically on display
    };

    let updatedAuctions: Auction[];

    if (isEditing && currentAuction.id) {
      updatedAuctions = allAuctions.map(a =>
        a.id === currentAuction.id ? auctionToSave : a
      );
    } else {
      updatedAuctions = [...allAuctions, auctionToSave];
    }

    saveAuctionsToStorage(updatedAuctions);
    setAuctions(updatedAuctions);
    setIsDialogOpen(false);
  };

  const getStatusBadge = (auction: Auction) => {
    const now = new Date();
    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);

    if (now < start) {
      return <div className="badge badge-neutral">Akan Datang</div>;
    } else if (now >= start && now <= end) {
      return <div className="badge badge-primary">Aktif</div>;
    } else {
      return <div className="badge badge-secondary">Berakhir</div>;
    }
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

  const getHighestBid = (auction: Auction) => {
    // Get the actual highest bid from the bids storage instead of relying on stored currentBid
    const bids = getBidsForAuction(auction.id);
    if (bids.length > 0) {
      return Math.max(...bids.map(bid => bid.amount), auction.minBid);
    }
    return auction.minBid;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Lelang</h1>
          <p className="text-base-content/70">Atur dan kelola produk lelang</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddAuction}>
          <Hammer className="mr-2 h-4 w-4" />
          Tambah Lelang
        </button>
      </div>

      <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-base-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Daftar Lelang</h2>
              <p className="text-sm text-base-content/60">{filteredAuctions.length} lelang ditemukan</p>
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
                  <th>Harga Minimum</th>
                  <th>Tawaran Terkini</th>
                  <th>Jumlah Tawaran</th>
                  <th>Sisa Waktu</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuctions.length > 0 ? (
                  filteredAuctions.map((auction) => (
                    auction.product && (
                    <tr key={auction.id} className="hover">
                      <td className="font-medium">
                        <div className="flex items-center gap-4">
                          <Image src={auction.product.image} alt={auction.product.name} width={64} height={64} className="rounded-md object-cover" />
                          <div>
                            <div>{auction.product.name}</div>
                            <Link href={`/auction/${auction.id}`} className="text-xs text-primary/60 hover:underline">
                              ID: {auction.id}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold">{formatPrice(auction.minBid)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-primary">{formatPrice(getHighestBid(auction))}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-base-content/60" />
                          <span>{getBidsForAuction(auction.id).length}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-base-content/60" />
                          <span>{calculateTimeLeft(auction.endDate)}</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(auction)}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-outline btn-sm" onClick={() => handleEditAuction(auction)}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="btn btn-error btn-sm" onClick={() => handleDeleteAuction(auction.id)}>
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
                      Belum ada lelang. Tambahkan lelang baru untuk memulai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* Auction Dialog */}
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
              <h3 className="text-lg font-semibold">{isEditing ? "Edit Lelang" : "Tambah Lelang Baru"}</h3>
              <p className="text-sm text-base-content/60 mb-4">{isEditing ? "Ubah informasi lelang yang dipilih" : "Pilih produk untuk ditambahkan ke lelang"}</p>

              <div className="space-y-4 pt-4">
                <div className="form-control">
                  <Label htmlFor="product">Pilih Produk</Label>
                  <select
                    id="product"
                    value={currentAuction?.productId}
                    onChange={(e) => setCurrentAuction({...currentAuction!, productId: e.target.value})}
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
                    <Label htmlFor="minBid">Harga Minimum (Bid)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                      <Input id="minBid" type="number" value={currentAuction?.minBid || 0} onChange={(e) => setCurrentAuction({...currentAuction!, minBid: parseFloat(e.target.value) || 0})} placeholder="0" className="pl-8" />
                    </div>
                  </div>

                  <div className="form-control">
                    <Label htmlFor="maxBid">Harga Beli Langsung (Opsional)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                      <Input id="maxBid" type="number" value={currentAuction?.maxBid || 0} onChange={(e) => setCurrentAuction({...currentAuction!, maxBid: parseFloat(e.target.value) || 0})} placeholder="0" className="pl-8" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                      <Input id="startDate" type="datetime-local" value={currentAuction?.startDate instanceof Date ? new Date(currentAuction.startDate.getTime() - (currentAuction.startDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} onChange={(e) => setCurrentAuction({...currentAuction!, startDate: new Date(e.target.value)})} className="pl-8" />
                    </div>
                  </div>

                  <div className="form-control">
                    <Label htmlFor="endDate">Tanggal Berakhir</Label>
                    <div className="relative">
                      <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                      <Input id="endDate" type="datetime-local" value={currentAuction?.endDate instanceof Date ? new Date(currentAuction.endDate.getTime() - (currentAuction.endDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} onChange={(e) => setCurrentAuction({...currentAuction!, endDate: new Date(e.target.value)})} className="pl-8" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-6">
                <button className="btn btn-ghost" onClick={() => setIsDialogOpen(false)}>Batal</button>
                <button className="btn btn-primary" onClick={saveAuction} disabled={!currentAuction?.productId}>
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
              <h3 className="text-lg font-semibold">Hapus Lelang</h3>
              <p className="py-4">Apakah Anda yakin ingin menghapus lelang ini? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={() => setIsDeleteDialogOpen(false)}>Batal</button>
                <button className="btn btn-error" onClick={confirmDeleteAuction}>Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
