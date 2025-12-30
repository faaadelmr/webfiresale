"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Users, TrendingUp, Gavel, Trophy, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const [bidError, setBidError] = useState("");
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [currentBid, setCurrentBid] = useState(0);
    const [bids, setBids] = useState<Bid[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [auctionEnded, setAuctionEnded] = useState(false);
    const [winner, setWinner] = useState<{ user: string, amount: number } | null>(null);
    const [isHighestBidder, setIsHighestBidder] = useState(false);
    const [timeExtended, setTimeExtended] = useState(false);
    const { toast } = useToast();

    // Anti-fraud config (must match backend)
    const MIN_INCREMENT_PERCENTAGE = 0.05; // 5%
    const MIN_INCREMENT_ABSOLUTE = 1000; // Rp 1.000

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

            const sortedBids = [...(auctionData.bids || [])].sort((a, b) => b.amount - a.amount);
            setBids(sortedBids);

            const highestBid = sortedBids.length > 0 ? sortedBids[0].amount : auctionData.minBid;
            setCurrentBid(auctionData.currentBid || highestBid);

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
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                setAuctionEnded(true);
                clearInterval(interval);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(interval);
    }, [auction, auctionEnded]);

    // Calculate minimum bid (matching backend logic)
    const calculateMinimumBid = () => {
        const percentageIncrement = currentBid * MIN_INCREMENT_PERCENTAGE;
        const increment = Math.max(percentageIncrement, MIN_INCREMENT_ABSOLUTE);
        return Math.ceil(currentBid + increment);
    };

    // Frontend validation - matches backend rules
    const validateBid = (value: string): string => {
        if (!value.trim()) {
            return "Masukkan jumlah tawaran";
        }

        const numValue = parseInt(value);

        if (isNaN(numValue)) {
            return "Masukkan angka yang valid";
        }

        if (numValue <= 0) {
            return "Tawaran harus lebih dari 0";
        }

        const minimumBid = calculateMinimumBid();
        if (numValue < minimumBid) {
            return `Tawaran minimum ${formatPrice(minimumBid)} (kenaikan 5% atau Rp 1.000)`;
        }

        // Warn if trying to bid higher than buy now price
        if (auction?.maxBid && numValue >= auction.maxBid) {
            return `Gunakan "Beli Sekarang" untuk harga ${formatPrice(auction.maxBid)}`;
        }

        return "";
    };

    const handleBidChange = (value: string) => {
        setBidAmount(value);
        if (value) {
            setBidError(validateBid(value));
        } else {
            setBidError("");
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
    };

    const handleBid = async () => {
        if (!auction || auctionEnded) return;

        const error = validateBid(bidAmount);
        if (error) {
            setBidError(error);
            return;
        }

        // Check if user is already highest bidder
        if (isHighestBidder) {
            toast({
                title: "Anda sudah penawar tertinggi",
                description: "Tunggu ada penawar lain sebelum menaikkan tawaran.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        const newBid = parseInt(bidAmount);

        try {
            const response = await fetch(`/api/auctions/${auction.id}/bids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: newBid }),
            });

            const result = await response.json();

            if (response.ok) {
                // Check if time was extended (anti-sniping)
                if (result.wasExtended) {
                    setTimeExtended(true);
                    toast({
                        title: "🎉 Tawaran berhasil!",
                        description: "Waktu lelang diperpanjang 3 menit karena bid di menit terakhir."
                    });
                } else {
                    toast({ title: "🎉 Tawaran berhasil ditempatkan!" });
                }
                setCurrentBid(newBid);
                setIsHighestBidder(true);
                setWinner({ user: "Anda", amount: newBid });
                setBidAmount("");
                setBidError("");
                await fetchAuction();
            } else {
                // Handle specific error messages from backend
                setBidError(result.message || "Gagal menempatkan tawaran");
                toast({ title: "Gagal", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error('Error placing bid:', error);
            toast({ title: "Error menempatkan tawaran", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBuyNow = async () => {
        if (!auction || !auction.maxBid) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/auctions/${auction.id}/bids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: auction.maxBid, isBuyNow: true }),
            });

            if (response.ok) {
                toast({ title: `🎉 Produk berhasil dibeli!` });
                window.location.href = `/checkout?auctionId=${auction.id}`;
            } else {
                const error = await response.json();
                toast({ title: "Gagal membeli produk", description: error.message, variant: "destructive" });
            }
        } catch (error) {
            console.error('Error buying now:', error);
            toast({ title: "Error membeli produk", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Suggest bid based on percentage increment
    const suggestBid = (percentage: number) => {
        const increment = Math.max(currentBid * percentage, MIN_INCREMENT_ABSOLUTE);
        const suggested = Math.ceil(currentBid + increment);
        setBidAmount(suggested.toString());
        setBidError(validateBid(suggested.toString()));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-base-content/60">Memuat detail lelang...</p>
                </div>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <Gavel className="h-20 w-20 mx-auto text-base-content/30 mb-6" />
                    <h2 className="text-3xl font-bold text-base-content">Lelang Tidak Ditemukan</h2>
                    <p className="text-base-content/60 mt-4 mb-8">Lelang yang Anda cari mungkin sudah berakhir atau tidak ada.</p>
                    <Link href="/auctions" className="btn btn-primary btn-lg gap-2">
                        <ArrowLeft className="h-5 w-5" />
                        Kembali ke Lelang
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 pt-20">


            {/* Winner Banner */}
            {isHighestBidder && auctionEnded && (
                <div className="bg-gradient-to-r from-success via-primary to-secondary text-white">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left flex items-center gap-4">
                                <Trophy className="h-12 w-12 hidden md:block" />
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold">🎉 Selamat! Anda Memenangkan Lelang!</h2>
                                    <p className="mt-2 text-white/90">
                                        Anda memenangkan <span className="font-bold">{auction.product?.name}</span> dengan tawaran {formatPrice(winner?.amount || 0)}
                                    </p>
                                </div>
                            </div>
                            <Link href={`/checkout?auctionId=${auction.id}`} className="btn btn-lg bg-white text-primary hover:bg-white/90 shadow-xl">
                                Bayar Sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Product Image Section */}
                    <div className="space-y-4">
                        <div className="card bg-base-100 shadow-xl overflow-hidden">
                            <figure className="relative aspect-square">
                                <Image
                                    src={auction.product?.image || "/placeholder.svg"}
                                    alt={auction.product?.name || "Auction Item"}
                                    fill
                                    className={cn("object-cover", auctionEnded && "grayscale opacity-70")}
                                />
                                {auctionEnded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <div className="transform -rotate-12 border-4 border-error px-8 py-3 rounded-xl bg-error/20 backdrop-blur-sm">
                                            <span className="text-4xl md:text-5xl font-bold text-error">SELESAI</span>
                                        </div>
                                    </div>
                                )}
                            </figure>
                        </div>

                        {/* Bid History Card */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Riwayat Tawaran
                                    </h3>
                                    <span className="badge badge-primary">{bids.length} tawaran</span>
                                </div>

                                <div className="overflow-y-auto max-h-64 space-y-2">
                                    {bids.length > 0 ? (
                                        bids.map((bid, index) => (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg",
                                                    index === 0 ? "bg-primary/10 border border-primary/30" : "bg-base-200"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                                        index === 0 ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {bid.user === "Anda" ? (
                                                                <span className="text-primary">Anda</span>
                                                            ) : bid.user}
                                                        </p>
                                                        <p className="text-xs text-base-content/60">
                                                            {new Date(bid.date).toLocaleString('id-ID')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-lg">{formatPrice(bid.amount)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-base-content/60">
                                            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>Belum ada tawaran</p>
                                            <p className="text-sm">Jadilah yang pertama!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auction Details Section */}
                    <div className="space-y-6">
                        {/* Product Info */}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-3">
                                {auction.product?.name || "Nama Produk"}
                            </h1>
                            <p className="text-base-content/70 text-lg leading-relaxed">
                                {auction.product?.description || "Deskripsi produk belum tersedia"}
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Time Left */}
                            <div className={cn(
                                "card",
                                auctionEnded ? "bg-neutral text-neutral-content" : "bg-info text-info-content"
                            )}>
                                <div className="card-body p-4 md:p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-5 w-5" />
                                        <span className="text-sm font-medium opacity-80">Waktu Tersisa</span>
                                    </div>
                                    {auctionEnded ? (
                                        <p className="text-xl md:text-2xl font-bold">Lelang Berakhir</p>
                                    ) : (
                                        <div className="flex gap-2 text-2xl md:text-3xl font-bold font-mono">
                                            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                                            <span>:</span>
                                            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                                            <span>:</span>
                                            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Current Bid */}
                            <div className="card bg-success text-success-content">
                                <div className="card-body p-4 md:p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Gavel className="h-5 w-5" />
                                        <span className="text-sm font-medium opacity-80">Tawaran Terkini</span>
                                    </div>
                                    <p className="text-xl md:text-2xl font-bold">{formatPrice(currentBid)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Winner/Ended Card */}
                        {auctionEnded && (
                            <div className="card bg-warning text-warning-content">
                                <div className="card-body">
                                    <div className="flex items-center gap-3">
                                        <Trophy className="h-8 w-8" />
                                        <div>
                                            <h3 className="font-bold text-lg">Lelang Telah Berakhir</h3>
                                            <p>
                                                {winner
                                                    ? `Pemenang: ${winner.user === "Anda" ? "🎉 Anda" : winner.user} dengan ${formatPrice(winner.amount)}`
                                                    : "Tidak ada tawaran yang ditempatkan"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bid Form */}
                        {!auctionEnded && (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Gavel className="h-5 w-5 text-primary" />
                                        Pasang Tawaran
                                    </h3>

                                    {/* Quick Bid Suggestions */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="text-sm text-base-content/60">Kenaikan:</span>
                                        <button onClick={() => suggestBid(0.05)} className="btn btn-xs btn-outline">+5% (min)</button>
                                        <button onClick={() => suggestBid(0.10)} className="btn btn-xs btn-outline">+10%</button>
                                        <button onClick={() => suggestBid(0.20)} className="btn btn-xs btn-outline">+20%</button>
                                        <button onClick={() => suggestBid(0.50)} className="btn btn-xs btn-outline">+50%</button>
                                    </div>

                                    {/* Already highest bidder warning */}
                                    {isHighestBidder && (
                                        <div className="alert alert-warning mb-4">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>Anda sudah penawar tertinggi. Tunggu penawar lain.</span>
                                        </div>
                                    )}

                                    {/* Bid Input */}
                                    <div className="form-control">
                                        <div className="join w-full">
                                            <span className="join-item btn btn-neutral">Rp</span>
                                            <input
                                                type="number"
                                                placeholder="Masukkan jumlah tawaran"
                                                className={cn(
                                                    "input input-bordered join-item w-full text-lg",
                                                    bidError && "input-error"
                                                )}
                                                value={bidAmount}
                                                onChange={(e) => handleBidChange(e.target.value)}
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                className={cn("btn btn-primary join-item px-6", isSubmitting && "loading")}
                                                onClick={handleBid}
                                                disabled={isSubmitting || !!bidError}
                                            >
                                                {isSubmitting ? "" : "Tawar"}
                                            </button>
                                        </div>

                                        {/* Validation Message */}
                                        {bidError ? (
                                            <label className="label">
                                                <span className="label-text-alt text-error flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {bidError}
                                                </span>
                                            </label>
                                        ) : bidAmount && !bidError ? (
                                            <label className="label">
                                                <span className="label-text-alt text-success flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Tawaran valid
                                                </span>
                                            </label>
                                        ) : (
                                            <label className="label">
                                                <span className="label-text-alt text-base-content/60">
                                                    Minimum: {formatPrice(calculateMinimumBid())} (kenaikan 5% atau Rp 1.000)
                                                </span>
                                            </label>
                                        )}
                                    </div>

                                    {/* Buy Now Button */}
                                    {auction.maxBid && (
                                        <div className="divider">ATAU</div>
                                    )}

                                    {auction.maxBid && (
                                        <button
                                            className={cn("btn btn-warning btn-lg w-full gap-2", isSubmitting && "loading")}
                                            onClick={handleBuyNow}
                                            disabled={isSubmitting}
                                        >
                                            {!isSubmitting && <Trophy className="h-5 w-5" />}
                                            Beli Sekarang {formatPrice(auction.maxBid)}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Additional Info */}
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h3 className="font-bold mb-3">Informasi Lelang</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-base-content/60">Harga Awal</p>
                                        <p className="font-semibold">{formatPrice(auction.minBid)}</p>
                                    </div>
                                    <div>
                                        <p className="text-base-content/60">Total Tawaran</p>
                                        <p className="font-semibold">{auction.bidCount} penawaran</p>
                                    </div>
                                    <div>
                                        <p className="text-base-content/60">Mulai</p>
                                        <p className="font-semibold">{new Date(auction.startDate).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div>
                                        <p className="text-base-content/60">Berakhir</p>
                                        <p className="font-semibold">{new Date(auction.endDate).toLocaleDateString('id-ID')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Auction Rules */}
                        <div className="card bg-base-200">
                            <div className="card-body p-4">
                                <h3 className="font-bold text-sm mb-2">Aturan Lelang</h3>
                                <ul className="text-xs text-base-content/70 space-y-1">
                                    <li>• Kenaikan minimum: 5% atau Rp 1.000</li>
                                    <li>• Bid di 5 menit terakhir akan perpanjang waktu 3 menit</li>
                                    <li>• Maksimal 20 tawaran per jam</li>
                                    <li>• Penawar tertinggi tidak bisa bid lagi sampai ada penawar lain</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
