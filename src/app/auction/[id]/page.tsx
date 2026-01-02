"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

interface Bid {
  user: string;
  amount: number;
  date: Date;
  bidType?: 'bid' | 'buyNow';
}

interface AuctionProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
}

interface Auction {
  id: string;
  productId: string;
  product?: AuctionProduct;
  minBid: number;
  maxBid?: number;
  currentBid?: number;
  bidCount: number;
  startDate: Date;
  endDate: Date;
  status: string;
  bids?: Bid[];
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [currentBid, setCurrentBid] = useState(0);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [winner, setWinner] = useState<{ user: string, amount: number } | null>(null);
  const [isHighestBidder, setIsHighestBidder] = useState(false);
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch auction from API
  const fetchAuction = async () => {
    try {
      const response = await fetch(`/api/auctions/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setAuction(null);
          return;
        }
        throw new Error('Failed to fetch auction');
      }

      const data = await response.json();

      const auctionData: Auction = {
        id: data.id,
        productId: data.productId,
        product: data.product ? {
          id: data.product.id,
          name: data.product.name,
          description: data.product.description,
          image: data.product.image,
          originalPrice: data.product.originalPrice,
        } : undefined,
        minBid: data.minBid,
        maxBid: data.maxBid ?? undefined,
        currentBid: data.currentBid ?? undefined,
        bidCount: data.bidCount,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status,
        bids: data.bids?.map((b: any) => ({
          user: b.user,
          amount: b.amount,
          date: new Date(b.date),
          bidType: 'bid' as const,
        })),
      };

      const now = new Date();
      const endDate = new Date(auctionData.endDate);
      const hasEnded = now >= endDate || auctionData.status === 'ended' || auctionData.status === 'sold';

      setAuction(auctionData);
      setAuctionEnded(hasEnded);

      // Sort bids by amount (highest first)
      const sortedBids = [...(auctionData.bids || [])].sort((a, b) => b.amount - a.amount);
      setBids(sortedBids);

      // Set current bid
      const highestBid = sortedBids.length > 0 ? sortedBids[0].amount : auctionData.minBid;
      setCurrentBid(auctionData.currentBid || highestBid);

      // Determine winner
      if (hasEnded && sortedBids.length > 0) {
        const highestBidder = sortedBids[0];
        setWinner(highestBidder);
        if (highestBidder.user === "Anda") {
          setIsHighestBidder(true);
        }
      } else if (sortedBids.length > 0 && sortedBids[0]?.user === "Anda") {
        setIsHighestBidder(true);
        setWinner(sortedBids[0]);
      }
    } catch (error) {
      console.error('Error fetching auction:', error);
      toast({ title: "Gagal memuat data lelang", variant: "destructive" });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchAuction();
      setIsLoading(false);
    };

    loadData();

    // Poll for updates every 5 seconds while auction is active
    const pollInterval = setInterval(() => {
      if (!auctionEnded) {
        fetchAuction();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [id, auctionEnded]);

  useEffect(() => {
    if (!auction || auctionEnded) return;

    const interval = setInterval(() => {
      const now = new Date();
      const endDate = new Date(auction.endDate);
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Waktu lelang telah berakhir");
        setAuctionEnded(true);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours} jam ${minutes} menit ${seconds} detik`);
    }, 1000);

    return () => clearInterval(interval);
  }, [auction, auctionEnded]);

  const handleBid = async () => {
    if (!auction || auctionEnded) return;

    // Check if user is logged in
    if (status !== 'authenticated') {
      toast({
        title: 'Silakan Login',
        description: 'Anda harus login terlebih dahulu untuk menempatkan tawaran.',
      });
      router.push(`/signin?callbackUrl=/auction/${id}`);
      return;
    }

    const newBid = parseInt(bidAmount);
    if (isNaN(newBid) || newBid <= currentBid) {
      toast({
        title: "Tawaran tidak valid",
        description: `Tawaran Anda harus lebih tinggi dari ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(currentBid)}.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/auctions/${auction.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: newBid }),
      });

      if (response.ok) {
        toast({ title: "Tawaran berhasil ditempatkan!" });
        setCurrentBid(newBid);
        setIsHighestBidder(true);
        setWinner({ user: "Anda", amount: newBid });
        setBidAmount("");
        await fetchAuction(); // Refresh data
      } else {
        const error = await response.json();
        toast({ title: "Gagal menempatkan tawaran", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      toast({ title: "Error menempatkan tawaran", variant: "destructive" });
    }
  };

  const handleBuyNow = async () => {
    if (!auction || !auction.maxBid) return;

    // Check if user is logged in
    if (status !== 'authenticated') {
      toast({
        title: 'Silakan Login',
        description: 'Anda harus login terlebih dahulu untuk membeli produk.',
      });
      router.push(`/signin?callbackUrl=/auction/${id}`);
      return;
    }

    try {
      const response = await fetch(`/api/auctions/${auction.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: auction.maxBid, isBuyNow: true }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({ title: `Produk berhasil dibeli dengan harga ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(auction.maxBid)}` });

        // Redirect to checkout immediately
        window.location.href = `/checkout?auctionId=${auction.id}`;
      } else {
        const error = await response.json();
        toast({ title: "Gagal membeli produk", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error buying now:', error);
      toast({ title: "Error membeli produk", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card bg-base-100 shadow-xl overflow-hidden">
            <div className="skeleton h-96 w-full"></div>
          </div>
          <div className="space-y-6">
            <div className="skeleton h-8 w-3/4"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-5/6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="skeleton h-24"></div>
              <div className="skeleton h-24"></div>
            </div>
            <div className="skeleton h-32"></div>
            <div className="skeleton h-12"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Lelang tidak ditemukan</h2>
          <p className="text-base-content/70 mt-2">Lelang yang Anda cari mungkin sudah berakhir atau tidak ada.</p>
          <Link href="/" className="btn btn-primary mt-4">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {isHighestBidder && auctionEnded && (
        <div className="mb-6 bg-gradient-to-r from-success to-primary text-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold">🎉 Selamat! Anda Memenangkan Lelang! 🎉</h2>
              <p className="mt-2">Anda memenangkan lelang {auction.product?.name} dengan tawaran {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(winner?.amount || 0)}</p>
            </div>
            <Link href={`/checkout?auctionId=${auction.id}`} className="btn btn-accent btn-lg">
              Bayar Sekarang
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card bg-base-100 shadow-xl overflow-hidden">
          <figure className="relative">
            <img
              src={auction.product?.image || "/placeholder.svg"}
              alt={auction.product?.name || "Auction Item"}
              className="w-full h-96 object-cover"
            />
          </figure>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">{auction.product?.name || "Nama Produk"}</h1>
            <p className="text-base-content/80">{auction.product?.description || "Deskripsi produk belum tersedia"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`card ${auctionEnded ? "bg-secondary text-secondary-content" : "bg-info text-info-content"}`}>
              <div className="card-body">
                <h2 className="card-title text-lg">Waktu Tersisa</h2>
                <p className="text-2xl font-bold">{timeLeft}</p>
              </div>
            </div>

            <div className="card bg-success text-success-content">
              <div className="card-body">
                <h2 className="card-title text-lg">Tawaran Terkini</h2>
                <p className="text-2xl font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(currentBid)}</p>
              </div>
            </div>
          </div>

          {auctionEnded && (
            <div className="card bg-warning text-warning-content">
              <div className="card-body">
                <h2 className="card-title text-lg">Lelang Telah Berakhir</h2>
                <p>
                  {winner
                    ? `Pemenang: ${winner.user === "Anda" ? "Anda" : winner.user} dengan tawaran ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(winner.amount)}`
                    : "Tidak ada tawaran yang ditempatkan"}
                </p>
              </div>
            </div>
          )}

          {!auctionEnded && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Tawarkan Harga Anda</h2>
                <div className="form-control w-full">
                  <div className="input-group">
                    <span>Rp</span>
                    <input
                      type="number"
                      placeholder="Masukkan jumlah tawaran"
                      className="input input-bordered w-full"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleBid}
                    >
                      Tawar
                    </button>
                  </div>
                  <label className="label">
                    <span className="label-text-alt">Tawaran minimum: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(currentBid + 1)}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {auction.maxBid && !auctionEnded && (
            <button
              className="btn btn-warning btn-wide w-full"
              onClick={handleBuyNow}
            >
              Beli Sekarang {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(auction.maxBid)}
            </button>
          )}
        </div>
      </div>

      <div className="mt-12">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-4">Riwayat Tawaran</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pengguna</th>
                    <th>Tawaran</th>
                    <th>Tipe</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.length > 0 ? (
                    bids.map((bid, index) => (
                      <tr key={index} className={bid.user === "Anda" ? "bg-primary/10" : ""}>
                        <td>
                          <div className="font-medium flex items-center">
                            {bid.user === "Anda" && (
                              <span className="badge badge-primary mr-2">Anda</span>
                            )}
                            {bid.user}
                          </div>
                        </td>
                        <td>
                          <span className="font-bold text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bid.amount)}</span>
                        </td>
                        <td>
                          <span className={`badge ${bid.bidType === 'buyNow' ? 'badge-warning' : 'badge-info'}`}>
                            {bid.bidType === 'buyNow' ? 'Beli Sekarang' : 'Tawaran'}
                          </span>
                        </td>
                        <td>
                          <span>{new Date(bid.date).toLocaleString('id-ID')}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-base-content/60 py-4">Belum ada tawaran untuk item ini</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
