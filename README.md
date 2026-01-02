# Web Fire Sale (WFS)

Platform E-commerce modern dengan performa tinggi yang dibangun menggunakan Next.js 14, Prisma, PostgreSQL (via Supabase), dan TailwindCSS. Fitur utamanya mencakup Flash Sale, Lelang, Reservasi Stok, dan Manajemen Pesanan otomatis.

## 🚀 Fitur Utama

*   **⚡ Flash Sales:** Penghitung waktu mundur, penanganan stok terbatas, dan ketersediaan real-time.
*   **🔨 Lelang (Auctions):** Sistem penawaran real-time dengan status yang diperbarui secara otomatis.
*   **🛒 Keranjang Canggih:** Sistem reservasi stok (FIFO) untuk mencegah penjualan melebihi stok.
*   **📦 Manajemen Pesanan:** Siklus pesanan lengkap (Menunggu -> Proses -> Dikirim -> Diterima/Dibatalkan).
*   **📄 Pembuatan PDF:** Pembuatan label pengiriman dan faktur otomatis menggunakan Puppeteer.
*   **🔍 Performa Optimal:** Pengindeksan wilayah untuk pencarian alamat instan dan caching API yang agresif.
*   **📱 Desain Responsif:** Pendekatan mobile-first menggunakan TailwindCSS dan DaisyUI.
*   **🔐 Panel Admin:** Dashboard komprehensif untuk mengelola produk, pesanan, dan pengguna.

## 🛠️ Tech Stack

*   **Framework:** Next.js 14 (App Router)
*   **Bahasa:** TypeScript
*   **Database:** PostgreSQL (Supabase)
*   **ORM:** Prisma
*   **Styling:** TailwindCSS, DaisyUI, Framer Motion
*   **Auth:** NextAuth.js
*   **Utilities:** Puppeteer (PDF), Decimal.js (Currency), Lucide React (Icons)

## ⚙️ Konfigurasi Environment (.env)

Buat file bernama `.env` di direktori root proyek dan isi dengan variabel berikut. Ganti nilai placeholder dengan kredensial Anda sendiri.

```env
# --- Konfigurasi Database ---
# URL koneksi untuk Prisma (Transaction pooling) - Didapatkan dari Supabase/Database Provider
POSTGRES_PRISMA_URL="postgres://..."

# URL koneksi langsung untuk migrasi (Non-pooling) - Didapatkan dari Supabase
POSTGRES_URL_NON_POOLING="postgres://..."

# --- Konfigurasi Aplikasi ---
# Nama aplikasi yang akan ditampilkan dan prefix untuk ID pesanan
NEXT_PUBLIC_APP_NAME="WebFiresale" (nama toko yang akan ditampilkan)

# --- Konfigurasi NextAuth ---
# Kunci rahasia untuk enkripsi sesi (Generate dengan command: openssl rand -base64 32 atau melalui website: https://auth-secret-gen.vercel.app/)
NEXTAUTH_SECRET="RAHASIA_ANDA_DISINI"

# URL dasar aplikasi (Ganti dengan domain website saat deploy)
NEXTAUTH_URL="http://localhost:3000"

# --- Konfigurasi Supabase ---
# Kunci publik untuk penggunaan di client-side (frontend)
NEXT_PUBLIC_SUPABASE_URL="https://id-proyek-anda.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="KUNCI_ANON_PUBLIK_ANDA"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="KUNCI_PUBLISHABLE_ANDA"

# Kunci privat untuk penggunaan di server-side (backend)
SUPABASE_URL="https://id-proyek-anda.supabase.co"
SUPABASE_ANON_KEY="KUNCI_ANON_ANDA"
SUPABASE_JWT_SECRET="RAHASIA_JWT_SUPABASE_ANDA"
SUPABASE_SERVICE_ROLE_KEY="KUNCI_SERVICE_ROLE_ANDA_(SANGAT_RAHASIA)"
SUPABASE_SECRET_KEY="KUNCI_RAHASIA_LAINNYA"
SUPABASE_PUBLISHABLE_KEY="KUNCI_PUBLISHABLE_ANDA"

# Mengaktifkan login dengan Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 🚀 Instalasi & Setup (Menuju Production)

Ikuti langkah-langkah berikut untuk menjalankan proyek mulai dari nol hingga tahap production.

### 1. Install Dependencies
Unduh semua pustaka yang diperlukan.
```bash
npm install
```

### 2. Setup Database
Pastikan file `.env` Anda sudah diisi dengan benar sebelum menjalankan perintah ini.

```bash
# Membuat Client Prisma (ORM)
npx prisma generate

# Sinkronisasi skema ke database (Ideal untuk development/prototyping)
npx prisma db push

# ATAU untuk migrasi production yang lebih aman (Disarankan untuk production)
# npx prisma migrate deploy

# Mengisi database dengan data awal (User Admin, Wilayah, dll)
npm run seed
```

### 3. Jalankan Server Development
Untuk menjalankan server lokal saat pengembangan.
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 4. Build untuk Production
Membuat versi aplikasi yang teroptimasi untuk production.

```bash
# Build aplikasi Next.js
npm run build

# Menjalankan server production
npm start
```

## 📜 Ringkasan Perintah Penting

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server development. |
| `npm run build` | Membuild aplikasi untuk production. |
| `npm run start` | Menjalankan server hasil build (production). |
| `npx prisma generate` | Regenerasi client Prisma (jalankan setelah mengubah schema). |
| `npx prisma db push` | Mendorong skema ke database (tanpa history migrasi). |
| `npm run seed` | Mengisi database dengan data default (seeding). |

## 🛡️ Akses Admin Default
Jika Anda menjalankan perintah `npm run seed`, akun admin berikut akan dibuat:
*   **Email:** `admin@example.com` (Simulasi, cek file `prisma/seed.ts` untuk detail)
*   **Password:** `admin123` (Cek file seed)

## 🤝 Kontribusi
1.  Clone repository ini.
2.  Buat branch fitur baru (`git checkout -b fitur-keren`).
3.  Commit perubahan Anda (`git commit -m 'Menambahkan fitur keren'`).
4.  Push ke branch tersebut (`git push origin fitur-keren`).
5.  Buat Pull Request.

---
