"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GeneralSettings, AccountSettings, BusinessAddress, PrintSize } from "@/lib/types";
import { Banknote, Image as ImageIcon, Upload, ToggleRight, MapPin, LayoutTemplate } from "lucide-react";
import Image from "next/image";
import { mockRegions, getDistrictsByCity, getVillagesByDistrict, getAllCities } from "@/lib/regions";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function SettingsClient() {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    bannerEnabled: false,
    bannerImage: "",
    paymentTimeLimit: 5,
    businessAddress: undefined,
    businessEmail: "",
    businessLogoUrl: "",
    printSize: 'a4',
  });
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [businessAddress, setBusinessAddress] = useState<BusinessAddress | undefined>(undefined);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Handle province change
  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    setSelectedCityId('');
    setSelectedDistrictId('');
    setBusinessAddress(prev => ({
      ...prev!,
      provinceId,
      cityId: '',
      districtId: '',
      villageId: '',
      province: mockRegions.provinces.find(p => p.id === provinceId)?.name || '',
      city: '',
      district: '',
      village: '',
    }));
    setCities(mockRegions.cities.filter(city => city.provinceId === provinceId));
    setDistricts([]);
    setVillages([]);
  };

  // Handle city change
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedDistrictId('');
    setBusinessAddress(prev => ({
      ...prev!,
      cityId,
      districtId: '',
      villageId: '',
      city: mockRegions.cities.find(c => c.id === cityId)?.name || '',
      district: '',
      village: '',
    }));
    setDistricts(getDistrictsByCity(cityId));
    setVillages([]);
  };

  // Handle district change
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setBusinessAddress(prev => ({
      ...prev!,
      districtId,
      villageId: '',
      district: getDistrictsByCity(selectedCityId).find(d => d.id === districtId)?.name || '',
      village: '',
    }));
    setVillages(getVillagesByDistrict(districtId));
  };

  // Handle village change
  const handleVillageChange = (villageId: string) => {
    setBusinessAddress(prev => ({
      ...prev!,
      villageId,
      village: getVillagesByDistrict(selectedDistrictId).find(v => v.id === villageId)?.name || '',
    }));
  };

  useEffect(() => {
    // Load general settings from API
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();

          // Set general settings
          const { businessAddress, printSize, bannerImage, ...otherSettings } = data;
          setGeneralSettings({
            ...otherSettings,
            printSize: (printSize as PrintSize) || 'a4',
            bannerImage: bannerImage || ''
          });

          // Set account settings
          setAccountSettings({
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
            accountName: data.accountName || "",
          });

          // Set business address if exists
          if (businessAddress) {
            setBusinessAddress(businessAddress);

            // Initialize region selections
            if (businessAddress.provinceId) {
              setSelectedProvinceId(businessAddress.provinceId);
              setCities(mockRegions.cities.filter(city => city.provinceId === businessAddress.provinceId));
            }
            if (businessAddress.cityId) {
              setSelectedCityId(businessAddress.cityId);
              setDistricts(getDistrictsByCity(businessAddress.cityId));
            }
            if (businessAddress.districtId) {
              setSelectedDistrictId(businessAddress.districtId);
              setVillages(getVillagesByDistrict(businessAddress.districtId));
            }
          }

          // Set image preview if banner exists
          if (bannerImage) {
            setImagePreview(bannerImage);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Gagal Memuat Pengaturan",
          description: "Menggunakan pengaturan default",
          variant: "destructive"
        });
      }
    };

    loadSettings();
  }, [toast]);

  const handleSaveClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    setIsSaving(true);
    try {
      const settingsToSave = {
        bannerEnabled: generalSettings.bannerEnabled,
        bannerImage: generalSettings.bannerImage || null,
        paymentTimeLimit: generalSettings.paymentTimeLimit,
        businessAddress: businessAddress || null,
        businessEmail: generalSettings.businessEmail || null,
        businessLogoUrl: generalSettings.businessLogoUrl || null,
        printSize: generalSettings.printSize || 'a4',
        theme: generalSettings.theme || 'light',
        heroTagline: generalSettings.heroTagline || null,
        heroSubtitle: generalSettings.heroSubtitle || null,
        bankName: accountSettings.bankName,
        accountNumber: accountSettings.accountNumber,
        accountName: accountSettings.accountName,
      };

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: "✓ Pengaturan Berhasil Disimpan",
        description: "Pengaturan Anda telah berhasil diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Gagal Menyimpan Pengaturan",
        description: "Terjadi kesalahan saat menyimpan pengaturan. Silakan coba lagi.",
        variant: "destructive"
      });
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      try {
        const dataUri = await fileToDataUri(file);
        setGeneralSettings(prev => ({ ...prev!, bannerImage: dataUri }));
        setImagePreview(dataUri);
      } catch (error) {
        console.error("Error converting file to data URI", error);
        toast({
          variant: "destructive",
          title: "Gagal mengunggah gambar",
          description: "Terjadi kesalahan saat memproses gambar."
        })
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-base-content/70">
          Kelola pengaturan umum dan informasi pembayaran untuk toko Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Home Page Settings (Hero Section) */}
          <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5" />
                <span>Pengaturan Beranda</span>
              </h2>
              <p className="text-base-content/70 mt-1">
                Kustomisasi tampilan dan teks pada halaman utama.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Judul Utama (Tagline Hero)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={generalSettings.heroTagline || ''}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, heroTagline: e.target.value })}
                    placeholder="Contoh: Temukan Barang Impianmu Disini."
                    className="input input-bordered w-full"
                  />
                </div>
                <p className="text-xs text-base-content/60">
                  Teks ini akan muncul sebagai judul besar di halaman utama. Gunakan &lt;span&gt; untuk highlight warna.
                </p>
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Sub-Judul (Deskripsi)</span>
                </label>
                <textarea
                  value={generalSettings.heroSubtitle || ''}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, heroSubtitle: e.target.value })}
                  placeholder="Contoh: Platform eksklusif yang menggabungkan lelang barang mewah..."
                  className="textarea textarea-bordered w-full"
                />
              </div>
            </div>
          </div>

          {/* Promotion Banner Settings */}
          <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ToggleRight className="w-5 h-5" />
                <span>Pengaturan Banner Promosi</span>
              </h2>
              <p className="text-base-content/70 mt-1">
                Atur banner yang akan tampil di halaman utama untuk mengiklankan promo.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-base-200 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Aktifkan Banner Promosi
                  </p>
                  <p className="text-sm text-base-content/70">
                    Nyalakan untuk menampilkan banner di halaman depan.
                  </p>
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={generalSettings.bannerEnabled}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, bannerEnabled: e.target.checked })}
                    />
                  </label>
                </div>
              </div>
              {generalSettings.bannerEnabled && (
                <div className="space-y-4 pt-4 border-t border-base-200">
                  <div className="space-y-2">
                    <label className="label font-medium">
                      <span className="label-text">Gambar Banner</span>
                    </label>
                    <div className="space-y-4">
                      <div className="w-full aspect-video border rounded-md flex items-center justify-center bg-base-200 overflow-hidden">
                        {imagePreview ? (
                          <Image
                            src={imagePreview}
                            alt="Banner image preview"
                            width={1280}
                            height={720}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-base-content/50" />
                        )}
                      </div>
                      <input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                      <label htmlFor="image-upload" className="btn btn-outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Unggah Gambar Banner
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                <span>Pengaturan Pembayaran</span>
              </h2>
              <p className="text-base-content/70 mt-1">
                Informasi rekening ini akan ditampilkan kepada pelanggan saat checkout.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Batas Waktu Pembayaran (Menit)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={generalSettings.paymentTimeLimit}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, paymentTimeLimit: parseInt(e.target.value) || 0 })}
                  className="input input-bordered w-full"
                />
                <p className="text-xs text-base-content/60">
                  Pesanan akan otomatis dibatalkan jika belum dibayar dalam waktu ini. (Contoh: 1440 untuk 24 jam)
                </p>
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Nama Bank</span>
                </label>
                <div className="relative">
                  <Banknote className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/50 h-4 w-4" />
                  <input
                    type="text"
                    value={accountSettings.bankName}
                    onChange={(e) => setAccountSettings({ ...accountSettings, bankName: e.target.value })}
                    placeholder="Contoh: Bank Central Asia (BCA)"
                    className="input input-bordered w-full pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Nomor Rekening</span>
                </label>
                <input
                  type="text"
                  value={accountSettings.accountNumber}
                  onChange={(e) => setAccountSettings({ ...accountSettings, accountNumber: e.target.value })}
                  placeholder="Masukkan nomor rekening"
                  className="input input-bordered w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Atas Nama (Pemilik Rekening)</span>
                </label>
                <input
                  type="text"
                  value={accountSettings.accountName}
                  onChange={(e) => setAccountSettings({ ...accountSettings, accountName: e.target.value })}
                  placeholder="Masukkan nama pemilik rekening"
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>

          {/* Business Address Settings */}
          <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>Alamat Kantor Usaha</span>
              </h2>
              <p className="text-base-content/70 mt-1">
                Alamat ini akan ditampilkan pada invoice cetak.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Nama Lengkap / Nama Usaha</span>
                </label>
                <input
                  type="text"
                  value={businessAddress?.fullName || ''}
                  onChange={(e) => setBusinessAddress(prev => ({
                    ...prev!,
                    fullName: e.target.value
                  }))}
                  placeholder="Masukkan nama usaha"
                  className="input input-bordered w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">No. Telepon</span>
                </label>
                <input
                  type="text"
                  value={businessAddress?.phone || ''}
                  onChange={(e) => setBusinessAddress(prev => ({
                    ...prev!,
                    phone: e.target.value
                  }))}
                  placeholder="Masukkan nomor telepon"
                  className="input input-bordered w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Email Usaha</span>
                </label>
                <input
                  type="email"
                  value={generalSettings.businessEmail || ''}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev!,
                    businessEmail: e.target.value
                  }))}
                  placeholder="contoh@toko.com"
                  className="input input-bordered w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Logo Usaha (untuk Label)</span>
                </label>
                {generalSettings.businessLogoUrl && (
                  <div className="mb-2">
                    <Image
                      src={generalSettings.businessLogoUrl}
                      alt="Business Logo"
                      width={100}
                      height={100}
                      className="rounded-lg object-contain border"
                    />
                  </div>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const dataUri = await fileToDataUri(file);
                      setGeneralSettings(prev => ({
                        ...prev!,
                        businessLogoUrl: dataUri
                      }));
                    }
                  }}
                  accept="image/*"
                />
                <label htmlFor="logo-upload" className="btn btn-outline btn-sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Unggah Logo
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label font-medium">
                    <span className="label-text">Provinsi</span>
                  </label>
                  <select
                    value={selectedProvinceId}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    <option value="">Pilih Provinsi</option>
                    {mockRegions.provinces.map(province => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label font-medium">
                    <span className="label-text">Kota/Kabupaten</span>
                  </label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="select select-bordered w-full"
                    disabled={!selectedProvinceId}
                  >
                    <option value="">Pilih Kota/Kabupaten</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label font-medium">
                    <span className="label-text">Kecamatan</span>
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="select select-bordered w-full"
                    disabled={!selectedCityId}
                  >
                    <option value="">Pilih Kecamatan</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label font-medium">
                    <span className="label-text">Kelurahan/Desa</span>
                  </label>
                  <select
                    value={businessAddress?.villageId || ''}
                    onChange={(e) => handleVillageChange(e.target.value)}
                    className="select select-bordered w-full"
                    disabled={!selectedDistrictId}
                  >
                    <option value="">Pilih Kelurahan/Desa</option>
                    {villages.map(village => (
                      <option key={village.id} value={village.id}>
                        {village.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Alamat Jalan</span>
                </label>
                <input
                  type="text"
                  value={businessAddress?.street || ''}
                  onChange={(e) => setBusinessAddress(prev => ({
                    ...prev!,
                    street: e.target.value
                  }))}
                  placeholder="Masukkan alamat jalan"
                  className="input input-bordered w-full"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label font-medium">
                    <span className="label-text">RT/RW/Blok</span>
                  </label>
                  <input
                    type="text"
                    value={businessAddress?.rtRwBlock || ''}
                    onChange={(e) => setBusinessAddress(prev => ({
                      ...prev!,
                      rtRwBlock: e.target.value
                    }))}
                    placeholder="Contoh: RT 001/RW 002"
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label font-medium">
                    <span className="label-text">Kode Pos</span>
                  </label>
                  <input
                    type="text"
                    value={businessAddress?.postalCode || ''}
                    onChange={(e) => setBusinessAddress(prev => ({
                      ...prev!,
                      postalCode: e.target.value
                    }))}
                    placeholder="Kode pos"
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Catatan Tambahan</span>
                </label>
                <textarea
                  value={businessAddress?.notes || ''}
                  onChange={(e) => setBusinessAddress(prev => ({
                    ...prev!,
                    notes: e.target.value
                  }))}
                  placeholder="Catatan tambahan tentang alamat"
                  className="textarea textarea-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>


        <div className="space-y-6">
          {/* General Order Settings */}
          <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="text-xl font-semibold">Pengaturan Pesanan</h2>
              <p className="text-base-content/70 mt-1">
                Atur parameter umum untuk proses pesanan.
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Batas Waktu Pembayaran (menit)</span>
                </label>
                <input
                  type="number"
                  value={generalSettings.paymentTimeLimit}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, paymentTimeLimit: parseInt(e.target.value, 10) || 0 })
                  }
                  placeholder="Contoh: 60"
                  className="input input-bordered w-full"
                />
                <p className="text-sm text-base-content/70 mt-1">
                  Pesanan akan otomatis dibatalkan jika tidak dibayar dalam waktu ini.
                </p>
              </div>
            </div>
          </div>

          {/* Print Settings */}
          <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="text-xl font-semibold">Pengaturan Cetakan</h2>
              <p className="text-base-content/70 mt-1">
                Atur ukuran kertas untuk cetak invoice.
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <label className="label font-medium">
                  <span className="label-text">Ukuran Kertas</span>
                </label>
                <select
                  value={generalSettings.printSize || 'a4'}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    printSize: e.target.value as 'a4' | 'a5' | 'a6' | 'letter' | 'custom'
                  })}
                  className="select select-bordered w-full"
                >
                  <option value="a4">A4 (210mm x 297mm)</option>
                  <option value="a5">A5 (148mm x 210mm)</option>
                  <option value="a6">A6 (105mm x 148mm)</option>
                  <option value="letter">Letter (216mm x 279mm)</option>
                  <option value="custom">Ukuran Kustom</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end mt-8">
        <button
          className={`btn btn-primary btn-lg ${isSaving ? 'loading' : ''}`}
          onClick={handleSaveClick}
          disabled={isSaving}
        >
          {!isSaving && '💾'} Simpan Semua Pengaturan
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Konfirmasi Penyimpanan</h3>
            <p className="py-4">Apakah Anda yakin ingin menyimpan semua pengaturan? Perubahan akan diterapkan ke seluruh aplikasi.</p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirmDialog(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmSave}
              >
                Ya, Simpan
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setShowConfirmDialog(false)}></div>
        </div>
      )}
    </div>
  );
}