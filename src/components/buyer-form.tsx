
"use client";

import { useToast } from "@/hooks/use-toast";
import type { AddressDetails, Province, City, District, Village } from "@/lib/types";
import { useEffect, useState, useMemo, useRef } from "react";
import { getProvinces, getCitiesByProvince, getDistrictsByCity, getVillagesByDistrict } from "@/lib/regions";
import { ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

// Custom hook to detect clicks outside a ref
const useOutsideClick = (ref: React.RefObject<HTMLDivElement | null>, callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};

// Searchable Dropdown Component
const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  error
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const selectedOption = useMemo(() => options.find(opt => opt.id === value), [options, value]);

  const filteredOptions = useMemo(() =>
    options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  const handleSelect = (id: string) => {
    onChange(id);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`input input-bordered w-full flex items-center justify-between ${disabled ? 'input-disabled' : 'cursor-pointer'} ${error ? 'input-error' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.name || placeholder}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              placeholder="Cari..."
              className="input input-sm input-bordered w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="menu p-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <li key={opt.id} onClick={() => handleSelect(opt.id)}>
                  <a>{opt.name}</a>
                </li>
              ))
            ) : (
              <li className="menu-title"><span>Tidak ditemukan</span></li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};


export function BuyerForm({ onAddressSelect }: { onAddressSelect: (address: AddressDetails | null) => void }) {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [savedAddresses, setSavedAddresses] = useState<AddressDetails[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch addresses if user is authenticated
    if (status === "authenticated" && session?.user?.id) {
      const fetchAddresses = async () => {
        try {
          const response = await fetch('/api/checkout-data');
          if (response.ok) {
            const data = await response.json();
            // Transform the address data to match the AddressDetails interface
            const transformedAddresses = data.addresses.map((addr: any) => ({
              ...addr,
              isPrimary: addr.isDefault, // Map isDefault from API to isPrimary for the component
              fullName: addr.name || (addr.firstName ? addr.firstName + (addr.lastName ? ' ' + addr.lastName : '') : ''),
              province: addr.province || addr.state, // Map state to province
              street: addr.street || '',
              rtRwBlock: addr.rtRwBlock || '',
            }));
            setSavedAddresses(transformedAddresses);

            if (transformedAddresses.length > 0) {
              const primaryAddress = transformedAddresses.find((addr: any) => addr.isPrimary) || transformedAddresses[0];
              setSelectedAddressId(primaryAddress.id);
              onAddressSelect(primaryAddress);
            } else {
              setShowAddressForm(true);
              onAddressSelect(null);
            }
          } else {
            // If API fails due to auth issue, redirect to sign in
            if (response.status === 401) {
              console.error('User not authenticated, redirecting to sign in');
              // Redirect to login page to ensure proper authentication before checkout
              window.location.href = '/signin';
              return;
            } else {
              // For other API errors, log the issue and temporarily use localStorage as backup
              console.error(`Checkout data API failed: ${response.status} ${response.statusText}`);

              // Try to load from customer profile addresses API as an alternative
              try {
                const altResponse = await fetch('/api/customer-profile/addresses');
                if (altResponse.ok) {
                  const addresses = await altResponse.json();
                  // Transform the address data to match the AddressDetails interface
                  const transformedAddresses = addresses.map((addr: any) => ({
                    ...addr,
                    isPrimary: addr.isDefault, // Map isDefault from API to isPrimary for the component
                    fullName: addr.name || (addr.firstName ? addr.firstName + (addr.lastName ? ' ' + addr.lastName : '') : ''),
                    province: addr.province || addr.state, // Map state to province
                    street: addr.street || '',
                    rtRwBlock: addr.rtRwBlock || '',
                  }));
                  setSavedAddresses(transformedAddresses);

                  if (transformedAddresses.length > 0) {
                    const primaryAddress = transformedAddresses.find((addr: any) => addr.isPrimary) || transformedAddresses[0];
                    setSelectedAddressId(primaryAddress.id);
                    onAddressSelect(primaryAddress);
                  } else {
                    setShowAddressForm(true);
                    onAddressSelect(null);
                  }
                } else {
                  // If both APIs fail, prompt user to add new address
                  alert('Gagal memuat alamat dari server. Silakan masukkan alamat baru.');
                  setShowAddressForm(true);
                  onAddressSelect(null);
                }
              } catch (altError) {
                console.error('Alternative API also failed:', altError);
                alert('Gagal memuat alamat dari server. Silakan masukkan alamat baru.');
                setShowAddressForm(true);
                onAddressSelect(null);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
          // Try alternative API if main one fails
          try {
            const altResponse = await fetch('/api/customer-profile/addresses');
            if (altResponse.ok) {
              const addresses = await altResponse.json();
              // Transform the address data to match the AddressDetails interface
              const transformedAddresses = addresses.map((addr: any) => ({
                ...addr,
                isPrimary: addr.isDefault, // Map isDefault from API to isPrimary for the component
                fullName: addr.name || '',
                province: addr.province,
                street: addr.street || '',
                rtRwBlock: addr.rtRwBlock || '',
              }));
              setSavedAddresses(transformedAddresses);

              if (transformedAddresses.length > 0) {
                const primaryAddress = transformedAddresses.find((addr: any) => addr.isPrimary) || transformedAddresses[0];
                setSelectedAddressId(primaryAddress.id);
                onAddressSelect(primaryAddress);
              } else {
                setShowAddressForm(true);
                onAddressSelect(null);
              }
            } else {
              // If both APIs fail, prompt user to add new address
              alert('Terjadi kesalahan saat memuat alamat. Silakan masukkan alamat baru.');
              setShowAddressForm(true);
              onAddressSelect(null);
            }
          } catch (altError) {
            console.error('Alternative API also failed:', altError);
            alert('Terjadi kesalahan saat memuat alamat. Silakan masukkan alamat baru.');
            setShowAddressForm(true);
            onAddressSelect(null);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchAddresses();
    } else if (status === "unauthenticated" || (status === "authenticated" && !session?.user?.id)) {
      // If user is not authenticated, redirect to sign in
      console.error('User not authenticated, redirecting to sign in');
      window.location.href = '/signin';
    } else {
      // If session is loading, keep loading state
      setLoading(true);
    }
  }, [status, session, onAddressSelect]);

  const handleAddressSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find(addr => addr.id === addressId);
    onAddressSelect(selected || null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (savedAddresses.length > 0 && !showAddressForm) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {savedAddresses.map(addr => (
            <label key={addr.id} className="p-4 border rounded-lg flex items-start gap-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
              <input
                type="radio"
                name="selectedAddress"
                value={addr.id}
                checked={selectedAddressId === addr.id}
                onChange={handleAddressSelection}
                className="radio radio-primary mt-1"
              />
              <div>
                <p className="font-semibold">{addr.fullName} <span className="badge badge-outline ml-2">{addr.label}</span></p>
                <p className="text-sm text-base-content/70">{addr.phone}</p>
                <p className="text-sm text-base-content/70">{`${addr.street}, ${addr.village}, ${addr.district}`}</p>
                <p className="text-sm text-base-content/70">{`${addr.city}, ${addr.province}, ${addr.postalCode}`}</p>
              </div>
            </label>
          ))}
        </div>
        <button
          className="btn btn-outline w-full"
          onClick={() => {
            setShowAddressForm(true);
            setSelectedAddressId(null);
            onAddressSelect(null);
          }}
        >
          + Tambah Alamat Baru
        </button>
      </div>
    )
  }

  return (
    <AddressForm
      onSave={async (addressData) => {
        try {
          // Prepare the address data for API submission
          // Map isPrimary to isDefault for API compatibility and split fullName into firstName/lastName
          const nameParts = addressData.fullName?.split(' ') || [];
          const firstName = nameParts[0] || addressData.fullName || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') || '' : '';

          const apiAddressData = {
            ...addressData,
            firstName,
            lastName,
            state: addressData.province, // Map province to state for API
            isDefault: addressData.isPrimary, // Map isPrimary to isDefault for API
            // Include additional address fields that might not be in the spread
            rtRwBlock: addressData.rtRwBlock,
            provinceId: addressData.provinceId,
            cityId: addressData.cityId,
            districtId: addressData.districtId,
            villageId: addressData.villageId,
            district: addressData.district,
            village: addressData.village,
          };

          // Pick only the fields that exist in the database schema to avoid API errors
          const { isPrimary, fullName, province, ...addressToSend } = apiAddressData;
          const apiPayload = addressToSend;

          // Save to database via API using the same endpoint as profile page for consistency
          const response = await fetch('/api/customer-profile/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload),
          });

          if (response.ok) {
            // Get updated address list from customer profile API for consistency
            const addressesResponse = await fetch('/api/customer-profile/addresses');
            if (addressesResponse.ok) {
              const updatedAddresses = await addressesResponse.json();
              // Transform the address data to match the AddressDetails interface
              const transformedAddresses = updatedAddresses.map((addr: any) => ({
                ...addr,
                isPrimary: addr.isDefault, // Map isDefault from API to isPrimary for the component
                fullName: addr.name || '',
                province: addr.province,
                street: addr.street || '',
                rtRwBlock: addr.rtRwBlock || '',
              }));
              setSavedAddresses(transformedAddresses);
              // Find the address we just created by using the ID from the initial response
              const createdAddress = await response.json();
              const newAddress = transformedAddresses.find((addr: any) => addr.id === createdAddress.id) || transformedAddresses[transformedAddresses.length - 1]; // Get the added address
              setSelectedAddressId(newAddress.id);
              onAddressSelect(newAddress);
            } else {
              // If customer-profile/addresses API fails, try to get it from the POST response
              const createdAddress = await response.json();
              // Transform the created address to match the AddressDetails interface
              const transformedCreatedAddress = {
                ...createdAddress,
                isPrimary: createdAddress.isDefault, // Map isDefault from API to isPrimary for the component
                fullName: createdAddress.name || (createdAddress.firstName ? createdAddress.firstName + (createdAddress.lastName ? ' ' + createdAddress.lastName : '') : ''),
                province: createdAddress.province || createdAddress.state, // Map state to province
                street: createdAddress.street || '',
                rtRwBlock: createdAddress.rtRwBlock || '',
              };
              setSavedAddresses([...savedAddresses, transformedCreatedAddress]);
              setSelectedAddressId(transformedCreatedAddress.id);
              onAddressSelect(transformedCreatedAddress);
            }
            setShowAddressForm(false);
            toast({ title: "Alamat Disimpan", description: "Alamat baru Anda telah berhasil disimpan." });
          } else {
            const errorData = await response.json().catch(() => ({}));
            toast({
              title: "Gagal Menyimpan Alamat",
              description: errorData.message || "Gagal menyimpan alamat ke server.",
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error saving address:', error);
          toast({
            title: "Error",
            description: "Terjadi kesalahan saat menghubungi server.",
            variant: 'destructive'
          });
        }
      }}
    />
  );
}


export function AddressForm({ onSave, initialData, onCancel }: {
  onSave: (address: AddressDetails) => void;
  initialData?: Partial<AddressDetails>;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    id: initialData?.id || `addr_${Date.now()}`,
    fullName: initialData?.fullName || "",
    phone: initialData?.phone || "",
    provinceId: initialData?.provinceId || "",
    cityId: initialData?.cityId || "",
    districtId: initialData?.districtId || "",
    villageId: initialData?.villageId || "",
    street: initialData?.street || "",
    postalCode: initialData?.postalCode || "",
    rtRwBlock: initialData?.rtRwBlock || "",
    label: initialData?.label || "Rumah" as AddressDetails['label'],
    notes: initialData?.notes || "",
    isPrimary: initialData?.isPrimary || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const provinces = useMemo(() => getProvinces(), []);
  const cities = useMemo(() => getCitiesByProvince(formData.provinceId), [formData.provinceId]);
  const districts = useMemo(() => getDistrictsByCity(formData.cityId), [formData.cityId]);
  const villages = useMemo(() => getVillagesByDistrict(formData.districtId), [formData.districtId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.fullName.length < 2) newErrors.fullName = "Nama lengkap harus diisi.";
    if (formData.phone.length < 10) newErrors.phone = "Nomor telepon tidak valid.";
    if (!formData.provinceId) newErrors.provinceId = "Provinsi harus dipilih.";
    if (!formData.cityId) newErrors.cityId = "Kota/Kabupaten harus dipilih.";
    if (!formData.districtId) newErrors.districtId = "Kecamatan harus dipilih.";
    if (!formData.villageId) newErrors.villageId = "Kelurahan/Desa harus dipilih.";
    if (formData.street.length < 5) newErrors.street = "Nama jalan dan nomor rumah harus diisi.";
    if (!/^\d{5}$/.test(formData.postalCode)) newErrors.postalCode = "Kodepos harus 5 digit angka.";
    if (formData.rtRwBlock.length < 3) newErrors.rtRwBlock = "RT/RW atau blok harus diisi.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAddress = () => {
    if (!validate()) {
      toast({ title: "Form Tidak Lengkap", description: "Mohon periksa kembali data alamat Anda.", variant: "destructive" });
      return;
    }

    const selectedProvince = provinces.find(p => p.id === formData.provinceId);
    const selectedCity = cities.find(c => c.id === formData.cityId);
    const selectedDistrict = districts.find(d => d.id === formData.districtId);
    const selectedVillage = villages.find(v => v.id === formData.villageId);

    if (!selectedProvince || !selectedCity || !selectedDistrict || !selectedVillage) {
      toast({ title: "Error", description: "Data wilayah tidak valid.", variant: "destructive" });
      return;
    }

    // Split fullName into firstName and lastName for API compatibility
    const nameParts = formData.fullName.split(' ');
    const firstName = nameParts[0] || formData.fullName;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const completeAddress: AddressDetails = {
      ...formData,
      province: selectedProvince.name,
      city: selectedCity.name,
      district: selectedDistrict.name,
      village: selectedVillage.name,
    };

    onSave(completeAddress);
  };

  const handleRegionChange = (name: string, value: string) => {
    const newFormData = { ...formData, [name]: value };

    if (name === 'provinceId') {
      newFormData.cityId = '';
      newFormData.districtId = '';
      newFormData.villageId = '';
    } else if (name === 'cityId') {
      newFormData.districtId = '';
      newFormData.villageId = '';
    } else if (name === 'districtId') {
      newFormData.villageId = '';
    }

    setFormData(newFormData);

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Detail Penerima</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label"><span className="label-text">Nama Lengkap Penerima</span></label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" className={`input input-bordered w-full ${errors.fullName ? 'input-error' : ''}`} />
          {errors.fullName && <p className="text-error text-sm mt-1">{errors.fullName}</p>}
        </div>
        <div>
          <label className="label"><span className="label-text">Nomor Telepon Penerima</span></label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="081234567890" className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`} />
          {errors.phone && <p className="text-error text-sm mt-1">{errors.phone}</p>}
        </div>
      </div>

      <div className="divider"></div>

      <h3 className="font-semibold text-lg">Alamat Pengiriman</h3>
      <div>
        <label className="label"><span className="label-text">Provinsi</span></label>
        <SearchableDropdown
          options={provinces}
          value={formData.provinceId}
          onChange={(value) => handleRegionChange('provinceId', value)}
          placeholder="Pilih Provinsi"
          error={!!errors.provinceId}
        />
        {errors.provinceId && <p className="text-error text-sm mt-1">{errors.provinceId}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label"><span className="label-text">Kota/Kabupaten</span></label>
          <SearchableDropdown
            options={cities}
            value={formData.cityId}
            onChange={(value) => handleRegionChange('cityId', value)}
            placeholder="Pilih Kota/Kabupaten"
            disabled={!formData.provinceId}
            error={!!errors.cityId}
          />
          {errors.cityId && <p className="text-error text-sm mt-1">{errors.cityId}</p>}
        </div>
        <div>
          <label className="label"><span className="label-text">Kecamatan</span></label>
          <SearchableDropdown
            options={districts}
            value={formData.districtId}
            onChange={(value) => handleRegionChange('districtId', value)}
            placeholder="Pilih Kecamatan"
            disabled={!formData.cityId}
            error={!!errors.districtId}
          />
          {errors.districtId && <p className="text-error text-sm mt-1">{errors.districtId}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label"><span className="label-text">Kelurahan/Desa</span></label>
          <SearchableDropdown
            options={villages}
            value={formData.villageId}
            onChange={(value) => handleRegionChange('villageId', value)}
            placeholder="Pilih Kelurahan/Desa"
            disabled={!formData.districtId}
            error={!!errors.villageId}
          />
          {errors.villageId && <p className="text-error text-sm mt-1">{errors.villageId}</p>}
        </div>
        <div>
          <label className="label"><span className="label-text">Kodepos</span></label>
          <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="5 digit kodepos" className={`input input-bordered w-full ${errors.postalCode ? 'input-error' : ''}`} />
          {errors.postalCode && <p className="text-error text-sm mt-1">{errors.postalCode}</p>}
        </div>
      </div>
      <div>
        <label className="label"><span className="label-text">RT/RW atau No. Blok</span></label>
        <input type="text" name="rtRwBlock" value={formData.rtRwBlock} onChange={handleChange} placeholder="RT 001/RW 002" className={`input input-bordered w-full ${errors.rtRwBlock ? 'input-error' : ''}`} />
        {errors.rtRwBlock && <p className="text-error text-sm mt-1">{errors.rtRwBlock}</p>}
      </div>
      <div>
        <label className="label"><span className="label-text">Nama Jalan & No. Rumah</span></label>
        <textarea name="street" value={formData.street} onChange={handleChange} placeholder="Jl. Damai Sejahtera No. 12B" className={`textarea textarea-bordered w-full ${errors.street ? 'textarea-error' : ''}`} />
        {errors.street && <p className="text-error text-sm mt-1">{errors.street}</p>}
      </div>
      <div>
        <label className="label"><span className="label-text">Catatan untuk Kurir (Opsional)</span></label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Contoh: Pagar warna hitam" className="textarea textarea-bordered w-full" />
      </div>
      <div>
        <label className="label"><span className="label-text">Simpan sebagai</span></label>
        <div className="flex gap-4">
          {(['Rumah', 'Kantor', 'Apartemen'] as const).map(label => (
            <div key={label} className="form-control">
              <label className="label cursor-pointer gap-2">
                <input type="radio" name="label" value={label} checked={formData.label === label} onChange={(e) => setFormData(p => ({ ...p, label: e.target.value as AddressDetails['label'] }))} className="radio radio-primary" />
                <span className="label-text">{label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">Jadikan alamat utama</span>
          <input type="checkbox" name="isPrimary" checked={formData.isPrimary} onChange={handleChange} className="checkbox checkbox-primary" />
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && <button className="btn btn-ghost" type="button" onClick={onCancel}>Batal</button>}
        <button className="btn btn-primary" type="button" onClick={handleSaveAddress}>Simpan Alamat</button>
      </div>
    </div>
  );
}
