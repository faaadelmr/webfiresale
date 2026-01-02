import type { Order } from './types';
import { NEXT_PUBLIC_APP_NAME } from "@/lib/app-config";

export async function printShippingLabel(order: Order) {
    // Fetch business settings for sender information
    let businessInfo = {
        name: NEXT_PUBLIC_APP_NAME,
        address: 'Alamat belum diatur',
        city: '',
        phone: '',
        email: '',
        logoUrl: ''
    };

    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const settings = await response.json();
            if (settings.businessAddress) {
                const addr = settings.businessAddress;
                businessInfo = {
                    name: addr.fullName || NEXT_PUBLIC_APP_NAME,
                    address: `${addr.street}${addr.rtRwBlock ? ', ' + addr.rtRwBlock : ''}`,
                    city: `${addr.village || ''}, ${addr.district || ''}, ${addr.city || ''}, ${addr.province || ''} ${addr.postalCode || ''}`.trim(),
                    phone: addr.phone || '',
                    email: settings.businessEmail || '',
                    logoUrl: settings.businessLogoUrl || ''
                };
            }
        }
    } catch (error) {
        console.error('Error fetching business settings:', error);
    }

    const fullAddress = order.address ? `${order.address.street}${order.address.rtRwBlock ? ', ' + order.address.rtRwBlock : ''}, ${order.address.village}` : '';
    const productList = order.items.map(item => `<li>${item.product.name} (x${item.quantity})</li>`).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Label Pengiriman - Order #${order.id}</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
              }
              .label-container {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  border: 2px solid #000;
                  padding: 15px;
              }
              .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 1px solid #ccc;
                  padding-bottom: 10px;
                  margin-bottom: 10px;
              }
              .header .logo {
                  display: flex;
                  align-items: center;
                  gap: 10px;
              }
              .header .logo img {
                  max-height: 50px;
                  max-width: 100px;
                  object-fit: contain;
              }
              .header .logo .company-name {
                  font-size: 24px;
                  font-weight: 700;
              }
              .header .order-id {
                  text-align: right;
              }
              .order-id h2 {
                  margin: 0;
                  font-size: 16px;
                  color: #555;
              }
              .order-id p {
                  margin: 0;
                  font-size: 18px;
                  font-weight: 600;
              }
              .address-section {
                  display: flex;
                  gap: 20px;
                  margin-bottom: 15px;
              }
              .address-box {
                  flex: 1;
              }
              .address-box h3 {
                  font-size: 14px;
                  color: #777;
                  margin: 0 0 5px 0;
                  text-transform: uppercase;
              }
              .address-box p {
                  margin: 2px 0;
                  font-size: 16px;
              }
              .address-box p.name {
                  font-weight: 600;
                  font-size: 18px;
              }
              .items-summary {
                   border-top: 1px solid #ccc;
                   padding-top: 10px;
              }
              .items-summary h3 {
                   font-size: 14px;
                   margin: 0 0 5px 0;
                   color: #777;
                   text-transform: uppercase;
              }
              .items-summary ul {
                  margin: 0;
                  padding-left: 20px;
                  font-size: 14px;
              }
          </style>
      </head>
      <body>
          <div class="label-container">
              <div class="header">
                  <div class="logo">
                      ${businessInfo.logoUrl ? `<img src="${businessInfo.logoUrl}" alt="Logo" />` : `<div class="company-name">${businessInfo.name}</div>`}
                  </div>
                  <div class="order-id">
                      <h2>Order ID</h2>
                      <p>#${order.id}</p>
                  </div>
              </div>
              <div class="address-section">
                  <div class="address-box">
                      <h3>Dari:</h3>
                      <p class="name">${businessInfo.name}</p>
                      <p>${businessInfo.address}</p>
                      <p>${businessInfo.city}</p>
                      ${businessInfo.phone ? `<p>Tel: ${businessInfo.phone}</p>` : ''}
                      ${businessInfo.email ? `<p>Email: ${businessInfo.email}</p>` : ''}
                  </div>
                  <div class="address-box">
                      <h3>Untuk:</h3>
                      <p class="name">${order.customerName}</p>
                      <p>${fullAddress || 'Alamat tidak tersedia'}</p>
                      <p>${order.address?.province || ''} ${order.address?.postalCode || ''}</p>
                      <p>Tel: ${order.customerPhone || ''}</p>
                  </div>
              </div>
              <div class="items-summary">
                  <h3>Isi Paket:</h3>
                  <ul>${productList}</ul>
              </div>
          </div>
          <script>
              window.onload = function() {
                 window.print();
                 window.close();
              }
          <\/script>
      </body>
      </html>
    `;
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
}
