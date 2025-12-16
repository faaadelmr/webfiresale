

"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { AddressForm } from "@/components/buyer-form";
import { getSavedAddresses, saveAddresses } from "@/lib/utils";
import type { AddressDetails, UserProfile } from "@/lib/types";
import { Home, Building, MapPin, Edit, Trash2, Plus, Star, User, Mail, Phone as PhoneIcon, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { getAllCities } from "@/lib/regions";


export default function ProfilePage() {
    const [profile, setProfile] = useState<{
        name: string;
        email: string;
        phone: string;
        avatar: string;
        dateOfBirth: string | null;
        gender: string;
    }>({ name: '', email: '', phone: '', avatar: '', dateOfBirth: null, gender: '' });
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<AddressDetails[]>([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<AddressDetails | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const { toast } = useToast();
    const { data: session, status } = useSession();

    const handleSaveProfile = async () => {
        try {
            const response = await fetch('/api/customer-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: profile.name,
                    phone: profile.phone,
                    dateOfBirth: profile.dateOfBirth,
                    gender: profile.gender,
                    avatar: profile.avatar,
                }),
            });

            if (response.ok) {
                toast({ title: "Profil Disimpan", description: "Informasi profil Anda telah diperbarui." });
                setIsEditingProfile(false);
            } else {
                const errorData = await response.json();
                toast({
                    title: "Gagal menyimpan profil",
                    description: errorData.message || "Terjadi kesalahan saat menyimpan profil",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            toast({
                title: "Error",
                description: "Gagal menyimpan data profil. Silakan coba lagi.",
                variant: "destructive"
            });
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAddress = async (address: AddressDetails) => {
        try {
            // Convert our AddressDetails model to match the API's format
            // Our AddressDetails has different field names than the API expects
            const addressData = {
                id: address.id,
                name: address.fullName, // API now uses 'name'
                phone: address.phone,
                street: address.street,
                postalCode: address.postalCode,
                label: address.label,
                notes: address.notes,
                isDefault: address.isPrimary || false,
                rtRwBlock: address.rtRwBlock || "",
                provinceId: address.provinceId,
                cityId: address.cityId,
                districtId: address.districtId,
                villageId: address.villageId,
                // Don't send province, city, district, village - API enriches these
            };

            let response;
            if (editingAddress) {
                // Update existing address
                response = await fetch('/api/customer-profile/addresses', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(addressData),
                });

                if (response.ok) {
                    toast({ title: "Alamat Diperbarui", description: "Alamat Anda telah berhasil diperbarui." });
                }
            } else {
                // Add new address
                console.log('Creating new address:', addressData);
                response = await fetch('/api/customer-profile/addresses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(addressData),
                });

                console.log('Response status:', response.status, response.statusText);

                if (response.ok) {
                    toast({ title: "Alamat Ditambahkan", description: "Alamat baru telah berhasil ditambahkan." });
                } else {
                    // Log error details
                    const errorText = await response.text();
                    console.error('Server error:', response.status, errorText);

                    try {
                        const errorData = JSON.parse(errorText);
                        toast({
                            title: "Gagal Menambahkan Alamat",
                            description: errorData.message || errorData.error || "Terjadi kesalahan",
                            variant: "destructive"
                        });
                    } catch {
                        toast({
                            title: "Gagal Menambahkan Alamat",
                            description: errorText || "Terjadi kesalahan server",
                            variant: "destructive"
                        });
                    }
                    return; // Stop execution if failed
                }
            }

            if (response.ok) {
                // Refresh the addresses list
                const updatedResponse = await fetch('/api/customer-profile/addresses');
                if (updatedResponse.ok) {
                    const updatedAddresses = await updatedResponse.json();

                    // Get all cities to map cityId to city name
                    const allCities = getAllCities();

                    // Convert the API response back to our AddressDetails model
                    const convertedAddresses = updatedAddresses.map((apiAddr: any) => {
                        // Find the city name based on cityId
                        const cityObj = allCities.find((city: any) => city.id === apiAddr.cityId);
                        const cityName = cityObj ? cityObj.name : apiAddr.cityId; // Fallback to ID if name not found

                        return {
                            id: apiAddr.id,
                            fullName: apiAddr.name || '', // Use the name field directly from the database
                            phone: apiAddr.phone,
                            street: apiAddr.street,
                            postalCode: apiAddr.postalCode,
                            label: apiAddr.label,
                            notes: apiAddr.notes,
                            provinceId: apiAddr.provinceId || "",
                            cityId: apiAddr.cityId || "",
                            districtId: apiAddr.districtId || "",
                            villageId: apiAddr.villageId || "",
                            province: apiAddr.province || apiAddr.state, // Use province, fallback to state
                            city: cityName,
                            district: apiAddr.district || "",
                            village: apiAddr.village || "",
                            rtRwBlock: apiAddr.rtRwBlock || "",
                            isPrimary: apiAddr.isDefault
                        };
                    });
                    setAddresses(convertedAddresses);
                }
                setShowAddressForm(false);
                setEditingAddress(null);
            } else {
                const errorData = await response.json();
                toast({
                    title: "Gagal menyimpan alamat",
                    description: errorData.message || "Terjadi kesalahan saat menyimpan alamat",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error saving address:', error);
            toast({
                title: "Error",
                description: "Gagal menyimpan alamat. Silakan coba lagi.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            console.log('Attempting to delete address:', id);
            const response = await fetch(`/api/customer-profile/addresses?id=${id}`, {
                method: 'DELETE',
            });

            console.log('Delete response status:', response.status);
            console.log('Delete response ok:', response.ok);

            if (response.ok) {
                console.log('Delete successful, refreshing addresses...');
                // Refresh the addresses list
                const updatedResponse = await fetch('/api/customer-profile/addresses');
                if (updatedResponse.ok) {
                    const updatedAddresses = await updatedResponse.json();
                    console.log('Updated addresses:', updatedAddresses);

                    // Get all cities to map cityId to city name
                    const allCities = getAllCities();

                    // Convert the API response back to our AddressDetails model
                    const convertedAddresses = updatedAddresses.map((apiAddr: any) => {
                        // Find the city name based on cityId
                        const cityObj = allCities.find((city: any) => city.id === apiAddr.cityId);
                        const cityName = cityObj ? cityObj.name : apiAddr.cityId; // Fallback to ID if name not found

                        return {
                            id: apiAddr.id,
                            fullName: apiAddr.name || '', // Use the name field directly from the database
                            phone: apiAddr.phone,
                            street: apiAddr.street,
                            postalCode: apiAddr.postalCode,
                            label: apiAddr.label,
                            notes: apiAddr.notes,
                            provinceId: apiAddr.provinceId || "",
                            cityId: apiAddr.cityId || "",
                            districtId: apiAddr.districtId || "",
                            villageId: apiAddr.villageId || "",
                            province: apiAddr.province || apiAddr.state, // Use province, fallback to state
                            city: cityName,
                            district: apiAddr.district || "",
                            village: apiAddr.village || "",
                            rtRwBlock: apiAddr.rtRwBlock || "",
                            isPrimary: apiAddr.isDefault
                        };
                    });
                    setAddresses(convertedAddresses);
                }
                toast({
                    title: "Alamat Dihapus",
                    description: "Alamat berhasil dihapus dari daftar.",
                });
            } else {
                console.log('Delete failed with status:', response.status);
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.log('Error data:', errorData);
                toast({
                    title: "Tidak Dapat Menghapus Alamat",
                    description: errorData.detail || errorData.message || "Alamat yang sudah digunakan di pesanan tidak dapat dihapus.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            toast({
                title: "Error",
                description: "Gagal menghapus alamat. Silakan coba lagi.",
                variant: "destructive"
            });
        }
    };

    const handleSetPrimary = async (id: string) => {
        try {
            // Get all addresses and update the selected one to be primary
            const updates = addresses.map(addr => ({
                ...addr,
                isPrimary: addr.id === id
            }));

            // Find the address to update
            const addressToSetPrimary = addresses.find(addr => addr.id === id);

            if (addressToSetPrimary) {
                // Convert to API format
                const addressData = {
                    id: addressToSetPrimary.id,
                    name: addressToSetPrimary.fullName,
                    phone: addressToSetPrimary.phone,
                    street: addressToSetPrimary.street,
                    postalCode: addressToSetPrimary.postalCode,
                    label: addressToSetPrimary.label,
                    notes: addressToSetPrimary.notes,
                    isDefault: true,
                    rtRwBlock: addressToSetPrimary.rtRwBlock || "",
                    provinceId: addressToSetPrimary.provinceId,
                    cityId: addressToSetPrimary.cityId,
                    districtId: addressToSetPrimary.districtId,
                    villageId: addressToSetPrimary.villageId,
                    // Don't send province, city, district, village - API enriches these
                };

                const response = await fetch('/api/customer-profile/addresses', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(addressData),
                });

                if (response.ok) {
                    // Refresh the addresses list
                    const updatedResponse = await fetch('/api/customer-profile/addresses');
                    if (updatedResponse.ok) {
                        const updatedAddresses = await updatedResponse.json();

                        // Get all cities to map cityId to city name
                        const allCities = getAllCities();

                        // Convert the API response back to our AddressDetails model
                        const convertedAddresses = updatedAddresses.map((apiAddr: any) => {
                            // Find the city name based on cityId
                            const cityObj = allCities.find((city: any) => city.id === apiAddr.cityId);
                            const cityName = cityObj ? cityObj.name : apiAddr.cityId; // Fallback to ID if name not found

                            return {
                                id: apiAddr.id,
                                fullName: apiAddr.name || '', // Use the name field directly from the database
                                phone: apiAddr.phone,
                                street: apiAddr.street,
                                postalCode: apiAddr.postalCode,
                                label: apiAddr.label,
                                notes: apiAddr.notes,
                                provinceId: apiAddr.provinceId || "",
                                cityId: apiAddr.cityId || "",
                                districtId: apiAddr.districtId || "",
                                villageId: apiAddr.villageId || "",
                                province: apiAddr.province || apiAddr.state, // Use province, fallback to state
                                city: cityName,
                                district: apiAddr.district || "",
                                village: apiAddr.village || "",
                                rtRwBlock: apiAddr.rtRwBlock || "",
                                isPrimary: apiAddr.isDefault
                            };
                        });
                        setAddresses(convertedAddresses);
                    }
                    toast({ title: "Alamat Utama Diatur", description: "Alamat ini telah dijadikan alamat utama." });
                } else {
                    const errorData = await response.json();
                    toast({
                        title: "Gagal mengatur alamat utama",
                        description: errorData.message || "Terjadi kesalahan saat mengatur alamat utama",
                        variant: "destructive"
                    });
                }
            }
        } catch (error) {
            console.error('Error setting primary address:', error);
            toast({
                title: "Error",
                description: "Gagal mengatur alamat utama. Silakan coba lagi.",
                variant: "destructive"
            });
        }
    };

    // Load addresses from the backend when component mounts
    useEffect(() => {
        const fetchProfile = async () => {
            if (status === "authenticated") {
                try {
                    const response = await fetch('/api/customer-profile');
                    if (response.ok) {
                        const data = await response.json();
                        setProfile({
                            name: data.name,
                            email: data.email,
                            phone: data.profile.phone || '',
                            avatar: data.profile.avatar || session?.user?.avatar || '',
                            dateOfBirth: data.profile.dateOfBirth || null,
                            gender: data.profile.gender || ''
                        });
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    toast({
                        title: "Error",
                        description: "Gagal memuat data profil. Silakan coba lagi.",
                        variant: "destructive"
                    });
                } finally {
                    setLoading(false);
                }
            }
        };

        const fetchAddresses = async () => {
            try {
                const response = await fetch('/api/customer-profile/addresses');
                if (response.ok) {
                    const apiAddresses = await response.json();

                    // Get all cities to map cityId to city name
                    const allCities = getAllCities();

                    // Convert the API response to our AddressDetails model
                    const convertedAddresses = apiAddresses.map((apiAddr: any) => {
                        // Find the city name based on cityId
                        const cityObj = allCities.find((city: any) => city.id === apiAddr.cityId);
                        const cityName = cityObj ? cityObj.name : apiAddr.cityId; // Fallback to ID if name not found

                        return {
                            id: apiAddr.id,
                            fullName: apiAddr.name || '', // Use the name field directly from the database
                            phone: apiAddr.phone,
                            street: apiAddr.street,
                            postalCode: apiAddr.postalCode,
                            label: apiAddr.label,
                            notes: apiAddr.notes,
                            provinceId: apiAddr.provinceId || "",
                            cityId: apiAddr.cityId || "",
                            districtId: apiAddr.districtId || "",
                            villageId: apiAddr.villageId || "",
                            province: apiAddr.province || apiAddr.state, // Use province, fallback to state
                            city: cityName,
                            district: apiAddr.district || "",
                            village: apiAddr.village || "",
                            rtRwBlock: apiAddr.rtRwBlock || "",
                            isPrimary: apiAddr.isDefault
                        };
                    });
                    setAddresses(convertedAddresses);
                }
            } catch (error) {
                console.error('Error fetching addresses:', error);
                toast({
                    title: "Error",
                    description: "Gagal memuat data alamat. Silakan coba lagi.",
                    variant: "destructive"
                });
            }
        };

        fetchProfile();
        fetchAddresses();
    }, [status, toast]);

    const addressLabelIcon = {
        'Rumah': <Home className="w-4 h-4" />,
        'Kantor': <Building className="w-4 h-4" />,
        'Apartemen': <Building className="w-4 h-4" />
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-base-200">
            <Header />
            <main className="container mx-auto flex-1 px-4 py-8">
                <motion.div
                    className="max-w-4xl mx-auto space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">Profil Saya</h1>
                        <p className="text-base-content/70">Kelola informasi profil dan alamat Anda.</p>
                    </div>

                    {/* Personal Data Section */}
                    <motion.div
                        className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Data Diri</h2>
                            {isEditingProfile ? (
                                <button className="btn btn-sm btn-primary" onClick={handleSaveProfile}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Simpan Profil
                                </button>
                            ) : (
                                <button className="btn btn-sm btn-outline" onClick={() => setIsEditingProfile(true)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit Profil
                                </button>
                            )}
                        </div>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <span className="loading loading-spinner loading-md"></span>
                                <span className="ml-2">Memuat profil...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <div className="avatar">
                                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                        <img src={profile.avatar || "https://picsum.photos/seed/profile-avatar/200/200"} alt="Avatar" />
                                    </div>
                                </div>
                                {isEditingProfile ? (
                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <label className="label">
                                                <span className="label-text">Nama Lengkap</span>
                                            </label>
                                            <input type="text" name="name" value={profile.name} onChange={handleProfileChange} placeholder="Nama Lengkap" className="input input-bordered w-full" />
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text">Email</span>
                                            </label>
                                            <input type="email" name="email" value={profile.email} onChange={handleProfileChange} placeholder="Email" className="input input-bordered w-full" disabled />
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text">Nomor Telepon</span>
                                            </label>
                                            <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} placeholder="Nomor Telepon" className="input input-bordered w-full" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">
                                                    <span className="label-text">Tanggal Lahir</span>
                                                </label>
                                                <input type="date" name="dateOfBirth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''} onChange={handleProfileChange} className="input input-bordered w-full" />
                                            </div>
                                            <div>
                                                <label className="label">
                                                    <span className="label-text">Jenis Kelamin</span>
                                                </label>
                                                <select name="gender" value={profile.gender} onChange={handleProfileChange} className="input input-bordered w-full">
                                                    <option value="">Pilih Jenis Kelamin</option>
                                                    <option value="male">Laki-laki</option>
                                                    <option value="female">Perempuan</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text">URL Gambar Avatar</span>
                                            </label>
                                            <input type="text" name="avatar" value={profile.avatar} onChange={handleProfileChange} placeholder="URL Gambar Avatar" className="input input-bordered w-full" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-base-content/70" />
                                            <span className="font-medium">{profile.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-base-content/70" />
                                            <span className="text-base-content/80">{profile.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PhoneIcon className="w-4 h-4 text-base-content/70" />
                                            <span className="text-base-content/80">{profile.phone}</span>
                                        </div>
                                        {profile.dateOfBirth && (
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-base-content/80">{new Date(profile.dateOfBirth).toLocaleDateString('id-ID')}</span>
                                            </div>
                                        )}
                                        {profile.gender && (
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="text-base-content/80">{profile.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>


                    {/* Address Management Section */}
                    <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Daftar Alamat</h2>
                            {!showAddressForm && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setEditingAddress(null);
                                        setShowAddressForm(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Tambah Alamat
                                </button>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {showAddressForm ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="text-lg font-medium mb-4">
                                        {editingAddress ? 'Edit Alamat' : 'Tambah Alamat Baru'}
                                    </h3>
                                    <AddressForm
                                        onSave={handleSaveAddress}
                                        initialData={editingAddress || undefined}
                                        onCancel={() => {
                                            setShowAddressForm(false);
                                            setEditingAddress(null);
                                        }}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="address-list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {addresses.length > 0 ? (
                                        <div className="space-y-4">
                                            {addresses.map(addr => (
                                                <motion.div
                                                    key={addr.id}
                                                    className="border rounded-lg p-4 flex justify-between items-start"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="flex gap-4">
                                                        <div className="text-primary mt-1">
                                                            {addressLabelIcon[addr.label]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{addr.fullName}
                                                                {addr.isPrimary && <span className="badge badge-primary badge-sm ml-2">Utama</span>}
                                                            </p>
                                                            <p className="text-sm text-base-content/70">{addr.phone}</p>
                                                            <p className="text-sm text-base-content/70">{`${addr.street}, ${addr.village}, ${addr.district}`}</p>
                                                            <p className="text-sm text-base-content/70">{`${addr.city}, ${addr.province}, ${addr.postalCode}`}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!addr.isPrimary && (
                                                            <button
                                                                className="btn btn-xs btn-ghost"
                                                                onClick={() => handleSetPrimary(addr.id)}
                                                                title="Jadikan Alamat Utama"
                                                            >
                                                                <Star className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button className="btn btn-xs btn-ghost" onClick={() => {
                                                            setEditingAddress(addr);
                                                            setShowAddressForm(true);
                                                        }}>
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button className="btn btn-xs btn-ghost text-error" onClick={() => handleDeleteAddress(addr.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                            <MapPin className="mx-auto h-12 w-12 text-base-content/30" />
                                            <h3 className="mt-4 text-lg font-semibold">Belum Ada Alamat</h3>
                                            <p className="mt-1 text-sm text-base-content/60">Anda belum menambahkan alamat pengiriman.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
