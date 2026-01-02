"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2, MapPin, DollarSign, ChevronDown, ChevronUp, X, Plus, Check } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import type { ShippingOption } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getAllCities } from "@/lib/regions";

interface ShippingZone {
  cost: number;
  cities: { id: string; cityId: string; name: string }[];
}

export default function ShippingPage() {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [expandedZone, setExpandedZone] = useState<number | null>(null);
  const [isAddZoneDialogOpen, setIsAddZoneDialogOpen] = useState(false);
  const [isAddCityDialogOpen, setIsAddCityDialogOpen] = useState(false);
  const [selectedZoneCost, setSelectedZoneCost] = useState<number | null>(null);
  const [newZoneCost, setNewZoneCost] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCities, setSelectedCities] = useState<{ id: string; name: string }[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const { toast } = useToast();

  const allCities = getAllCities();

  // Fetch shipping options and group by cost
  useEffect(() => {
    const fetchShippingOptions = async () => {
      try {
        const response = await fetch('/api/admin/shipping-options');
        if (response.ok) {
          const options = await response.json();
          setShippingOptions(options);

          // Group by cost to create zones
          const zoneMap = new Map<number, ShippingZone>();
          options.forEach((option: ShippingOption) => {
            const cost = option.cost;
            const cityName = allCities.find(c => c.id === option.cityId)?.name || option.cityId;

            if (zoneMap.has(cost)) {
              zoneMap.get(cost)!.cities.push({ id: option.id, cityId: option.cityId, name: cityName });
            } else {
              zoneMap.set(cost, {
                cost,
                cities: [{ id: option.id, cityId: option.cityId, name: cityName }]
              });
            }
          });

          // Sort zones by cost
          const sortedZones = Array.from(zoneMap.values()).sort((a, b) => a.cost - b.cost);
          setZones(sortedZones);
        }
      } catch (error) {
        console.error('Error fetching shipping options:', error);
      }
    };

    fetchShippingOptions();
  }, []);

  // Filter cities for search
  useEffect(() => {
    if (citySearch.trim() === "") {
      setFilteredCities([]);
      return;
    }

    // Get already added city IDs for the selected zone
    const existingCityIds = new Set(
      shippingOptions
        .filter(o => o.cost === selectedZoneCost)
        .map(o => o.cityId)
    );

    // Also exclude already selected cities in dialog
    const selectedCityIds = new Set(selectedCities.map(c => c.id));

    const results = allCities
      .filter(cityObj =>
        cityObj.name.toLowerCase().includes(citySearch.toLowerCase()) &&
        !existingCityIds.has(cityObj.id) &&
        !selectedCityIds.has(cityObj.id)
      )
      .slice(0, 10);

    setFilteredCities(results);
  }, [citySearch, allCities, shippingOptions, selectedZoneCost, selectedCities]);

  const handleAddZone = () => {
    setNewZoneCost("");
    setSelectedCities([]);
    setCitySearch("");
    setIsAddZoneDialogOpen(true);
  };

  const handleAddCitiesToZone = (cost: number) => {
    setSelectedZoneCost(cost);
    setSelectedCities([]);
    setCitySearch("");
    setIsAddCityDialogOpen(true);
  };

  const handleSelectCity = (city: { id: string; name: string }) => {
    setSelectedCities(prev => [...prev, city]);
    setCitySearch("");
    setFilteredCities([]);
  };

  const handleRemoveSelectedCity = (cityId: string) => {
    setSelectedCities(prev => prev.filter(c => c.id !== cityId));
  };

  const handleSaveNewZone = async () => {
    const cost = Number(newZoneCost);
    if (isNaN(cost) || cost <= 0) {
      toast({
        title: "Harga Tidak Valid",
        description: "Masukkan harga yang valid.",
        variant: "destructive"
      });
      return;
    }

    if (selectedCities.length === 0) {
      toast({
        title: "Pilih Kota",
        description: "Pilih minimal satu kota untuk zona ini.",
        variant: "destructive"
      });
      return;
    }

    // Check if zone with this cost already exists
    if (zones.some(z => z.cost === cost)) {
      toast({
        title: "Zona Sudah Ada",
        description: "Zona dengan harga ini sudah ada. Tambahkan kota ke zona yang sudah ada.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add all selected cities with this cost
      for (const city of selectedCities) {
        await fetch('/api/admin/shipping-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityId: city.id, cost })
        });
      }

      toast({ title: `Zona ${formatPrice(cost)} berhasil dibuat dengan ${selectedCities.length} kota` });

      // Refresh data
      const response = await fetch('/api/admin/shipping-options');
      if (response.ok) {
        const options = await response.json();
        setShippingOptions(options);
        refreshZones(options);
      }

      setIsAddZoneDialogOpen(false);
    } catch (error) {
      console.error('Error creating zone:', error);
      toast({
        title: "Gagal membuat zona",
        description: "Terjadi kesalahan saat membuat zona baru.",
        variant: "destructive"
      });
    }
  };

  const handleSaveNewCities = async () => {
    if (selectedCities.length === 0 || selectedZoneCost === null) {
      toast({
        title: "Pilih Kota",
        description: "Pilih minimal satu kota untuk ditambahkan.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add all selected cities with this cost
      for (const city of selectedCities) {
        await fetch('/api/admin/shipping-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityId: city.id, cost: selectedZoneCost })
        });
      }

      toast({ title: `${selectedCities.length} kota berhasil ditambahkan ke zona ${formatPrice(selectedZoneCost)}` });

      // Refresh data
      const response = await fetch('/api/admin/shipping-options');
      if (response.ok) {
        const options = await response.json();
        setShippingOptions(options);
        refreshZones(options);
      }

      setIsAddCityDialogOpen(false);
    } catch (error) {
      console.error('Error adding cities:', error);
      toast({
        title: "Gagal menambahkan kota",
        description: "Terjadi kesalahan saat menambahkan kota.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCity = async (optionId: string, cityName: string) => {
    try {
      const response = await fetch(`/api/admin/shipping-options?id=${optionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: `${cityName} berhasil dihapus` });

        // Refresh data
        const refreshResponse = await fetch('/api/admin/shipping-options');
        if (refreshResponse.ok) {
          const options = await refreshResponse.json();
          setShippingOptions(options);
          refreshZones(options);
        }
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: "Gagal menghapus kota",
        description: "Terjadi kesalahan saat menghapus kota.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteZone = async (cost: number) => {
    const zoneOptions = shippingOptions.filter(o => o.cost === cost);

    if (!confirm(`Hapus zona ${formatPrice(cost)} dengan ${zoneOptions.length} kota?`)) {
      return;
    }

    try {
      // Delete all cities in this zone
      for (const option of zoneOptions) {
        await fetch(`/api/admin/shipping-options?id=${option.id}`, {
          method: 'DELETE',
        });
      }

      toast({ title: `Zona ${formatPrice(cost)} berhasil dihapus` });

      // Refresh data
      const response = await fetch('/api/admin/shipping-options');
      if (response.ok) {
        const options = await response.json();
        setShippingOptions(options);
        refreshZones(options);
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast({
        title: "Gagal menghapus zona",
        description: "Terjadi kesalahan saat menghapus zona.",
        variant: "destructive"
      });
    }
  };

  const refreshZones = (options: ShippingOption[]) => {
    const zoneMap = new Map<number, ShippingZone>();
    options.forEach((option: ShippingOption) => {
      const cost = option.cost;
      const cityName = allCities.find(c => c.id === option.cityId)?.name || option.cityId;

      if (zoneMap.has(cost)) {
        zoneMap.get(cost)!.cities.push({ id: option.id, cityId: option.cityId, name: cityName });
      } else {
        zoneMap.set(cost, {
          cost,
          cities: [{ id: option.id, cityId: option.cityId, name: cityName }]
        });
      }
    });

    const sortedZones = Array.from(zoneMap.values()).sort((a, b) => a.cost - b.cost);
    setZones(sortedZones);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Ongkos Kirim</h1>
          <p className="text-base-content/60 text-sm mt-1">Atur zona pengiriman berdasarkan harga</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleAddZone}>
          <PlusCircle className="h-4 w-4" />
          Buat Zona Baru
        </button>
      </div>

      {/* Zones List */}
      <div className="space-y-4">
        {zones.length === 0 ? (
          <div className="bg-base-100 rounded-xl border border-base-200 p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold text-base-content/70">Belum Ada Zona Pengiriman</h3>
            <p className="text-base-content/50 text-sm mt-1">Buat zona baru untuk mengatur ongkos kirim</p>
          </div>
        ) : (
          zones.map((zone, idx) => (
            <div key={zone.cost} className="bg-base-100 rounded-xl border border-base-200 overflow-hidden">
              {/* Zone Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-base-50 transition-colors"
                onClick={() => setExpandedZone(expandedZone === idx ? null : idx)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary rounded-lg p-3">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary">{formatPrice(zone.cost)}</h3>
                    <p className="text-sm text-base-content/60">{zone.cities.length} kota</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleAddCitiesToZone(zone.cost); }}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Kota
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-error"
                    onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.cost); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {expandedZone === idx ? (
                    <ChevronUp className="h-5 w-5 text-base-content/50" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-base-content/50" />
                  )}
                </div>
              </div>

              {/* Cities List (Expandable) */}
              {expandedZone === idx && (
                <div className="border-t border-base-200 p-4 bg-base-50">
                  <div className="flex flex-wrap gap-2">
                    {zone.cities.map((city) => (
                      <div
                        key={city.id}
                        className="flex items-center gap-2 bg-base-100 border border-base-200 rounded-full px-3 py-1.5 text-sm"
                      >
                        <MapPin className="h-3 w-3 text-base-content/50" />
                        <span>{city.name}</span>
                        <button
                          className="text-error hover:bg-error/10 rounded-full p-0.5"
                          onClick={() => handleDeleteCity(city.id, city.name)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Zone Dialog */}
      {isAddZoneDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Buat Zona Pengiriman Baru</h3>

            <div className="space-y-4">
              {/* Cost Input */}
              <div>
                <label className="label font-medium">
                  <span className="label-text">Harga Ongkos Kirim (Rp)</span>
                </label>
                <input
                  type="number"
                  value={newZoneCost}
                  onChange={(e) => setNewZoneCost(e.target.value)}
                  placeholder="e.g., 15000"
                  className="input input-bordered w-full"
                />
              </div>

              {/* City Search */}
              <div>
                <label className="label font-medium">
                  <span className="label-text">Tambah Kota ke Zona Ini</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Cari kota..."
                    className="input input-bordered w-full"
                  />
                  {filteredCities.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-base-100 border border-base-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <li
                          key={city.id}
                          className="p-2 hover:bg-base-200 cursor-pointer flex items-center gap-2"
                          onClick={() => handleSelectCity(city)}
                        >
                          <MapPin className="h-4 w-4 text-base-content/50" />
                          {city.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Selected Cities */}
              {selectedCities.length > 0 && (
                <div>
                  <label className="label font-medium">
                    <span className="label-text">Kota Terpilih ({selectedCities.length})</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-base-200 rounded-lg">
                    {selectedCities.map((city) => (
                      <div
                        key={city.id}
                        className="flex items-center gap-1 bg-primary text-primary-content rounded-full px-3 py-1 text-sm"
                      >
                        <Check className="h-3 w-3" />
                        {city.name}
                        <button
                          className="ml-1 hover:bg-primary-focus rounded-full p-0.5"
                          onClick={() => handleRemoveSelectedCity(city.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <button className="btn btn-ghost" onClick={() => setIsAddZoneDialogOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSaveNewZone}>
                Buat Zona ({selectedCities.length} kota)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Cities to Existing Zone Dialog */}
      {isAddCityDialogOpen && selectedZoneCost !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Tambah Kota ke Zona</h3>
            <p className="text-base-content/60 text-sm mb-4">Zona: {formatPrice(selectedZoneCost)}</p>

            <div className="space-y-4">
              {/* City Search */}
              <div>
                <label className="label font-medium">
                  <span className="label-text">Cari dan Pilih Kota</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Cari kota..."
                    className="input input-bordered w-full"
                  />
                  {filteredCities.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-base-100 border border-base-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <li
                          key={city.id}
                          className="p-2 hover:bg-base-200 cursor-pointer flex items-center gap-2"
                          onClick={() => handleSelectCity(city)}
                        >
                          <MapPin className="h-4 w-4 text-base-content/50" />
                          {city.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Selected Cities */}
              {selectedCities.length > 0 && (
                <div>
                  <label className="label font-medium">
                    <span className="label-text">Kota Terpilih ({selectedCities.length})</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-base-200 rounded-lg">
                    {selectedCities.map((city) => (
                      <div
                        key={city.id}
                        className="flex items-center gap-1 bg-primary text-primary-content rounded-full px-3 py-1 text-sm"
                      >
                        <Check className="h-3 w-3" />
                        {city.name}
                        <button
                          className="ml-1 hover:bg-primary-focus rounded-full p-0.5"
                          onClick={() => handleRemoveSelectedCity(city.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <button className="btn btn-ghost" onClick={() => setIsAddCityDialogOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSaveNewCities}>
                Tambah {selectedCities.length} Kota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}