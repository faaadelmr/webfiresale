import { Metadata } from 'next';
import VouchersClient from './VouchersClient';

export const metadata: Metadata = {
    title: 'Manajemen Voucher - Admin WebFireSale',
    description: 'Kelola voucher dan kode diskon',
};

export default function VouchersPage() {
    return <VouchersClient />;
}
