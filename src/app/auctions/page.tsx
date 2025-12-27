"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import placeholderImages from "@/lib/placeholder-images.json";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Search, Gavel, Eye, Menu } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types";
import { getProfileFromStorage, cn } from "@/lib/utils";

// Auction type matching API response
interface Auction {
    id: string;
    productId: string;
    product: {
        id: string;
        name: string;
        description: string;
        image: string;
        originalPrice: number;
        quantity: number;
        weight: number;
    };
    minBid: number;
    maxBid: number | null;
    currentBid: number;
    bidCount: number;
    startDate: string;
    endDate: string;
    status: string;
}

export default function AuctionsPage() {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);
    const [profile, setProfile] = React.useState<UserProfile | null>(null);
    const [auctions, setAuctions] = React.useState<Auction[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Fetch profile
    React.useEffect(() => {
        const fetchProfile = () => {
            setProfile(getProfileFromStorage());
        };
        fetchProfile();
        window.addEventListener('storage', fetchProfile);
        return () => {
            window.removeEventListener('storage', fetchProfile);
        };
    }, []);

    // Fetch auctions from API
    React.useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const response = await fetch('/api/auctions');
                if (response.ok) {
                    const data = await response.json();
                    setAuctions(data);
                }
            } catch (error) {
                console.error('Error fetching auctions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuctions();
    }, []);

    // Carousel state
    React.useEffect(() => {
        if (!api) return;

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(price);
    };

    const isAuctionEnded = (auction: Auction) => {
        const now = new Date();
        const endDate = new Date(auction.endDate);
        return endDate < now || auction.status === 'ended' || auction.status === 'sold';
    };

    const getInitials = (name: string) => {
        if (!name) return '';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-base-200">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    const otherAuctions = auctions.slice(0, 3);

    return (
        <div className="flex flex-col min-h-screen bg-base-200 text-base-content">
            <div className="flex-1 w-full max-w-screen-2xl mx-auto flex flex-col">
                {/* Main Content */}
                <main className="flex-1 flex flex-col justify-center px-6 relative overflow-hidden">
                    {/* Background Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-[15rem] md:text-[20rem] font-bold text-base-content/5 opacity-50 select-none -translate-y-8">
                            Lelang
                        </p>
                    </div>

                    {auctions.length === 0 ? (
                        <div className="text-center py-20">
                            <Gavel className="h-16 w-16 mx-auto text-base-content/30 mb-4" />
                            <h2 className="text-2xl font-bold text-base-content/60">Tidak Ada Lelang</h2>
                            <p className="text-base-content/40 mt-2">Kembali lagi nanti untuk lelang menarik!</p>
                        </div>
                    ) : (
                        <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
                            <CarouselContent className="-ml-4">
                                {auctions.map((auction, index) => (
                                    <CarouselItem key={auction.id} className="pl-4 basis-full">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                            {/* Product Image with 3D Hover Effect */}
                                            <div className="relative h-[400px] md:h-[500px] w-full flex justify-center items-center">
                                                <div className="hover-3d">
                                                    <figure className="w-60 md:w-80 rounded-2xl overflow-hidden">
                                                        <Image
                                                            src={auction.product.image || '/placeholder.png'}
                                                            alt={auction.product.name}
                                                            width={320}
                                                            height={400}
                                                            className={cn("w-full h-auto object-contain", isAuctionEnded(auction) && "opacity-50 grayscale")}
                                                        />
                                                    </figure>
                                                    {/* 8 empty divs needed for the 3D effect */}
                                                    <div></div>
                                                    <div></div>
                                                    <div></div>
                                                    <div></div>
                                                    <div></div>
                                                    <div></div>
                                                    <div></div>
                                                    <div></div>
                                                </div>
                                                {/* SELESAI Stamp for ended auctions */}
                                                {isAuctionEnded(auction) && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="transform -rotate-12 border-4 border-error px-6 py-2 rounded-lg">
                                                            <span className="text-4xl md:text-6xl font-bold text-error tracking-wider">SELESAI</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Details */}
                                            <div className="relative z-10">
                                                <p className="text-base-content/50 font-semibold">Lot</p>
                                                <h2 className="text-6xl md:text-8xl font-bold text-base-content my-1">
                                                    #{String(index + 1).padStart(3, '0')}
                                                </h2>
                                                <p className="text-base-content/50 mb-1">{auction.bidCount} penawaran</p>
                                                <h3 className="text-2xl md:text-4xl font-semibold text-base-content/80">{auction.product.name}</h3>

                                                <p className="text-sm text-primary mt-8">Penawaran Saat Ini</p>
                                                <p className="text-3xl md:text-4xl font-bold text-primary mb-6">{formatPrice(auction.currentBid)}</p>

                                                <div className="flex items-center gap-2">
                                                    {isAuctionEnded(auction) ? (
                                                        <div className="badge badge-lg badge-neutral">Lelang Telah Berakhir</div>
                                                    ) : (
                                                        <Link href={`/auctions/${auction.id}`} className="flex items-center gap-2 group">
                                                            <Button variant="ghost" size="icon" className="group rounded-full bg-error hover:bg-error/80 w-14 h-14 text-error-content transition-all duration-300 shadow-lg shadow-error/50 hover:scale-110">
                                                                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                                                            </Button>
                                                            <span className="text-sm font-medium text-base-content/60 group-hover:text-base-content">Pasang Bid</span>
                                                        </Link>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="rounded-full text-base-content/60 ml-4 hover:text-warning">
                                                        <Star className="h-6 w-6" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                            {/* Carousel Controls */}
                            <div className="absolute bottom-4 right-4 flex items-center gap-4">
                                <CarouselPrevious className="static translate-y-0 bg-transparent border-base-content/30 text-base-content/60 hover:bg-base-300 hover:text-base-content" />
                                <CarouselNext className="static translate-y-0 bg-secondary border-secondary text-secondary-content h-16 w-16 md:h-20 md:w-20" />
                            </div>
                        </Carousel>
                    )}
                </main>
            </div>

            {/* Footer Bar */}
            {
                auctions.length > 0 && (
                    <div className="w-full bg-neutral text-neutral-content mt-auto">
                        <div className="max-w-screen-2xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                            <div className="col-span-1 border-r border-neutral-content/20 pr-6 flex items-center gap-4">
                                <div>
                                    <p className="text-sm text-neutral-content/60 uppercase">Lelang Aktif</p>
                                    <p className="text-2xl font-bold">{current + 1} / {count}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-neutral-content/60" />
                            </div>
                            <div className="col-span-1 md:col-span-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {otherAuctions.map(item => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <Image
                                                src={item.product.image || '/placeholder.png'}
                                                alt={item.product.name}
                                                width={64}
                                                height={64}
                                                className="rounded-full object-cover h-16 w-16"
                                            />
                                            <div>
                                                <p className="font-semibold">{item.bidCount} PENAWARAN</p>
                                                <p className="text-sm text-neutral-content/60">{item.product.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
