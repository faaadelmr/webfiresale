import { mockRegions } from './regions';

/**
 * Get province name by ID
 */
export function getProvinceName(provinceId: string): string {
    const province = mockRegions.provinces.find(p => p.id === provinceId);
    return province?.name || provinceId; // Fallback to ID if not found
}

/**
 * Get city name by ID
 */
export function getCityName(cityId: string): string {
    const city = mockRegions.cities.find(c => c.id === cityId);
    return city?.name || cityId; // Fallback to ID if not found
}

/**
 * Get district name by ID
 */
export function getDistrictName(districtId: string): string {
    const district = mockRegions.districts.find(d => d.id === districtId);
    return district?.name || districtId; // Fallback to ID if not found
}

/**
 * Get village name by ID
 */
export function getVillageName(villageId: string): string {
    const village = mockRegions.villages.find(v => v.id === villageId);
    return village?.name || villageId; // Fallback to ID if not found
}

/**
 * Enrich address with region names from IDs
 * Takes an address with only IDs and returns it with name fields populated
 */
export function enrichAddressWithNames(address: {
    id: string;
    name: string;
    provinceId: string;
    cityId: string;
    districtId: string;
    villageId: string;
    street: string;
    rtRwBlock: string;
    postalCode: string;
    label: string | null;
    notes: string | null;
    phone: string;
    isDefault?: boolean;
    userId?: string;
}) {
    return {
        ...address,
        province: getProvinceName(address.provinceId),
        city: getCityName(address.cityId),
        district: getDistrictName(address.districtId),
        village: getVillageName(address.villageId),
    };
}

/**
 * Get full address string with names
 */
export function getFullAddressString(address: {
    provinceId: string;
    cityId: string;
    districtId: string;
    villageId: string;
    street: string;
    postalCode: string;
}): string {
    const province = getProvinceName(address.provinceId);
    const city = getCityName(address.cityId);
    const district = getDistrictName(address.districtId);
    const village = getVillageName(address.villageId);

    return `${address.street}, ${village}, ${district}, ${city}, ${province}, ${address.postalCode}`;
}
