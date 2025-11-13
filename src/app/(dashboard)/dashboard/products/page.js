import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import ProductList from '../../components/ProductList';

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
  {
    id: 'prod4',
    name: 'Tablet Pro',
    description: 'Tablet dengan layar resolusi tinggi dan stylus terincluded.',
    price: 1999.99,
    discountPrice: 1499.99,
    stock: 30,
    images: ['/placeholder.jpg'],
    category: 'Elektronik',
    isFlashSale: true,
    saleStartTime: new Date(Date.now() - 1800000), // Started 30 minutes ago
    saleEndTime: new Date(Date.now() + 3600000), // Ends in 1 hour
    isActive: true,
  },
];

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  // Redirect customers away from this page
  if (session.user?.role === 'CUSTOMER') {
    redirect('/');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Produk Saya</h1>
      <ProductList products={mockProducts} />
    </div>
  );
}