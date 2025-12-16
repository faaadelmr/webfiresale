

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FlashSale, CartItem, Product, CartProduct, AddressDetails, UserProfile, GeneralSettings, Auction } from "./types";

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

// --- LocalStorage Utility Functions ---
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

// --- Product Functions ---
export const getProductsFromStorage = (): Product[] => getFromStorage<Product[]>('products', []);
export const saveProductsToStorage = (products: Product[]) => saveToStorage<Product[]>('products', products);

// --- FlashSale Functions ---
export function getFlashSalesFromStorage(): FlashSale[] {
  const flashSales = getFromStorage<FlashSale[]>('flashSales', []);
  // Ensure dates are converted back to Date objects
  return flashSales.map((fs: any) => ({
    ...fs,
    startDate: new Date(fs.startDate),
    endDate: new Date(fs.endDate),
  }));
}
export const saveFlashSalesToStorage = (flashSales: FlashSale[]) => saveToStorage<FlashSale[]>('flashSales', flashSales);

// --- Combined FlashSale with Product details ---
export function getActiveFlashSaleProducts(): CartProduct[] {
    const products = getProductsFromStorage();
    const flashSales = getFlashSalesFromStorage();
    const now = new Date();

    const activeFlashSaleProducts: CartProduct[] = [];

    flashSales.forEach(fs => {
        const product = products.find(p => p.id === fs.productId);
        if (product) {
            const saleStartDate = new Date(fs.startDate);
            const saleEndDate = new Date(fs.endDate);
            if (now >= saleStartDate && now < saleEndDate) {
                activeFlashSaleProducts.push({
                    ...product,
                    flashSaleId: fs.id,
                    flashSalePrice: fs.flashSalePrice,
                    maxOrderQuantity: fs.maxOrderQuantity,
                    limitedQuantity: fs.limitedQuantity,
                    sold: fs.sold,
                    startDate: fs.startDate,
                    endDate: fs.endDate,
                });
            }
        }
    });

    return activeFlashSaleProducts;
}

// --- Address Functions ---
export const getSavedAddresses = (): AddressDetails[] => getFromStorage<AddressDetails[]>('userAddresses', []);
export const saveAddresses = (addresses: AddressDetails[]) => saveToStorage<AddressDetails[]>('userAddresses', addresses);


// --- Profile Functions ---
const defaultProfile: UserProfile = {
  fullName: "Fadel Muhammad",
  email: "faaadelmr@gmail.com",
  phone: "+62 812-3456-7890",
  avatar: "https://picsum.photos/seed/profile-avatar/200/200"
};
export const getProfileFromStorage = (): UserProfile => getFromStorage<UserProfile>('userProfile', defaultProfile);
export const saveProfileToStorage = (profile: UserProfile) => saveToStorage<UserProfile>('userProfile', profile);


// --- Other Settings ---
export const getAccountSettingsFromStorage = () => getFromStorage('accountSettings', null);
export const saveAccountSettingsToStorage = (settings: any) => saveToStorage('accountSettings', settings);
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
  const allFlashSaleProducts = getActiveFlashSaleProducts();
  
  const product = allFlashSaleProducts.find(p => p.id === productId);

  // This function is only for flash sale products now. Regular products are assumed to have infinite stock.
  if (!product || !product.flashSaleId) {
    return { isAvailable: true, message: "Produk reguler, selalu tersedia." };
  }

  const start = new Date(product.startDate!);
  const end = new Date(product.endDate!);
  
  if (now < start) {
    return { isAvailable: false, message: "Flash sale untuk produk ini belum dimulai." };
  }
  if (now >= end) {
    return { isAvailable: false, message: "Flash sale untuk produk ini sudah berakhir." };
  }

  const availableStock = product.limitedQuantity! - product.sold!;

  if (availableStock <= 0) {
    return { isAvailable: false, message: "Stok produk ini sudah habis." };
  }

  let quantityInCart = 0;
  const itemInCart = cartItems.find(item => item.product.id === productId);
  if (itemInCart) {
    quantityInCart = isUpdate ? 0 : itemInCart.quantity;
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

// --- Bids Functions ---
export function getBidsFromStorage(): any[] {
  return getFromStorage<any[]>('bids', []);
}

export function saveBidsToStorage(bids: any[]) {
  saveToStorage<any[]>('bids', bids);
}

// Initialize bids if not present
if (!getFromStorage<any[]>('bids', [])) {
  const initialBids = [
    { auctionId: 'auc_123', user: "Pengguna A", amount: 550000, date: new Date(Date.now() - 3600000) },
    { auctionId: 'auc_123', user: "Pengguna B", amount: 600000, date: new Date(Date.now() - 1800000) },
    { auctionId: 'auc_123', user: "Anda", amount: 750000, date: new Date(Date.now() - 600000) },
    { auctionId: 'auc_456', user: "Pengguna C", amount: 200000, date: new Date(Date.now() - 1200000) },
    { auctionId: 'auc_456', user: "Anda", amount: 250000, date: new Date(Date.now() - 300000) },
  ];
  saveBidsToStorage(initialBids);
}

// --- Auction Functions ---
export function getAuctionsFromStorage(): any[] {
  const auctions = getFromStorage<any[]>('auctions', []);
  // Ensure dates are converted back to Date objects
  return auctions.map((a: any) => ({
    ...a,
    startDate: new Date(a.startDate),
    endDate: new Date(a.endDate),
  }));
}

export const saveAuctionsToStorage = (auctions: any[]) => saveToStorage<any[]>('auctions', auctions);

export function getBidsForAuction(auctionId: string) {
  const bids = getBidsFromStorage();
  return [...bids]
    .filter(bid => bid.auctionId === auctionId)
    .sort((a, b) => b.amount - a.amount); // Sort by highest bid first
}

// Function to add a new bid
export function addBidToAuction(auctionId: string, user: string, amount: number) {
  const bids = getBidsFromStorage();

  const newBid = {
    auctionId,
    user,
    amount,
    date: new Date()
  };

  // Add the new bid to the storage
  const updatedBids = [...bids, newBid];
  saveBidsToStorage(updatedBids);

  // Update the auction's current bid and bid count
  const auctions = getAuctionsFromStorage();
  const auctionIndex = auctions.findIndex(a => a.id === auctionId);

  if (auctionIndex !== -1) {
    // Update current bid if this is the highest bid
    const highestBid = Math.max(amount, auctions[auctionIndex].currentBid || auctions[auctionIndex].minBid);

    auctions[auctionIndex] = {
      ...auctions[auctionIndex],
      currentBid: highestBid,
      bidCount: (auctions[auctionIndex].bidCount || 0) + 1
    };

    saveAuctionsToStorage(auctions);
  }

  return newBid;
}

export function getActiveAuctionProducts(): any[] {
  const auctions = getAuctionsFromStorage();
  const products = getProductsFromStorage();
  const now = new Date();

  const activeAuctions: any[] = [];

  auctions.forEach(auction => {
      const product = products.find(p => p.id === auction.productId);
      if (product) {
          const auctionStartDate = new Date(auction.startDate);
          const auctionEndDate = new Date(auction.endDate);
          if (now >= auctionStartDate && now < auctionEndDate) {
              // Get the highest bid for this auction
              const bids = getBidsForAuction(auction.id);
              const highestBid = bids.length > 0 ? bids[0].amount : auction.minBid;

              activeAuctions.push({
                  ...product,
                  ...auction,
                  currentBid: highestBid,
                  bidCount: bids.length,
              });
          }
      }
  });

  return activeAuctions;
}

export function getAuctionById(auctionId: string): any {
  const auctions = getAuctionsFromStorage();
  const auction = auctions.find(a => a.id === auctionId);

  if (auction) {
    const products = getProductsFromStorage();
    const product = products.find(p => p.id === auction.productId);

    // Get the highest bid for this auction
    const bids = getBidsForAuction(auctionId);
    const highestBid = bids.length > 0 ? bids[0].amount : auction.minBid;

    return {
      ...auction,
      currentBid: highestBid,
      bidCount: bids.length,
      bids: bids,
      product
    };
  }

  return null;
}

// Calculate shipping cost based on product weight (Client Side with CartItems)
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

// Async function to calculate shipping cost from database
export async function calculateShippingCostFromDatabase(
  products: {id: string, quantity: number}[],
  shippingCityId: string
) {
  // Import prisma here to avoid circular dependencies
  const prisma = (await import('@/lib/prisma')).default;

  // Find the shipping option for the destination city using cityId
  const shippingOption = await prisma.shippingOption.findFirst({
    where: {
      cityId: shippingCityId
    }
  });

  if (!shippingOption) {
    return 0; // No shipping option found
  }

  // Get products to calculate total weight
  // For now, we're still using localStorage for products, but this could be updated to use the database too
  const allProducts = getProductsFromStorage();
  let totalWeight = 0;

  products.forEach(item => {
    const product = allProducts.find((p: any) => p.id === item.id);
    if (product) {
      totalWeight += product.weight * item.quantity; // weight per item * quantity
    }
  });

  // Convert total weight from grams to kilograms
  const totalWeightInKg = totalWeight / 1000;

  // Calculate based on 1kg increments, rounding up
  const kgUnits = Math.ceil(totalWeightInKg);

  // Calculate final shipping cost
  return Number(shippingOption.cost) * kgUnits;
}

// Function to reduce product quantity when creating flashsale or auction
export function reserveProductQuantity(productId: string, reservedQuantity: number) {
  const products = getProductsFromStorage();
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex !== -1) {
    const product = products[productIndex];

    // Check if there's enough quantity available
    if (product.quantity < reservedQuantity) {
      throw new Error(`Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Required: ${reservedQuantity}`);
    }

    // Reduce the quantity
    products[productIndex] = {
      ...product,
      quantity: product.quantity - reservedQuantity
    };

    saveProductsToStorage(products);
    return true;
  }

  return false;
}

// Function to restore product quantity when flashsale or auction is cancelled/ended without selling
export function restoreProductQuantity(productId: string, restoredQuantity: number) {
  const products = getProductsFromStorage();
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex !== -1) {
    const product = products[productIndex];

    // Restore the quantity
    products[productIndex] = {
      ...product,
      quantity: product.quantity + restoredQuantity
    };

    saveProductsToStorage(products);
    return true;
  }

  return false;
}

// Function to update product quantity when flashsale is sold
export function updateSoldProductQuantity(productId: string, soldQuantity: number) {
  const products = getProductsFromStorage();
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex !== -1) {
    const product = products[productIndex];

    // Make sure we don't sell more than available
    if (product.quantity + soldQuantity < soldQuantity) {
      // This shouldn't happen under normal circumstances
      throw new Error(`Attempting to sell more than available for product ${product.name}`);
    }

    // Update the quantity (sold quantity is already reserved, so this just updates the count)
    products[productIndex] = {
      ...product,
      quantity: product.quantity - soldQuantity
    };

    saveProductsToStorage(products);
    return true;
  }

  return false;
}

// Function to check for expired flashsales and restore quantities for unsold items
export function processExpiredFlashSales(): number {
  const flashSales = getFlashSalesFromStorage();
  const now = new Date();

  let hasUpdates = false;
  let processedCount = 0;
  const processedFlashSales = flashSales.map(flashSale => {
    const endDate = new Date(flashSale.endDate);
    const isExpired = now >= endDate;

    // If flash sale has ended and is not sold out, restore the unsold quantity
    if (isExpired && flashSale.status !== 'sold-out') {
      const unsoldQuantity = flashSale.limitedQuantity - flashSale.sold;
      if (unsoldQuantity > 0) {
        restoreProductQuantity(flashSale.productId, unsoldQuantity);
        hasUpdates = true;
      }
      processedCount++;
      // Update status to ended
      return { ...flashSale, status: 'ended' };
    }

    return flashSale;
  });

  if (hasUpdates) {
    saveFlashSalesToStorage(processedFlashSales as FlashSale[]);
  }

  return processedCount;
}

// Function to check for expired auctions and restore quantities for unsold items
export function processExpiredAuctions(): number {
  const auctions = getAuctionsFromStorage();
  const now = new Date();

  let hasUpdates = false;
  let processedCount = 0;
  const processedAuctions = auctions.map(auction => {
    const endDate = new Date(auction.endDate);
    const isExpired = now >= endDate;

    // If auction has ended, process the results
    if (isExpired) {
      // Check if the auction was already marked as sold (through buy-now or checkout)
      if (auction.status === 'sold') {
        // Auction was already sold, no need to process further
        return auction;
      } else {
        processedCount++;
        // Auction ended without being sold, check if there were any bids
        const bids = getBidsForAuction(auction.id);
        if (bids.length > 0) {
          // There were bids, so mark as sold to the highest bidder
          // The highest bid is the first in the sorted list
          const highestBid = bids[0]; // Already sorted by getBidsForAuction

          // Mark the auction as sold
          hasUpdates = true;
          return { ...auction, status: 'sold', currentBid: highestBid.amount };
        } else {
          // No bids were placed, so restore the reserved quantity
          restoreProductQuantity(auction.productId, 1); // Auctions reserve 1 item
          hasUpdates = true;
          // Update status to ended
          return { ...auction, status: 'ended' };
        }
      }
    }

    return auction;
  });

  if (hasUpdates) {
    saveAuctionsToStorage(processedAuctions as Auction[]);
  }

  return processedCount;
}

// Function to run all expiration checks
export function processExpiredItems(): number {
  const flashSalesCount = processExpiredFlashSales();
  const auctionsCount = processExpiredAuctions();
  return flashSalesCount + auctionsCount;
}

// Function to restore quantities for cancelled orders
export function processCancelledOrders() {
  const orders: any[] = JSON.parse(localStorage.getItem('userOrders') || '[]');

  // Find orders that are cancelled, refunded, or expired
  const cancelledOrders = orders.filter(order =>
    order.status === 'Cancelled' ||
    order.status === 'Refund Required' ||
    order.status === 'Refund Processing' ||
    (order.expiresAt && new Date() > new Date(order.expiresAt))
  );

  if (cancelledOrders.length > 0) {
    // For each cancelled order, restore the quantities
    cancelledOrders.forEach(order => {
      order.items.forEach((item: any) => {
        // Only restore quantity if it was from a flash sale or auction
        if (item.product.flashSaleId) {
          // Restore to flash sale inventory
          const flashSales = JSON.parse(localStorage.getItem('flashSales') || '[]');
          const flashSale = flashSales.find((fs: any) => fs.id === item.product.flashSaleId);
          if (flashSale) {
            // Restore the quantity that was reserved/sold
            restoreProductQuantity(flashSale.productId, item.quantity);
          }
        } else if (item.product.auctionId) {
          // Restore to auction inventory (auctions are single items)
          restoreProductQuantity(item.product.id, item.quantity);
        } else {
          // For regular products, if order is cancelled, add back to inventory
          restoreProductQuantity(item.product.id, item.quantity);
        }
      });
    });
  }
}