# NusaMarket — E-Commerce Microservices

Proyek Kelompok VI untuk mata kuliah INF300 Rekayasa Perangkat Lunak. Repository ini berisi aplikasi e-commerce dengan frontend pembeli/admin, API Gateway, dan backend microservices.

## Teknologi

- Frontend: React 18, Vite, CSS responsif
- Backend: Node.js, Express, REST API
- Database: PostgreSQL 16 (database terpisah untuk setiap service)
- Message Broker: RabbitMQ (event `order.created` dari Order Service ke Payment Service)
- Autentikasi: JWT dan bcrypt
- Container: Docker Compose dan Nginx

## Fitur aplikasi

### Pembeli
- Melihat katalog, kategori, pencarian, dan detail produk.
- Registrasi dan login.
- Menambahkan produk ke keranjang dan mengubah jumlah item.
- Checkout dan membuat pesanan.
- Membuat instruksi pembayaran simulasi.
- Melihat riwayat serta status pesanan.

### Admin
- Dashboard ringkasan katalog dan transaksi.
- Menambah, mengubah, dan menghapus produk.
- Memantau pesanan.
- Mengonfirmasi pembayaran simulasi.
- Memperbarui status pesanan sesuai alur yang diizinkan backend.

### Backend services

| Komponen | Port lokal | Tanggung jawab |
|---|---:|---|
| Frontend | 8080 | Antarmuka pembeli dan admin |
| API Gateway | 3000 | Satu pintu masuk API |
| User Service | 3001 | Registrasi, login, profil, JWT |
| Product Service | 3002 | Katalog, CRUD, dan reservasi stok |
| Order Service | 3003 | Checkout, pesanan, status pesanan |
| Payment Service | 3004 | Pencatatan pembayaran simulasi dan consumer event order |
| User DB | 5433 | Database pengguna |
| Product DB | 5434 | Database produk |
| Order DB | 5435 | Database pesanan |
| Payment DB | 5436 | Database pembayaran dan event order |
| RabbitMQ | 5672 | Message broker untuk event asinkron |

## Menjalankan proyek dengan Docker Desktop

1. Ekstrak repository dan buka terminal pada folder utama yang berisi `docker-compose.yml`.
2. Pastikan Docker Desktop sudah berjalan.
3. Buat file `.env` dari `.env.example` dengan perintah `copy .env.example .env`, lalu ganti seluruh password dan token placeholder. Jangan unggah file `.env` ke GitHub.
4. Jalankan:

   ```bash
   docker compose up --build -d
   ```

5. Periksa container:

   ```bash
   docker compose ps
   ```

6. Buka aplikasi:

   - Website: http://localhost:8080
   - API Gateway health: http://localhost:3000/health
   - User Service health: http://localhost:3001/health
   - Product Service health: http://localhost:3002/health
   - Order Service health: http://localhost:3003/health
   - Payment Service health: http://localhost:3004/health
   - RabbitMQ Management: http://localhost:15672

Compose menjalankan RabbitMQ dan `product-seed` untuk mengisi contoh katalog. Script aman dijalankan berulang kali: produk contoh yang sudah ada tidak dibuat duplikat. Data database tetap disimpan pada Docker volumes.

Order Service memublikasikan event `order.created` ke RabbitMQ setelah order berhasil disimpan. Payment Service mengonsumsi event tersebut dan mencatatnya pada tabel `payment_order_events`. Alur transaksi utama tetap menggunakan REST API.

Untuk melihat log:

```bash
docker compose logs -f frontend api-gateway
```

Untuk menghentikan aplikasi tanpa menghapus data:

```bash
docker compose down
```

Jangan gunakan `docker compose down -v` kecuali memang ingin menghapus seluruh data database.

## Membuat akun admin

Registrasi dari website selalu membuat akun dengan role `buyer`. Untuk memberikan akses admin:

1. Daftar melalui website di http://localhost:8080.
2. Jalankan perintah berikut dari terminal pada folder proyek, ganti email dengan email akun yang baru dibuat:

   ```bash
   docker compose exec user-db psql -U ecommerce_user -d ecommerce_user_db -c "UPDATE users SET role = 'admin' WHERE email = 'admin@contoh.com';"
   ```

3. Keluar dari website lalu login kembali agar JWT baru memuat role `admin`.
4. Menu **Admin** akan muncul di bagian navigasi.

Jangan mengubah endpoint registrasi publik agar menerima role admin dari input pengguna.

## Alur transaksi

1. Pembeli memilih produk dan memasukkannya ke keranjang.
2. Pembeli login lalu checkout.
3. Order Service meminta Product Service mereservasi stok.
4. Order Service menyimpan pesanan dengan status `PENDING_PAYMENT`.
5. Frontend membuat catatan pembayaran melalui Payment Service.
6. Admin mengonfirmasi pembayaran simulasi. Payment Service meminta Order Service mengubah status menjadi `PAID`.
7. Admin dapat melanjutkan status pesanan: `PROCESSING` → `SHIPPED` → `COMPLETED`.

Pembayaran pada proyek ini merupakan simulasi akademik. Tidak ada koneksi ke bank, kartu, atau payment gateway sungguhan. Pemilihan metode pembayaran hanya mencatat metode yang dipilih.

## Endpoint utama

Semua endpoint berikut diakses melalui API Gateway `http://localhost:3000`.

### User Service

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/users/register` | Registrasi pembeli |
| POST | `/users/login` | Login dan memperoleh JWT |
| GET | `/users/me` | Profil akun aktif |

Contoh body registrasi:

```json
{
  "name": "Nama Pembeli",
  "email": "pembeli@example.com",
  "password": "password123"
}
```

### Product Service

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/products` | Daftar produk; mendukung `search`, `category`, `page`, `limit` |
| GET | `/products/:id` | Detail produk |
| POST | `/products` | Tambah produk (admin) |
| PUT | `/products/:id` | Ubah produk (admin) |
| DELETE | `/products/:id` | Hapus produk (admin) |

### Order Service

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/orders` | Membuat pesanan (login) |
| GET | `/orders` | Daftar pesanan milik akun; admin dapat melihat semua |
| GET | `/orders/:id` | Detail pesanan |
| PUT | `/orders/:id/status` | Mengubah status (admin) |

Contoh body pembuatan pesanan:

```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

### Payment Service

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/payments` | Membuat catatan pembayaran (login) |
| GET | `/payments/:id` | Melihat pembayaran |
| GET | `/payments/order/:orderId` | Melihat pembayaran berdasarkan pesanan |
| POST | `/payments/:id/confirm` | Konfirmasi pembayaran simulasi (admin) |

Metode pembayaran yang diterima: `BANK_TRANSFER`, `E_WALLET`, `CREDIT_CARD`.

## Pengembangan frontend secara lokal (opsional)

Jika ingin menjalankan Vite tanpa container, buka terminal pada folder `frontend`:

```bash
npm install
npm run dev
```

Vite berjalan pada `http://localhost:5173`. Backend harus tetap berjalan dan origin tersebut sudah diizinkan oleh konfigurasi CORS.

## Struktur repository

```text
.
├── frontend/             # React + Vite + Nginx
├── api-gateway/          # Routing request dari browser
├── user-service/         # Autentikasi dan profil
├── product-service/      # Katalog dan stok
├── order-service/        # Checkout dan pesanan
├── payment-service/      # Pembayaran simulasi
├── docker-compose.yml
├── .env                  # Secret lokal, jangan commit
└── .env.example          # Template tanpa secret asli
```

## Keamanan dan batasan prototipe

- File `.env` dibuat secara lokal dari `.env.example`, diabaikan oleh `.gitignore`, dan tidak boleh di-commit atau diunggah ke GitHub.
- Registrasi publik hanya membuat role `buyer`; operasi administratif memerlukan JWT dengan role `admin`.
- Internal service token tidak pernah digunakan oleh frontend.
- Password pengguna disimpan dalam bentuk hash.
- Pembayaran belum terhubung dengan penyedia pembayaran sungguhan.
- RabbitMQ digunakan untuk event notifikasi order, bukan untuk menggantikan REST API pada transaksi utama.
- Gambar katalog frontend saat ini ditentukan berdasarkan kategori produk, karena model data Product Service belum menyimpan URL gambar.
- Proyek ini adalah prototipe akademik, bukan aplikasi produksi. Deployment publik memerlukan penguatan keamanan, HTTPS, audit log, monitoring, backup, dan pengujian tambahan.


## Deployment cloud gratis untuk UAS

Panduan deployment tersedia di [`deploy/README.md`](deploy/README.md). Rancangan menggunakan Vercel untuk frontend, satu Docker Web Service Render untuk backend, Neon untuk empat database PostgreSQL, dan CloudAMQP untuk RabbitMQ. Seluruh layanan menggunakan free tier dengan batasan yang dijelaskan pada panduan tersebut.

Checklist pengujian API dan UAT tersedia di [`docs/TEST-PLAN-UAS.md`](docs/TEST-PLAN-UAS.md). Pemetaan progres Minggu 1–16 tersedia di [`docs/WEEK-16-CHECKLIST.md`](docs/WEEK-16-CHECKLIST.md). Isi hasil aktual hanya setelah pengujian dijalankan.
