import type { Order, ShippingOption, FlashSale } from './types';

const now = new Date();

export const mockProducts: FlashSale[] = [
  {
    id: 'fs_1721289600000',
    productId: 'prod_1721289600000',
    product: {
      id: 'prod_1721289600000',
      name: 'Bakso Mercon',
      description: 'Bakso pedas dengan isian cabai rawit yang menggugah selera. Stok terbatas!',
      image: 'https://picsum.photos/seed/bakso/600/400',
      originalPrice: 25000,
      quantity: 100,
      weight: 100,
    },
    flashSalePrice: 15000,
    startDate: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    endDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
    limitedQuantity: 100,
    sold: 15,
    status: 'active',
    maxOrderQuantity: 5,
  },
  {
    id: 'fs_1721289700000',
    productId: 'prod_1721289700000',
    product: {
      id: 'prod_1721289700000',
      name: 'Dimsum Premium',
      description: 'Dimsum lezat berisi udang dan ayam pilihan. Dapatkan selagi masih ada!',
      image: 'https://picsum.photos/seed/dimsum/600/400',
      originalPrice: 30000,
      quantity: 150,
      weight: 100,
    },
    flashSalePrice: 20000,
    startDate: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    endDate: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours from now
    limitedQuantity: 150,
    sold: 30,
    status: 'active',
    maxOrderQuantity: 10,
  },
];


export const mockShippingOptions: ShippingOption[] = [
    { id: 'ship-1', cityId: 'jakarta-1', cost: 10000 },
    { id: 'ship-2', cityId: 'bandung-1', cost: 15000 },
    { id: 'ship-3', cityId: 'surabaya-1', cost: 20000 },
];

export let mockOrders: Order[] = [];

// Function to update mockOrders in localStorage if needed
export const saveOrders = (orders: Order[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mockOrders', JSON.stringify(orders));
    mockOrders = orders;
  }
};
