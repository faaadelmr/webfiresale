import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import ProductList from '../components/ProductList';
import Link from 'next/link';

// Mock data - in a real application, this would come from the database
const mockProducts = [
  {
    id: 'prod1',
    name: 'Smartphone X',
    description: 'Smartphone terbaru dengan kamera triple dan prosesor generasi terbaru.',
    price: 2999.99,
    discountPrice: 1999.99,
    stock: 45,
    images: ['/placeholder.jpg'],
    category: 'Elektronik',
    isFlashSale: true,
    saleStartTime: new Date(Date.now() - 3600000), // Started 1 hour ago
    saleEndTime: new Date(Date.now() + 86400000), // Ends in 24 hours
    isActive: true,
  },
  {
    id: 'prod2',
    name: 'Headphone Nirkabel',
    description: 'Headphone dengan peredam kebisingan dan baterai tahan lama.',
    price: 899.99,
    discountPrice: 599.99,
    stock: 120,
    images: ['/placeholder.jpg'],
    category: 'Elektronik',
    isFlashSale: true,
    saleStartTime: new Date(Date.now() - 7200000), // Started 2 hours ago
    saleEndTime: new Date(Date.now() + 43200000), // Ends in 24 hours
    isActive: true,
  },
  {
    id: 'prod3',
    name: 'Kaos Premium',
    description: 'Kaos dari katun organik dengan desain eksklusif.',
    price: 129.99,
    stock: 200,
    images: ['/placeholder.jpg'],
    category: 'Pakaian',
    isFlashSale: false,
    saleStartTime: null,
    saleEndTime: null,
    isActive: true,
  },
];

const customerOrders = [
  {
    id: 'order1',
    status: 'DELIVERED',
    totalAmount: 2599.97,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    items: [
      { productId: 'prod1', productName: 'Smartphone X', quantity: 1, price: 1999.99 },
      { productId: 'prod2', productName: 'Headphone Nirkabel', quantity: 1, price: 599.98 },
    ],
  },
  {
    id: 'order2',
    status: 'SHIPPED',
    totalAmount: 129.99,
    createdAt: new Date(Date.now() - 43200000), // 12 hours ago
    items: [
      { productId: 'prod3', productName: 'Kaos Premium', quantity: 1, price: 129.99 },
    ],
  },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  // Show customer-friendly dashboard for CUSTOMER role
  if (session.user?.role === 'CUSTOMER') {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Selamat Datang di Dasbor, {session.user.name}!</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Lanjutkan Belanja</h2>
          <ProductList products={mockProducts} />
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Pesanan Terbaru Anda</h2>
            <Link href="/orders" className="text-indigo-400 hover:text-indigo-300">
              Lihat semua
            </Link>
          </div>
          
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
                {customerOrders.map((order) => (
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
                      <Link href={`/order-detail`} className="text-blue-400 hover:text-blue-300">
                        Detail
                      </Link>
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

  // Show admin/seller dashboard for other roles
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dasbor Flashfire</h1>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Produk Pilihan</h2>
        <ProductList products={mockProducts} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Produk</h3>
          <p className="text-3xl font-bold text-green-400">12</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Penjualan Hari Ini</h3>
          <p className="text-3xl font-bold text-green-400">Rp 4.500,00</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Produk Flash Sale</h3>
          <p className="text-3xl font-bold text-red-400">5</p>
        </div>
      </div>
    </div>
  );
}