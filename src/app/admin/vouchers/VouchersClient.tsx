'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Voucher } from '@/lib/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Ticket,
    Calendar,
    Percent,
    DollarSign,
    Truck,
    CheckCircle2,
    AlertCircle,
    XCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function VouchersClient() {
    const router = useRouter();
    const { toast } = useToast();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVoucher, setCurrentVoucher] = useState<Partial<Voucher>>({});
    const [submitting, setSubmitting] = useState(false);

    // Form initial state
    const initialFormState: Partial<Voucher> = {
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minPurchase: '', // Changed to empty string
        maxDiscount: 0,
        usageLimit: '', // Changed to empty string
        usagePerUser: '', // Changed to empty string
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        isActive: true,
        flashSaleOnly: false,
        auctionOnly: false,
        regularOnly: false,
    };

    useEffect(() => {
        fetchVouchers();
    }, [searchTerm, filterType]);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            let url = '/api/admin/vouchers';
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (filterType) params.append('type', filterType);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch vouchers');
            const data = await res.json();
            setVouchers(data);
        } catch (err) {
            console.error(err);
            toast({
                title: <div className="flex items-center gap-2"><XCircle className="w-4 h-4" /> Gagal</div>,
                description: "Gagal memuat data voucher",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Client-side validation
        if (currentVoucher.startDate && currentVoucher.endDate) {
            if (new Date(currentVoucher.startDate as any) > new Date(currentVoucher.endDate as any)) {
                toast({
                    title: <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Validasi Gagal</div>,
                    description: "Tanggal mulai tidak boleh lebih dari tanggal berakhir",
                    variant: "destructive",
                });
                setSubmitting(false);
                return;
            }
        }

        if (currentVoucher.discountType === 'PERCENTAGE') {
            const val = Number(currentVoucher.discountValue);
            if (!val || val <= 0 || val > 100) {
                toast({
                    title: <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Validasi Gagal</div>,
                    description: "Persentase diskon harus antara 1 dan 100",
                    variant: "destructive",
                });
                setSubmitting(false);
                return;
            }
        }

        if (currentVoucher.discountType === 'FIXED_AMOUNT') {
            const val = Number(currentVoucher.discountValue);
            if (!val || val <= 0) {
                toast({
                    title: <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Validasi Gagal</div>,
                    description: "Nominal diskon harus lebih dari 0",
                    variant: "destructive",
                });
                setSubmitting(false);
                return;
            }
        }

        try {
            const url = isEditing
                ? `/api/admin/vouchers/${currentVoucher.id}`
                : '/api/admin/vouchers';

            const method = isEditing ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentVoucher),
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.error || 'Failed to save voucher');
            }

            toast({
                title: <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {isEditing ? "Berhasil Diperbarui" : "Berhasil Dibuat"}</div>,
                description: `Voucher ${currentVoucher.code} berhasil disimpan`,
            });

            setShowForm(false);
            setIsEditing(false);
            setCurrentVoucher({});
            fetchVouchers();
        } catch (err: any) {
            toast({
                title: <div className="flex items-center gap-2"><XCircle className="w-4 h-4" /> Gagal</div>,
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (voucher: Voucher) => {
        setIsEditing(true);
        setCurrentVoucher({
            ...voucher,
            startDate: new Date(voucher.startDate).toISOString().split('T')[0],
            endDate: new Date(voucher.endDate).toISOString().split('T')[0],
            // Ensure usageLimit and usagePerUser are numbers or empty string for input
            usageLimit: voucher.usageLimit === 0 ? '' : voucher.usageLimit,
            usagePerUser: voucher.usagePerUser === 0 ? '' : voucher.usagePerUser,
            minPurchase: voucher.minPurchase === 0 ? '' : voucher.minPurchase,
        });
        setShowForm(true);
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const res = await fetch(`/api/admin/vouchers/${itemToDelete}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to delete voucher');

            toast({
                title: <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Berhasil</div>,
                description: data.message,
            });

            fetchVouchers();
        } catch (err: any) {
            console.error(err);
            toast({
                title: <div className="flex items-center gap-2"><XCircle className="w-4 h-4" /> Gagal</div>,
                description: err.message || 'Gagal menghapus voucher',
                variant: "destructive",
            });
        } finally {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleAddNew = () => {
        setIsEditing(false);
        setCurrentVoucher(initialFormState);
        setShowForm(true);
    };

    const getDiscountIcon = (type: string) => {
        switch (type) {
            case 'PERCENTAGE': return <Percent className="w-4 h-4" />;
            case 'FIXED_AMOUNT': return <DollarSign className="w-4 h-4" />;
            case 'FREE_SHIPPING': return <Truck className="w-4 h-4" />;
            default: return <Ticket className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manajemen Voucher</h1>
                    <p className="text-gray-500 mt-1">Kelola kode diskon dan promosi toko Anda</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition shadow-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Voucher
                </button>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari voucher berdasarkan kode..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition appearance-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ backgroundImage: 'none' }} // Remove default arrow if needed, or keep it
                    >
                        <option value="">Semua Tipe Diskon</option>
                        <option value="PERCENTAGE">Persentase (%)</option>
                        <option value="FIXED_AMOUNT">Nominal Tetap (Rp)</option>
                        <option value="FREE_SHIPPING">Gratis Ongkir</option>
                    </select>
                </div>
            </div>

            {/* Voucher List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Kode & Tipe</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Nilai Diskon</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Periode Aktif</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Penggunaan</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : vouchers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Ticket className="w-12 h-12 mb-3 bg-gray-50 p-2 rounded-full" />
                                            <p className="font-medium text-gray-900">Belum ada voucher</p>
                                            <p className="text-sm">Buat voucher pertama Anda untuk memulai promosi</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                vouchers.map((voucher) => (
                                    <tr key={voucher.id} className="hover:bg-gray-50/50 transition">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-gray-900 flex items-center gap-2">
                                                    {voucher.code}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    {getDiscountIcon(voucher.discountType)}
                                                    {voucher.discountType === 'PERCENTAGE' && 'Persentase'}
                                                    {voucher.discountType === 'FIXED_AMOUNT' && 'Nominal Tetap'}
                                                    {voucher.discountType === 'FREE_SHIPPING' && 'Gratis Ongkir'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm">
                                                {voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}%` :
                                                    voucher.discountType === 'FREE_SHIPPING' ? (voucher.maxDiscount ? `Gratis (Max ${formatPrice(Number(voucher.maxDiscount))})` : 'Gratis Penuh') :
                                                        formatPrice(Number(voucher.discountValue || 0))}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                <span>{format(new Date(voucher.startDate), 'd MMM yyyy', { locale: idLocale })}</span>
                                                <span className="text-gray-300">→</span>
                                                <span>{format(new Date(voucher.endDate), 'd MMM yyyy', { locale: idLocale })}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 w-24">
                                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{
                                                        width: `${Math.min(100, ((voucher.usageCount || 0) / (voucher.usageLimit || 1)) * 100)}%`
                                                    }}></div>
                                                </div>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {voucher.usageCount || 0} / {voucher.usageLimit ? voucher.usageLimit : '∞'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${voucher.statusText === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    voucher.statusText === 'Inactive' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                {voucher.statusText === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(voucher)}
                                                    className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(voucher.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modern Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowDeleteModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 opacity-100 ring-1 ring-black/5">
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
                                <Trash2 className="w-8 h-8 text-red-600" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Hapus Voucher?</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                Tindakan ini tidak dapat dibatalkan. Voucher yang sudah digunakan akan dinonaktifkan untuk menjaga riwayat transaksi.
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {isEditing ? 'Edit Voucher' : 'Buat Voucher Baru'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Code & Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode Voucher</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black uppercase font-mono tracking-wide"
                                        value={currentVoucher.code}
                                        onChange={(e) => setCurrentVoucher({ ...currentVoucher, code: e.target.value.toUpperCase() })}
                                        placeholder="CONTOH: FREEONGKIR"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Kode unik untuk validasi.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Diskon</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                        value={currentVoucher.discountType}
                                        onChange={(e) => setCurrentVoucher({ ...currentVoucher, discountType: e.target.value as any })}
                                    >
                                        <option value="PERCENTAGE">Persentase (%)</option>
                                        <option value="FIXED_AMOUNT">Nominal Tetap (Rp)</option>
                                        <option value="FREE_SHIPPING">Gratis Ongkir</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                    rows={2}
                                    value={currentVoucher.description || ''}
                                    onChange={(e) => setCurrentVoucher({ ...currentVoucher, description: e.target.value })}
                                    placeholder="Jelaskan detail voucher ini (opsional)..."
                                />
                            </div>

                            {/* Value Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                {currentVoucher.discountType === 'PERCENTAGE' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Persentase (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                                    value={currentVoucher.discountValue || ''} // Changed to empty string
                                                    onChange={(e) => setCurrentVoucher({ ...currentVoucher, discountValue: Number(e.target.value) })}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Maksimal Diskon (Rp)</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                                value={currentVoucher.maxDiscount || ''} // Changed to empty string
                                                onChange={(e) => setCurrentVoucher({ ...currentVoucher, maxDiscount: Number(e.target.value) })}
                                                placeholder="Kosongkan jika tak terbatas"
                                            />
                                        </div>
                                    </>
                                )}
                                {currentVoucher.discountType === 'FIXED_AMOUNT' && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal Diskon (Rp)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                            value={currentVoucher.discountValue || 0}
                                            onChange={(e) => setCurrentVoucher({ ...currentVoucher, discountValue: Number(e.target.value) })}
                                        />
                                    </div>
                                )}
                                {currentVoucher.discountType === 'FREE_SHIPPING' && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Maksimal Potongan Ongkir (Rp)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                                value={currentVoucher.maxDiscount || 0}
                                                onChange={(e) => setCurrentVoucher({ ...currentVoucher, maxDiscount: Number(e.target.value) })}
                                                placeholder="0 atau kosong untuk Gratis Ongkir Penuh"
                                            />
                                            <Truck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Isi nilai maksimal subsidi ongkir. Biarkan 0 untuk gratis ongkir tak terbatas.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Constraints Start */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimal Pembelian (Rp)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                        value={currentVoucher.minPurchase || 0}
                                        onChange={(e) => setCurrentVoucher({ ...currentVoucher, minPurchase: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Batas Kuota Total</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                        value={currentVoucher.usageLimit || ''}
                                        onChange={(e) => setCurrentVoucher({ ...currentVoucher, usageLimit: Number(e.target.value) })}
                                        placeholder="0 untuk tak terbatas"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Batas Penggunaan Per User</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                        value={currentVoucher.usagePerUser || ''}
                                        onChange={(e) => setCurrentVoucher({ ...currentVoucher, usagePerUser: Number(e.target.value) })}
                                        placeholder="0 untuk tak terbatas (Default: 1 jika kosong)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Kosongkan atau isi 0 untuk tidak terbatas.</p>
                                </div>
                            </div>
                            {/* Constraints End */}

                            {/* Date Range Start */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                        value={currentVoucher.startDate ? String(currentVoucher.startDate).split('T')[0] : ''}
                                        onChange={(e) => setCurrentVoucher({ ...currentVoucher, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Berakhir</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                        value={currentVoucher.endDate ? String(currentVoucher.endDate).split('T')[0] : ''}
                                        onChange={(e) => setCurrentVoucher({ ...currentVoucher, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            {/* Date Range End */}

                            {/* Product Select */}
                            <div className="pt-4 border-t border-gray-100">
                                <span className="block text-sm font-medium text-gray-700 mb-3">Berlaku Untuk Produk:</span>
                                <div className="flex flex-wrap gap-4">
                                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none
                                            ${currentVoucher.flashSaleOnly ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={currentVoucher.flashSaleOnly || false}
                                            onChange={(e) => setCurrentVoucher({ ...currentVoucher, flashSaleOnly: e.target.checked })}
                                        />
                                        Flash Sale
                                    </label>
                                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none
                                            ${currentVoucher.auctionOnly ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={currentVoucher.auctionOnly || false}
                                            onChange={(e) => setCurrentVoucher({ ...currentVoucher, auctionOnly: e.target.checked })}
                                        />
                                        Lelang
                                    </label>
                                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none
                                            ${currentVoucher.regularOnly ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={currentVoucher.regularOnly || false}
                                            onChange={(e) => setCurrentVoucher({ ...currentVoucher, regularOnly: e.target.checked })}
                                        />
                                        Regular
                                    </label>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    *Jika tidak ada yang dipilih, voucher akan berlaku otomatis untuk semua jenis produk.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2 shadow-sm"
                                >
                                    {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {submitting ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Buat Voucher')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
