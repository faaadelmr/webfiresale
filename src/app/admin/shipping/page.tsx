"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import type { ShippingOption } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getAllCities } from "@/lib/regions";

export default function ShippingPage() {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState<ShippingOption | null>(null);
  const [city, setCity] = useState(""); // city name for display purposes
  const [cityId, setCityId] = useState(""); // city ID for database storage
  const [cost, setCost] = useState("");
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const { toast } = useToast();

  // Extract cities with both name and ID from regions data for the input suggestions
  const allCities = getAllCities();

  useEffect(() => {
    const fetchShippingOptions = async () => {
      try {
        const response = await fetch('/api/admin/shipping-options');
        if (response.ok) {
          const options = await response.json();
          setShippingOptions(options);
        } else {
          console.error('Failed to fetch shipping options:', response.statusText);
          // Fallback to empty array if API fails
          setShippingOptions([]);
        }
      } catch (error) {
        console.error('Error fetching shipping options:', error);
        // Fallback to empty array if API fails
        setShippingOptions([]);
      }
    };

    fetchShippingOptions();
  }, []);

  // Filter cities based on user input
  useEffect(() => {
    if (city.trim() === "") {
      setFilteredCities([]);
      return;
    }

    const results = allCities
      .filter(cityObj =>
        cityObj.name.toLowerCase().includes(city.toLowerCase())
      )
      .slice(0, 10); // Limit to 10 suggestions

    setFilteredCities(results);
  }, [city, allCities]);

  const saveOptionsToStateAndStorage = (options: ShippingOption[]) => {
    setShippingOptions(options);
  };

  const handleAdd = () => {
    setCurrentOption(null);
    setCity("");
    setCost("");
    setShowCitySuggestions(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (option: ShippingOption) => {
    setCurrentOption(option);
    // Since we're now using cityId, look up the city name for display
    const cityObj = allCities.find(c => c.id === option.cityId);
    setCity(cityObj ? cityObj.name : option.cityId); // Display name if found, else ID
    setCityId(option.cityId);
    setCost(String(option.cost));
    setShowCitySuggestions(false);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/shipping-options?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedOptions = shippingOptions.filter((option) => option.id !== id);
        saveOptionsToStateAndStorage(updatedOptions);
        toast({ title: "Opsi Pengiriman Dihapus" });
      } else {
        const errorData = await response.json();
        toast({
          title: "Gagal menghapus opsi pengiriman",
          description: errorData.message || "Terjadi kesalahan saat menghapus opsi pengiriman",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting shipping option:', error);
      toast({
        title: "Gagal menghapus opsi pengiriman",
        description: "Terjadi kesalahan saat menghapus opsi pengiriman",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    // Validate that the city exists in the regions data (case-insensitive)
    // Find the city object based on the name entered
    const selectedCity = allCities.find(cityObj =>
      cityObj.name.toLowerCase().trim() === city.toLowerCase().trim()
    );

    if (!selectedCity) {
      toast({
        title: "Kota Tidak Valid",
        description: "Silakan pilih kota dari daftar yang tersedia.",
        variant: "destructive",
      });
      return;
    }

    if (!city || !cost || isNaN(Number(cost))) {
      toast({
        title: "Input Tidak Valid",
        description: "Pastikan kota dan biaya diisi dengan benar.",
        variant: "destructive",
      });
      return;
    }

    // Use the city ID from the selected city object
    const selectedCityId = selectedCity.id;

    try {
      if (currentOption) {
        // Edit existing shipping option
        const response = await fetch('/api/admin/shipping-options', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...currentOption, // Include the id
            cityId: selectedCityId,
            cost: Number(cost),
          }),
        });

        if (response.ok) {
          const updatedShippingOption = await response.json();
          const updatedOptions = shippingOptions.map((option) =>
            option.id === currentOption.id ? updatedShippingOption : option
          );
          saveOptionsToStateAndStorage(updatedOptions);
          toast({ title: "Opsi Pengiriman Diperbarui" });
        } else {
          const errorData = await response.json();
          toast({
            title: "Gagal memperbarui opsi pengiriman",
            description: errorData.message || "Terjadi kesalahan saat memperbarui opsi pengiriman",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Add new shipping option
        const response = await fetch('/api/admin/shipping-options', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cityId: selectedCityId,
            cost: Number(cost),
          }),
        });

        if (response.ok) {
          const newShippingOption = await response.json();
          saveOptionsToStateAndStorage([...shippingOptions, newShippingOption]);
          toast({ title: "Opsi Pengiriman Ditambahkan" });
        } else {
          const errorData = await response.json();
          toast({
            title: "Gagal menambahkan opsi pengiriman",
            description: errorData.message || "Terjadi kesalahan saat menambahkan opsi pengiriman",
            variant: "destructive",
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error saving shipping option:', error);
      toast({
        title: currentOption ? "Gagal memperbarui opsi pengiriman" : "Gagal menambahkan opsi pengiriman",
        description: "Terjadi kesalahan saat menyimpan opsi pengiriman",
        variant: "destructive"
      });
      return;
    }

    setIsDialogOpen(false);
    setShowCitySuggestions(false);
  };

  const handleCitySelect = (selectedCity: any) => {
    setCity(selectedCity.name);
    setCityId(selectedCity.id);
    setShowCitySuggestions(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kelola Ongkos Kirim</h1>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleAdd}>
          <PlusCircle className="h-4 w-4" />
          Tambah Tujuan
        </button>
      </div>
      <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Kota Tujuan</th>
                <th>Ongkos Kirim</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shippingOptions.map((option) => (
                <tr key={option.id}>
                  <td className="font-medium">
                    {allCities.find(cityObj => cityObj.id === option.cityId)?.name || option.cityId}
                  </td>
                  <td>{formatPrice(option.cost)}</td>
                  <td className="text-right space-x-2">
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(option)}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => handleDelete(option.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-base-100 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{currentOption ? "Edit" : "Tambah"} Opsi Pengiriman</h3>
            <div className="py-4 space-y-4">
              <div className="relative">
                <label className="label font-medium">
                  <span className="label-text">Kota Tujuan</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setShowCitySuggestions(true)}
                  placeholder="Cari kota..."
                  className="input input-bordered w-full"
                />
                {showCitySuggestions && filteredCities.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-base-100 border border-base-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCities.map((cityObj, index) => (
                      <li
                        key={index}
                        className="p-2 hover:bg-base-200 cursor-pointer"
                        onMouseDown={() => handleCitySelect(cityObj)}
                      >
                        {cityObj.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="label font-medium">
                  <span className="label-text">Ongkos Kirim</span>
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g., 10000"
                  className="input input-bordered w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button className="btn btn-ghost" onClick={() => setIsDialogOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}