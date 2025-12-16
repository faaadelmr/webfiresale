import { Order } from "@/lib/types";
import { PackageCheck, CreditCard, Clock, Warehouse, Truck, CheckCircle, AlertCircle } from "lucide-react";

export const getStatusSteps = (status: Order['status']) => [
    { name: "Pesanan Dibuat", icon: PackageCheck, isCompleted: true },
    {
        name: status === "Waiting for Confirmation" ? "Menunggu Konfirmasi" : status === 'Re-upload Required' ? 'Upload Ulang Ditolak' : "Pembayaran",
        icon: status === "Waiting for Confirmation" ? Clock : status === 'Re-upload Required' ? AlertCircle : CreditCard,
        isCompleted: !['Pending', 'Re-upload Required'].includes(status)
    },
    { name: "Proses", icon: Warehouse, isCompleted: ['Processing', 'Shipped', 'Delivered'].includes(status) },
    { name: "Pengiriman", icon: Truck, isCompleted: ['Shipped', 'Delivered'].includes(status) },
    { name: "Selesai", icon: CheckCircle, isCompleted: status === 'Delivered' },
];