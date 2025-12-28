import type { Order, OrderStatus, ValidationResult } from './types';

// Centralized order status definitions
export const ORDER_STATUS_STANDARD: {
  statusColors: Record<OrderStatus, string>;
} = {
  statusColors: {
    'Pending': 'bg-gray-200 text-gray-800',
    'Waiting for Confirmation': 'bg-yellow-200 text-yellow-800',
    'Processing': 'bg-blue-200 text-blue-800',
    'Shipped': 'bg-indigo-200 text-indigo-800',
    'Delivered': 'bg-green-200 text-green-800',
    'Cancelled': 'bg-red-200 text-red-800',
    'Re-upload Required': 'bg-red-300 text-red-900',
    'Refund Required': 'bg-orange-200 text-orange-800',
    'Refund Processing': 'bg-orange-300 text-orange-900',
    'Refund Rejected': 'bg-red-200 text-red-900',
  },
};

// Example validation function (can be expanded)
export const validateOrder = (order: Order): ValidationResult => {
  const errors: string[] = [];

  if (order.total <= 0) {
    errors.push('Total pesanan harus lebih besar dari nol.');
  }

  if (order.items.length === 0) {
    errors.push('Pesanan harus memiliki setidaknya satu item.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
