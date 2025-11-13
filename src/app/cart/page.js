import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Mock cart data - in a real application, this would come from the database
const mockCartItems = [
  {
    id: 'item1',
    product: {
      id: 'prod1',
      name: 'Smartphone X',
      image: '/placeholder.jpg',
      price: 1999.99,
    },
    quantity: 1,
  },
  {
    id: 'item2',
    product: {
      id: 'prod2',
      name: 'Headphone Nirkabel',
      image: '/placeholder.jpg',
      price: 599.99,
    },
    quantity: 2,
  },
];

export default async function CartPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const subtotal = mockCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shipping = 39.90;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Keranjang Belanja</h1>
        
        {mockCartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-6">
                {mockCartItems.map((item) => (
                  <div key={item.id} className="flex items-center border-b border-gray-700 py-6 last:border-b-0">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded mr-6"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{item.product.name}</h3>
                      <p className="text-green-400 font-bold mt-1">Rp${item.product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-600 rounded">
                        <button className="px-3 py-1 text-gray-400 hover:text-white">-</button>
                        <span className="px-3 py-1">{item.quantity}</span>
                        <button className="px-3 py-1 text-gray-400 hover:text-white">+</button>
                      </div>
                      <button className="text-red-500 hover:text-red-400">
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 h-fit">
                <h2 className="text-xl font-bold mb-4">Ringkasan Pesanan</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim</span>
                    <span>Rp${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-bold">Rp${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Link 
                  href="/checkout" 
                  className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-center text-white py-3 rounded-lg font-bold transition-all duration-300"
                >
                  Selesaikan Pembelian
                </Link>
                
                <div className="mt-4 text-center text-sm text-gray-400">
                  Ongkos kirim dihitung saat checkout
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Keranjang Anda kosong</h2>
            <p className="text-gray-400 mb-6">Sepertinya Anda belum menambahkan item apa pun ke keranjang.</p>
            <Link 
              href="/" 
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-bold"
            >
              Lihat Produk
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}