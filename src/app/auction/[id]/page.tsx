"use client";
import { useState, useEffect } from "react";
import { getAuctionById, getBidsForAuction, addBidToAuction, getAuctionsFromStorage, saveAuctionsToStorage } from "@/lib/utils";
import Link from "next/link";

export default function AuctionDetailPage({ params }: { params: { id: string } }) {
  const [auction, setAuction] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [currentBid, setCurrentBid] = useState(0);
  const [bids, setBids] = useState<{ user: string; amount: number; date: Date; bidType?: 'bid' | 'buyNow' }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [winner, setWinner] = useState<{user: string, amount: number} | null>(null);
  const [isHighestBidder, setIsHighestBidder] = useState(false);
  const [bidHistory, setBidHistory] = useState<{ user: string; amount: number; date: Date; type: string }[]>([]);

  useEffect(() => {
    // Load auction data and bids
    const loadAuctionData = () => {
      const auctionData = getAuctionById(params.id);
      if (auctionData) {
        const now = new Date();
        const endDate = new Date(auctionData.endDate);
        const hasEnded = now >= endDate;

        setAuction(auctionData);
        setAuctionEnded(hasEnded);

        // Use bids from the auction data
        const auctionBids = getBidsForAuction(params.id);
        const sortedBids = [...auctionBids].sort((a, b) => b.amount - a.amount);

        // Set the current bid to the highest bid or min bid if no bids
        const currentBidValue = sortedBids.length > 0 ? sortedBids[0].amount : auctionData.minBid;
        setCurrentBid(currentBidValue);

        // Set up bid history for detailed tracking
        const history = [...auctionBids.map(bid => ({
          ...bid,
          type: 'bid'
        }))];

        // If there was a buy-now action, add it to history
        if (auctionData.maxBid && auctionData.status === 'sold') {
          history.push({
            user: 'Buy Now',
            amount: auctionData.maxBid,
            date: new Date(auctionData.endDate),
            type: 'buyNow'
          });
        }

        setBidHistory(history);

        // Determine winner if auction has ended
        if (hasEnded && sortedBids.length > 0) {
          const highestBid = sortedBids[0];
          setWinner(highestBid);
          if (highestBid.user === "Anda") {
            setIsHighestBidder(true);
          }
        } else if (sortedBids.length > 0 && sortedBids[0]?.user === "Anda") {
          // If auction is active and user is highest bidder
          setIsHighestBidder(true);
          setWinner(sortedBids[0]);
        }

        setBids(sortedBids);
      }
    };

    // Load initially with a slight delay
    setTimeout(() => {
      loadAuctionData();
      setIsLoading(false);
    }, 500);

    // Set up an interval to poll for new bids every 5 seconds while auction is active
    const pollForUpdates = setInterval(() => {
      if (!auctionEnded) {
        loadAuctionData();
      }
    }, 5000); // Poll every 5 seconds

    // Clean up the interval when component unmounts
    return () => {
      clearInterval(pollForUpdates);
    };
  }, [params.id, auctionEnded]);

  useEffect(() => {
    if (!auction || auctionEnded) return;

    const interval = setInterval(() => {
      const now = new Date();
      const endDate = new Date(auction.endDate);
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Waktu lelang telah berakhir");
        setAuctionEnded(true);

        // Add auction end event to bid history
        const auctionEndEvent = {
          user: "Sistem",
          amount: currentBid,
          date: new Date(),
          type: 'auctionEnd'
        };
        setBidHistory([...bidHistory, auctionEndEvent]);

        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours} jam ${minutes} menit ${seconds} detik`);
    }, 1000);

    return () => clearInterval(interval);
  }, [auction, auctionEnded, currentBid, bidHistory]);

  const handleBid = () => {
    if (!auction || auctionEnded) return;

    const newBid = parseInt(bidAmount);
    if (isNaN(newBid) || newBid <= currentBid) {
      alert(`Tawaran Anda harus lebih tinggi dari tawaran saat ini (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(currentBid)}).`);
      return;
    }

    // Add the bid to the backend/storage
    addBidToAuction(auction.id, "Anda", newBid);

    // Add to bid history
    const newBidHistoryItem = {
      user: "Anda",
      amount: newBid,
      date: new Date(),
      type: 'bid'
    };
    setBidHistory([...bidHistory, newBidHistoryItem]);

    // Update component state to reflect the new bid
    setCurrentBid(newBid);

    // Check if user is now the highest bidder
    setIsHighestBidder(true);
    setWinner({ user: "Anda", amount: newBid });

    setBidAmount("");
  };

  const handleBuyNow = () => {
    if (auction && auction.maxBid) {
      // Add buy-now event to bid history
      const buyNowHistoryItem = {
        user: "Anda",
        amount: auction.maxBid,
        date: new Date(),
        type: 'buyNow'
      };
      setBidHistory([...bidHistory, buyNowHistoryItem]);

      // Update auction status to sold
      const auctions = getAuctionsFromStorage();
      const updatedAuctions = auctions.map(a =>
        a.id === auction.id ? { ...a, status: 'sold' } : a
      );
      saveAuctionsToStorage(updatedAuctions);

      // Mark the auction as ended and update winner
      setAuction({ ...auction, status: 'sold' });
      setAuctionEnded(true);
      setWinner({ user: "Anda", amount: auction.maxBid });
      setIsHighestBidder(true);

      // Mock buy now
      alert(`Produk berhasil dibeli dengan harga ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(auction.maxBid)}`)
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
        <div className="mt-12">
          <div className="skeleton h-12 w-1/3 mx-auto"></div>
          <div className="skeleton h-64 mt-4"></div>
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
