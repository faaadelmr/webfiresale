

export type Review = {
  customerName: string;
  comment: string;
  rating: number; // Rating from 1 to 5
};

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  quantity: number; // Stock quantity for the product
  weight: number; // Weight of the product in grams
  hasReviewed?: boolean; // Whether the current user has reviewed this product
};

export type Auction = {
  id: string; // Unique ID for the auction instance
  productId: string; // Reference to the Product
  product?: Product; // Embedded product details for convenience
  minBid: number; // Minimum bid amount
  maxBid?: number; // Maximum buy-it-now price (optional)
  startDate: Date;
  endDate: Date;
  currentBid?: number; // Current highest bid
  bidCount: number; // Number of bids placed
  status: "upcoming" | "active" | "ended" | "sold";
};

export type FlashSale = {
  id: string; // Unique ID for the flash sale instance
  productId: string; // Reference to the Product
  product?: Product; // Embedded product details for convenience
  flashSalePrice: number;
  startDate: Date;
  endDate: Date;
  limitedQuantity: number;
  sold: number;
  status: "upcoming" | "active" | "ended" | "sold-out";
  maxOrderQuantity?: number;
};

// This will be the type used in the cart and order items.
// It can represent either a flash sale product or a regular product.
export type CartProduct = Product & {
  // Flash sale specific properties are optional
  flashSaleId?: string;
  flashSalePrice: number; // For regular products, this will be originalPrice
  maxOrderQuantity?: number;
  limitedQuantity?: number; // For regular products, this is not relevant
  sold?: number; // For regular products, this is not relevant
  startDate?: Date; // For regular products, this is not relevant
  endDate?: Date; // For regular products, this is not relevant
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

export type ShippingOption = {
  id: string;
  cityId: string;
  cost: number;
};

export type OrderStatus =
  'Pending'
  | 'Waiting for Confirmation'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Re-upload Required'
  | 'Refund Required'
  | 'Refund Required'
  | 'Refund Processing'
  | 'Refund Rejected';

export type RefundDetails = {
  reason: string;
  processedDate: Date;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  refundedDate?: Date;
  refundProof?: string; // URL or base64 string of the refund proof image
};

export type AddressDetails = {
  id: string; // Unique ID for each address
  fullName: string;
  phone: string;
  street: string;
  postalCode: string;
  rtRwBlock: string; // RT/RW/Blok
  label: 'Rumah' | 'Kantor' | 'Apartemen';
  notes?: string;

  provinceId: string;
  cityId: string;
  districtId: string;
  villageId: string;

  province: string;
  city: string; // The full city name
  district: string; // The full district name
  village: string; // The full village name

  isPrimary?: boolean;
}

export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: Date;
  status: OrderStatus;
  total: number;
  items: CartItem[];
  address: AddressDetails;
  shippingCity?: string;
  shippingCost?: number;
  shippingCode?: string; // Tracking number
  shippingName?: string; // Courier service name
  paymentProof?: string; // URL or identifier for the payment proof image
  refundDetails?: RefundDetails;
  expiresAt?: Date;
  voucherId?: string;
  voucherCode?: string; // For passing code during creation
  discount?: number; // Discount amount applied
};

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export type Voucher = {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue?: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usagePerUser?: number;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  flashSaleOnly: boolean;
  auctionOnly: boolean;
  regularOnly: boolean;
  usageCount?: number; // From relation aggregation
  orderCount?: number; // From relation aggregation
  statusText?: string;
};

export type VoucherValidationResult = {
  valid: boolean;
  message?: string;
  voucher?: Voucher;
  discount?: number;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type AccountSettings = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type GeneralSettings = {
  bannerEnabled: boolean;
  bannerImage?: string;
  paymentTimeLimit?: number; // In minutes
  businessAddress?: BusinessAddress;
  businessEmail?: string;
  businessLogoUrl?: string;
  printSize?: PrintSize;
  theme?: string;
  heroTagline?: string;
  heroSubtitle?: string;
};

export type BusinessAddress = {
  fullName: string;
  phone: string;
  street: string;
  postalCode: string;
  rtRwBlock: string; // RT/RW/Blok
  provinceId: string;
  cityId: string;
  districtId: string;
  villageId: string;
  province: string;
  city: string; // The full city name
  district: string; // The full district name
  village: string; // The full village name
  notes?: string;
};

export type PrintSize = 'a4' | 'a5' | 'a6' | 'letter' | 'custom';

export type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
};

export interface Region {
  id: string;
  name: string;
}

export interface Province extends Region { }

export interface City extends Region {
  provinceId: string;
}

export interface District extends Region {
  cityId: string;
}

export interface Village extends Region {
  districtId: string;
}
