'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Mock data - in a real app, this would come from an API call
const mockOrder = {
  id: 'order123',
  status: 'SHIPPED',
  totalAmount: 2599.97,
  createdAt: new Date(Date.now() - 86400000), // 1 day ago
  shippingAddress: 'Jl. Contoh, 123 - Jakarta, Indonesia',
  items: [
    {
      id: 'item1',
      product: {
        id: 'prod1',
        name: 'Smartphone X',
        image: '/placeholder.jpg',
      },
      quantity: 1,
      price: 1999.99,
    },
    {
      id: 'item2',
      product: {
        id: 'prod2',
        name: 'Headphone Nirkabel',
        image: '/placeholder.jpg',
      },
      quantity: 1,
      price: 599.98,
    },
  ],
  shippingInfo: {
    carrier: 'JNE',
    trackingNumber: 'ID123456789ID',
    estimatedDelivery: new Date(Date.now() + 259200000), // 3 days from now
  }
};

export default function OrderDetailPage() {
  const { id } = useParams(); // In a real app, we would use the actual order ID
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // In a real app, we would fetch the specific order based on the ID
    setOrder(mockOrder);
  }, [id]);

  if (!order) {
    return <div>Memuat...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Detail Pesanan #{order.id}</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Status: 
              <span className={`ml-2 px-2 py-1 rounded ${
                order.status === 'DELIVERED' ? 'bg-green-900 text-green-300' :
                order.status === 'SHIPPED' ? 'bg-blue-900 text-blue-300' :
                order.status === 'PENDING' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>
                {order.status === 'DELIVERED' ? 'Selesai' :
                 order.status === 'SHIPPED' ? 'Dikirim' :
                 order.status === 'PENDING' ? 'Diproses' : 'Dibatalkan'}
              </span>
            </h2>
            <p className="text-gray-400">Tanggal Pesanan: {order.createdAt.toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">Rp{order.totalAmount.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Alamat Pengiriman</h3>
          <p>{order.shippingAddress}</p>
        </div>
        
        {order.shippingInfo && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Informasi Pengiriman</h3>
            <p><span className="font-medium">Kurir:</span> {order.shippingInfo.carrier}</p>
            <p><span className="font-medium">Nomor Resi:</span> {order.shippingInfo.trackingNumber}</p>
            <p><span className="font-medium">Perkiraan Sampai:</span> {order.shippingInfo.estimatedDelivery.toLocaleDateString()}</p>
          </div>
        )}
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Item Pesanan</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center border-b border-gray-700 pb-4">
              <img 
                src={item.product.image} 
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded mr-4"
              />
              <div className="flex-1">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-gray-400">Jumlah: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Rp{item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}