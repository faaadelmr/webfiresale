"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Palette, Check, Monitor, ShoppingCart, Gavel, Zap, Package, Eye, RefreshCw } from "lucide-react";

const THEME_DATA: { name: string; icon: string }[] = [
    { name: 'light', icon: '☀️' },
    { name: 'dark', icon: '🌙' },
    { name: 'cupcake', icon: '🧁' },
    { name: 'bumblebee', icon: '🐝' },
    { name: 'emerald', icon: '💎' },
    { name: 'corporate', icon: '🏢' },
    { name: 'synthwave', icon: '🌆' },
    { name: 'retro', icon: '📺' },
    { name: 'cyberpunk', icon: '🤖' },
    { name: 'valentine', icon: '💕' },
    { name: 'halloween', icon: '🎃' },
    { name: 'garden', icon: '🌷' },
    { name: 'forest', icon: '🌲' },
    { name: 'aqua', icon: '🌊' },
    { name: 'lofi', icon: '🎵' },
    { name: 'pastel', icon: '🎨' },
    { name: 'fantasy', icon: '🧚' },
    { name: 'wireframe', icon: '📐' },
    { name: 'black', icon: '⬛' },
    { name: 'luxury', icon: '👑' },
    { name: 'dracula', icon: '🧛' },
    { name: 'cmyk', icon: '🖨️' },
    { name: 'autumn', icon: '🍂' },
    { name: 'business', icon: '💼' },
    { name: 'acid', icon: '🧪' },
    { name: 'lemonade', icon: '🍋' },
    { name: 'night', icon: '🌃' },
    { name: 'coffee', icon: '☕' },
    { name: 'winter', icon: '❄️' },
    { name: 'dim', icon: '🔅' },
    { name: 'nord', icon: '🏔️' },
    { name: 'sunset', icon: '🌅' },
];

type PreviewPage = {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
};

export default function ThemeClient() {
    const [currentTheme, setCurrentTheme] = useState<string>('light');
    const [previewTheme, setPreviewTheme] = useState<string>('light');
    const [selectedPage, setSelectedPage] = useState<string>('/');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const { toast } = useToast();

    const previewPages: PreviewPage[] = [
        { id: 'home', label: 'Beranda', icon: <Monitor className="w-4 h-4" />, path: '/' },
        { id: 'auctions', label: 'Lelang', icon: <Gavel className="w-4 h-4" />, path: '/auctions' },
        { id: 'flashsales', label: 'Flash Sale', icon: <Zap className="w-4 h-4" />, path: '/flashsales' },
        { id: 'checkout', label: 'Checkout', icon: <ShoppingCart className="w-4 h-4" />, path: '/checkout' },
        { id: 'orders', label: 'Pesanan', icon: <Package className="w-4 h-4" />, path: '/orders' },
    ];

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const res = await fetch('/api/settings/theme');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentTheme(data.theme || 'light');
                    setPreviewTheme(data.theme || 'light');
                }
            } catch (error) {
                console.error('Failed to fetch theme:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTheme();
    }, []);

    const handleSaveTheme = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings/theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: previewTheme }),
            });

            if (res.ok) {
                setCurrentTheme(previewTheme);
                // Apply theme globally
                document.documentElement.setAttribute('data-theme', previewTheme);
                localStorage.setItem('theme', previewTheme);
                toast({
                    title: "✓ Tema Berhasil Disimpan",
                    description: `Tema "${previewTheme}" telah diterapkan secara global.`,
                });
            } else {
                throw new Error('Failed to save theme');
            }
        } catch (error) {
            toast({
                title: "Gagal Menyimpan Tema",
                description: "Terjadi kesalahan. Silakan coba lagi.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const refreshPreview = () => {
        setIframeKey(prev => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Palette className="w-7 h-7" />
                        Pengaturan Tema
                    </h1>
                    <p className="text-base-content/70 mt-1">
                        Pilih dan preview tema untuk seluruh aplikasi
                    </p>
                </div>
                <button
                    className={`btn btn-primary ${isSaving ? 'loading' : ''}`}
                    onClick={handleSaveTheme}
                    disabled={isSaving || previewTheme === currentTheme}
                >
                    {!isSaving && <Check className="w-4 h-4 mr-2" />}
                    Simpan Tema
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Theme Selector */}
                <div className="lg:col-span-1">
                    <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden sticky top-6">
                        <div className="p-4 border-b border-base-200">
                            <h2 className="font-semibold">Pilih Tema</h2>
                            <p className="text-sm text-base-content/60">
                                Aktif: <span className="badge badge-primary badge-sm">{currentTheme}</span>
                            </p>
                        </div>
                        <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
                            {THEME_DATA.map((themeItem) => (
                                <button
                                    key={themeItem.name}
                                    onClick={() => setPreviewTheme(themeItem.name)}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${previewTheme === themeItem.name
                                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                        : 'border-transparent hover:bg-base-200'
                                        }`}
                                >
                                    {/* Theme icon */}
                                    <span className="text-lg w-6 text-center">{themeItem.icon}</span>
                                    {/* Theme color swatch */}
                                    <div
                                        className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm overflow-hidden border border-base-300"
                                        data-theme={themeItem.name}
                                    >
                                        <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                                            <div style={{ backgroundColor: 'oklch(var(--p))' }}></div>
                                            <div style={{ backgroundColor: 'oklch(var(--s))' }}></div>
                                            <div style={{ backgroundColor: 'oklch(var(--a))' }}></div>
                                            <div style={{ backgroundColor: 'oklch(var(--b1))' }}></div>
                                        </div>
                                    </div>
                                    <span className="flex-1 text-left capitalize text-sm font-medium">{themeItem.name}</span>
                                    {previewTheme === themeItem.name && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-3">
                    <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-base-200 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                <h2 className="font-semibold">
                                    Preview: <span className="text-primary capitalize">{previewTheme}</span>
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {previewPages.map((page) => (
                                    <button
                                        key={page.id}
                                        onClick={() => setSelectedPage(page.path)}
                                        className={`btn btn-sm ${selectedPage === page.path ? 'btn-primary' : 'btn-ghost'}`}
                                    >
                                        {page.icon}
                                        <span className="hidden sm:inline ml-1">{page.label}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={refreshPreview}
                                    className="btn btn-sm btn-ghost"
                                    title="Refresh Preview"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Iframe Preview Container */}
                        <div className="relative bg-base-200" style={{ height: '70vh' }}>
                            <iframe
                                key={`${iframeKey}-${previewTheme}-${selectedPage}`}
                                src={`${selectedPage}?previewTheme=${previewTheme}`}
                                className="w-full h-full border-0"
                                title="Theme Preview"
                                sandbox="allow-same-origin allow-scripts allow-forms"
                            />

                            {/* Overlay to prevent interaction */}
                            <div
                                className="absolute inset-0 cursor-not-allowed"
                                style={{ background: 'transparent' }}
                                title="Preview only - interaction disabled"
                            ></div>
                        </div>

                        <div className="p-3 border-t border-base-200 bg-base-200/50 text-center text-sm text-base-content/60">
                            Preview halaman <span className="font-medium">{selectedPage}</span> dengan tema <span className="font-medium capitalize">{previewTheme}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
