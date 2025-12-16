

import { Header } from "@/components/header";
import { formatPrice } from "@/lib/utils";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import OrderDetailClient from "@/components/OrderDetailClient";
import { Order } from "@/lib/types";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // Return a page that tells the user they need to be logged in
    return (
      <div className="flex min-h-screen w-full flex-col bg-base-100">
        <Header />
        <div className="container mx-auto flex flex-1 items-center justify-center p-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
            <p className="text-base-content/70">Anda harus login untuk melihat detail pesanan.</p>
          </div>
        </div>
      </div>
    );
  }

  // Pass only the order ID to the client component
  // The client component will fetch the order data using the browser's fetch API
  return <OrderDetailClient initialOrder={null} orderId={id} />;
}
