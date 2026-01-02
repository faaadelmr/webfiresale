import { mockRegions } from './regions';

// Create lookup maps for O(1) access
// We use lazy initialization or immediate? Immediate is fine for module scope.
// Using specific interface to ensure type safety if types are available, else inference.

const provinceMap = new Map<string, string>();
const cityMap = new Map<string, string>();
const districtMap = new Map<string, string>();
const villageMap = new Map<string, string>();

let isIndexed = false;

function ensureIndexes() {
    if (isIndexed) return;

    console.time('Building Region Indexes');

    // Index Provinces
    if (mockRegions.provinces) {
        for (const p of mockRegions.provinces) {
            provinceMap.set(p.id, p.name);
        }
    }

    // Index Cities
    if (mockRegions.cities) {
        for (const c of mockRegions.cities) {
            cityMap.set(c.id, c.name);
        }
    }

    // Index Districts
    if (mockRegions.districts) {
        for (const d of mockRegions.districts) {
            districtMap.set(d.id, d.name);
        }
    }

    // Index Villages
    if (mockRegions.villages) {
        for (const v of mockRegions.villages) {
            villageMap.set(v.id, v.name);
        }
    }

    isIndexed = true;
    console.timeEnd('Building Region Indexes');
}

// Initialize indexes immediately to avoid race conditions or lag on first request
// However, in serverless, this runs on cold start.
try {
    ensureIndexes();
} catch (e) {
    console.error("Failed to index regions:", e);
}

/**
 * Get province name by ID
 */
export function getProvinceName(provinceId: string): string {
    return provinceMap.get(provinceId) || provinceId;
}

/**
 * Get city name by ID
 */
export function getCityName(cityId: string): string {
    return cityMap.get(cityId) || cityId;
}

/**
 * Get district name by ID
 */
export function getDistrictName(districtId: string): string {
    return districtMap.get(districtId) || districtId;
}

/**
 * Get village name by ID
 */
export function getVillageName(villageId: string): string {
    return villageMap.get(villageId) || villageId;
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
    if (!isIndexed) ensureIndexes(); // Fallback safety

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
