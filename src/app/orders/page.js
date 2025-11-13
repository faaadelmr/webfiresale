import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

// Mock data - in a real application, this would come from the database
const mockOrders = [
  {
    id: 'order1',
    status: 'DELIVERED',
    totalAmount: 2599.97,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    items: [
      { productId: 'prod1', productName: 'Smartphone X', quantity: 1, price: 1999.99 },
      { productId: 'prod2', productName: 'Fones de Ouvido Wireless', quantity: 1, price: 599.98 },
    ],
  },
  {
    id: 'order2',
    status: 'SHIPPED',
    totalAmount: 129.99,
    createdAt: new Date(Date.now() - 43200000), // 12 hours ago
    items: [
      { productId: 'prod3', productName: 'Camiseta Premium', quantity: 1, price: 129.99 },
    ],
  },
  {
    id: 'order3',
    status: 'PENDING',
    totalAmount: 1999.99,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    items: [
      { productId: 'prod4', productName: 'Tablet Pro', quantity: 1, price: 1499.99 },
      { productId: 'prod2', productName: 'Fones de Ouvido Wireless', quantity: 1, price: 500.00 },
    ],
  },
];

export default async function OrdersMainPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  // This page is accessible for all authenticated users
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Pesanan Saya</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">ID Pesanan</th>
                <th className="py-3 px-4 text-left">Tanggal</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Total</th>
                <th className="py-3 px-4 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4">#{order.id}</td>
                  <td className="py-3 px-4">{order.createdAt.toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded ${
                      order.status === 'DELIVERED' ? 'bg-green-900 text-green-300' :
                      order.status === 'SHIPPED' ? 'bg-blue-900 text-blue-300' :
                      order.status === 'PENDING' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {order.status === 'DELIVERED' ? 'Selesai' :
                       order.status === 'SHIPPED' ? 'Dikirim' :
                       order.status === 'PENDING' ? 'Diproses' : 'Dibatalkan'}
                    </span>
                  </td>
                  <td className="py-3 px-4">Rp{order.totalAmount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <a href={`/order-detail`} className="text-blue-400 hover:text-blue-300">
                      Detail
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}