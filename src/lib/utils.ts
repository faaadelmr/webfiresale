import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CartItem, AddressDetails, UserProfile, GeneralSettings } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// --- LocalStorage Utility Functions (only for client-side settings cache) ---
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Failed to parse ${key} from storage`, e);
        return defaultValue;
      }
    }
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} to storage`, e);
    }
  }
}

// --- Address Functions (local cache for quick access) ---
export const getSavedAddresses = (): AddressDetails[] => getFromStorage<AddressDetails[]>('userAddresses', []);
export const saveAddresses = (addresses: AddressDetails[]) => saveToStorage<AddressDetails[]>('userAddresses', addresses);

// --- Profile Functions (local cache for quick access) ---
const defaultProfile: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
  avatar: ""
};
export const getProfileFromStorage = (): UserProfile => getFromStorage<UserProfile>('userProfile', defaultProfile);
export const saveProfileToStorage = (profile: UserProfile) => saveToStorage<UserProfile>('userProfile', profile);

// --- General Settings (local cache) ---
export const getGeneralSettingsFromStorage = (): GeneralSettings => {
  const defaultGeneralSettings: GeneralSettings = {
    bannerEnabled: false,
    paymentTimeLimit: 5,
    businessAddress: undefined,
    printSize: 'a4'
  };
  return getFromStorage('generalSettings', defaultGeneralSettings);
};

export function saveGeneralSettingsToStorage(settings: any) {
  if (typeof window !== 'undefined') {
    try {
      // Create a copy without the large image data to prevent storage errors
      const { bannerImage, ...rest } = settings;
      const lightSettings = {
        ...rest,
        bannerImage: bannerImage ? true : undefined, // Store a boolean to indicate presence
      };
      saveToStorage('generalSettings', lightSettings);
      if (bannerImage) {
        saveToStorage('bannerImage', { image: bannerImage });
      } else {
        localStorage.removeItem('bannerImage'); // Remove if no image
      }
    } catch (error) {
      console.error('Error saving general settings to localStorage:', error);
    }
  }
}

// --- Account Settings (local cache for payment info) ---
export const getAccountSettingsFromStorage = () => getFromStorage('accountSettings', null);
export const saveAccountSettingsToStorage = (settings: any) => saveToStorage('accountSettings', settings);

// --- Cart Availability Check (uses data from cart context) ---
export function isProductAvailableForCart(
  productId: string,
  requestedQuantity: number = 1,
  cartItems: CartItem[] = [],
  isUpdate: boolean = false
): {
  isAvailable: boolean;
  message: string;
  maxAvailable?: number;
} {
  const now = new Date();

  // Find the product in current cart items
  const itemInCart = cartItems.find(item => item.product.id === productId);

  // If product is not in cart and we're doing an update, it's available
  if (!itemInCart && isUpdate) {
    return { isAvailable: true, message: "Produk tersedia" };
  }

  // Get product info from cart item (for flash sale validations)
  const product = itemInCart?.product;

  // This function is only for flash sale products. Regular products are assumed to have infinite stock.
  if (!product || !product.flashSaleId) {
    return { isAvailable: true, message: "Produk reguler, selalu tersedia." };
  }

  const start = product.startDate ? new Date(product.startDate) : null;
  const end = product.endDate ? new Date(product.endDate) : null;

  if (start && now < start) {
    return { isAvailable: false, message: "Flash sale untuk produk ini belum dimulai." };
  }
  if (end && now >= end) {
    return { isAvailable: false, message: "Flash sale untuk produk ini sudah berakhir." };
  }

  const availableStock = (product.limitedQuantity || 0) - (product.sold || 0);

  if (availableStock <= 0) {
    return { isAvailable: false, message: "Stok produk ini sudah habis." };
  }

  // For update, requestedQuantity is the new total, so we don't add existing cart quantity
  let quantityInCart = 0;
  if (!isUpdate && itemInCart) {
    quantityInCart = itemInCart.quantity;
  }

  const totalRequested = requestedQuantity + quantityInCart;

  if (product.maxOrderQuantity && totalRequested > product.maxOrderQuantity) {
    return {
      isAvailable: false,
      message: `Anda hanya dapat membeli maksimal ${product.maxOrderQuantity} unit produk ini.`,
      maxAvailable: product.maxOrderQuantity
    };
  }

  if (totalRequested > availableStock) {
    return {
      isAvailable: false,
      message: `Stok hanya tersisa ${availableStock} unit`,
      maxAvailable: availableStock
    };
  }

  return {
    isAvailable: true,
    message: "Produk tersedia"
  };
}

// --- Shipping Cost Calculation (Client Side with CartItems) ---
export function calculateShippingCostFromCart(
  items: { product: { weight: number }; quantity: number }[],
  shippingOptions: { cityId: string; cost: number }[],
  shippingCityId: string
) {
  // Find the shipping option for the destination city (matching the cityId)
  const shippingOption = shippingOptions.find((option) =>
    option.cityId === shippingCityId
  );

  if (!shippingOption) {
    return 0; // No shipping option found
  }

  let totalWeight = 0;
  items.forEach((item) => {
    totalWeight += (item.product.weight || 0) * item.quantity;
  });

  // Convert total weight from grams to kilograms
  const totalWeightInKg = totalWeight / 1000;

  // Calculate based on 1kg increments, rounding up
  const kgUnits = Math.ceil(totalWeightInKg);

  // Ensure at least 1kg is charged if there's weight
  const chargeableWeight = kgUnits === 0 && totalWeight > 0 ? 1 : kgUnits;

  // Calculate final shipping cost
  return shippingOption.cost * chargeableWeight;
}

// --- Deprecated functions (kept for backwards compatibility, now no-ops) ---
// These functions previously updated localStorage but are no longer needed
// as all data is now managed via database/API

export function updateSoldProductQuantity(productId: string, soldQuantity: number): boolean {
  // This is now handled by the database via API
  // Kept for backwards compatibility - does nothing
  console.warn('updateSoldProductQuantity is deprecated. Stock updates are now handled via API.');
  return true;
}