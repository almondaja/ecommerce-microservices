# NusaMarket — E-Commerce Microservices

NusaMarket adalah aplikasi e-commerce untuk proyek Kelompok VI mata kuliah INF300 Rekayasa Perangkat Lunak. Proyek ini memperagakan katalog produk, akun pembeli dan admin, keranjang, checkout, order, dan pembayaran simulasi menggunakan arsitektur microservices.

> **Status proyek:** stack Docker lokal dan smoke test API telah diverifikasi pada 25 November 2026. UAT manual, seluruh skenario transaksi, deployment cloud publik, bukti presentasi, dan laporan akhir tetap perlu diselesaikan. Lihat [status Minggu 1–16](docs/WEEK-16-CHECKLIST.md) dan [test plan/UAT](docs/TEST-PLAN-UAS.md).

## Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Arsitektur](#arsitektur)
- [Menjalankan aplikasi lokal](#menjalankan-aplikasi-lokal)
- [Membuat akun admin](#membuat-akun-admin)
- [Cara menggunakan aplikasi](#cara-menggunakan-aplikasi)
- [Alur transaksi](#alur-transaksi)
- [Endpoint API](#endpoint-api)
- [Pengujian](#pengujian)
- [Troubleshooting](#troubleshooting)
- [Panduan presentasi](#panduan-presentasi)
- [Batasan dan keamanan](#batasan-dan-keamanan)
- [Deployment gratis](#deployment-gratis)

## Fitur

### Pembeli

- Melihat katalog, kategori, detail, dan pencarian produk.
- Membuat akun pembeli dan login.
- Menambahkan produk ke keranjang serta mengubah kuantitas.
- Checkout dengan data stok dan harga dari backend.
- Memilih metode pembayaran simulasi.
- Melihat pesanan dan statusnya.

### Admin

- Melihat dashboard ringkasan produk dan transaksi.
- Membuat, mengubah, dan menghapus produk.
- Melihat pesanan.
- Mengonfirmasi pembayaran simulasi.
- Mengubah status pesanan mengikuti transisi yang diizinkan.

### Integrasi backend

- API Gateway menjadi satu-satunya entry point HTTP yang digunakan frontend.
- Order Service meminta Product Service mereservasi stok saat checkout.
- Database PostgreSQL dipisahkan per domain service.
- Order Service mengirim event `order.created` melalui AMQP; Payment Service menerimanya dan menyimpan event untuk audit.
- Operasi order dan konfirmasi pembayaran tetap menggunakan REST untuk respons langsung.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | React, Vite, CSS responsif |
| HTTP/API | Node.js, Express, REST, API Gateway |
| Database | PostgreSQL 16, satu database per service |
| Autentikasi | JWT dan bcrypt |
| Messaging | RabbitMQ lokal; AMQP untuk event order |
| Container lokal | Docker, Docker Compose, Nginx |

## Arsitektur

```text
Browser
  |
  +-- Website React/Nginx :8080
         |
         +-- API Gateway :3000
                +-- User Service :3001 ---- User PostgreSQL :5433
                +-- Product Service :3002 - Product PostgreSQL :5434
                +-- Order Service :3003 --- Order PostgreSQL :5435
                |       +-- REST ke Product Service untuk reservasi stok
                |       +-- event order.created ke RabbitMQ :5672
                +-- Payment Service :3004 - Payment PostgreSQL :5436
                        +-- event consumer dari RabbitMQ
                        +-- REST internal ke Order Service untuk konfirmasi
```

Setiap service memiliki tanggung jawab dan database sendiri. Browser tidak mengakses database atau endpoint internal secara langsung. API Gateway meneruskan endpoint publik `/users`, `/products`, `/orders`, dan `/payments` ke service terkait.

| Komponen | Port lokal | Tanggung jawab |
|---|---:|---|
| Frontend | 8080 | Antarmuka pembeli dan admin |
| API Gateway | 3000 | Routing API, CORS, liveness dan readiness |
| User Service | 3001 | Registrasi, login, profil, JWT |
| Product Service | 3002 | Katalog, CRUD produk, reservasi/pengembalian stok |
| Order Service | 3003 | Checkout, order, item dan status |
| Payment Service | 3004 | Pembayaran simulasi dan event order |
| User DB | 5433 | Data pengguna |
| Product DB | 5434 | Produk dan stok |
| Order DB | 5435 | Pesanan dan item pesanan |
| Payment DB | 5436 | Pembayaran dan event order yang diterima |
| RabbitMQ lokal | 5672 | Broker event; dashboard lokal di 15672 |

## Menjalankan aplikasi lokal

### Persiapan

1. Pasang dan jalankan Docker Desktop.
2. Buka PowerShell pada direktori utama repository, yaitu direktori yang berisi `docker-compose.yml`.
3. Buat konfigurasi lokal:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Buka `.env` dan ganti nilai placeholder secret/password lokal. Jangan commit atau mengirim file `.env`.

### Menyalakan seluruh stack

```powershell
docker compose up --build -d
docker compose ps
```

Compose menyiapkan PostgreSQL untuk empat service, RabbitMQ, service backend, API Gateway, frontend, dan proses pengisian katalog contoh (`product-seed`). Data database disimpan di Docker volumes sehingga tetap ada setelah container dihentikan.

Buka:

- Website: <http://localhost:8080>
- API Gateway liveness: <http://localhost:3000/health/live>
- API Gateway readiness: <http://localhost:3000/health>
- RabbitMQ Management lokal: <http://localhost:15672>

Gunakan username/password RabbitMQ yang diatur pada `.env` (`RABBITMQ_USER` dan `RABBITMQ_PASSWORD`).

Periksa kesiapan seluruh service:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 5
```

Hasil sehat memiliki `status: online` dan `user`, `product`, `order`, `payment` masing-masing `online`.

### Log, restart, dan berhenti

```powershell
# Ikuti log semua service
docker compose logs -f

# Log service tertentu
docker compose logs -f api-gateway order-service payment-service

# Restart setelah perubahan .env atau konfigurasi Compose
docker compose up --build -d

# Hentikan container, pertahankan data volume
docker compose down
```

`docker compose down -v` menghapus volume database dan seluruh data lokal. Jalankan hanya jika memang ingin menghapus data dan mulai dari database kosong.

### Frontend dengan Vite (opsional)

Untuk mengembangkan frontend langsung di host, biarkan backend Docker tetap berjalan lalu buka PowerShell kedua:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Buka URL yang ditampilkan Vite, biasanya <http://localhost:5173>. `VITE_API_BASE_URL` dapat diatur di `frontend/.env` dan harus menunjuk ke `http://localhost:3000`. Perubahan variabel `VITE_` diterapkan ketika Vite/build dijalankan ulang.

## Membuat akun admin

Registrasi dari website selalu membuat akun dengan role `buyer`. Ini disengaja agar pengguna publik tidak dapat memberi dirinya sendiri hak admin.

1. Daftarkan akun dari website.
2. Promosikan hanya akun milik tim melalui PostgreSQL lokal. Ganti email contoh dengan email akun yang didaftarkan:

   ```powershell
   docker compose exec user-db psql -U ecommerce_user -d ecommerce_user_db -c "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';"
   ```

3. Pastikan query mengubah tepat satu akun:

   ```powershell
   docker compose exec user-db psql -U ecommerce_user -d ecommerce_user_db -c "SELECT id, email, role FROM users WHERE email = 'admin@example.com';"
   ```

4. Logout dari website dan login kembali. JWT yang baru akan memuat role admin; menu **Admin** akan muncul.

Untuk deployment dengan Neon, lakukan `UPDATE users ...` yang sama pada SQL Editor database `ecommerce_user_db`. Jangan membuat endpoint registrasi publik yang menerima `role=admin`.

## Cara menggunakan aplikasi

### Sebagai pembeli

1. Buka website lalu pilih **Masuk** → **Daftar** jika belum memiliki akun.
2. Setelah login, cari produk atau pilih kategori pada katalog.
3. Buka detail produk, tambahkan ke keranjang, dan atur jumlah item.
4. Buka keranjang, pilih metode pembayaran simulasi, lalu checkout.
5. Buka **Pesanan Saya** untuk melihat pesanan dan statusnya.
6. Pembayaran tidak benar-benar menagih rekening/kartu. Ini adalah alur demonstrasi.

### Sebagai admin

1. Pastikan akun sudah dipromosikan menjadi admin dan login ulang.
2. Buka menu **Admin**.
3. Gunakan panel produk untuk membuat, mengedit, atau menghapus produk.
4. Periksa pesanan dan pembayaran yang dibuat pembeli.
5. Konfirmasi pembayaran simulasi.
6. Lanjutkan status pesanan sesuai urutan yang diterima backend: `PAID` → `PROCESSING` → `SHIPPED` → `COMPLETED`.

## Alur transaksi

1. Pembeli memilih produk; harga dan stok katalog berasal dari Product Service.
2. Saat checkout, Order Service meminta Product Service mereservasi stok.
3. Jika reservasi salah satu item gagal, reservasi yang sudah dilakukan untuk item sebelumnya dikembalikan.
4. Order Service menyimpan order dan item secara transaksional dengan status awal `PENDING_PAYMENT`.
5. Order Service menerbitkan event `order.created`; Payment Service menerima event dan mencatatnya pada `payment_order_events`.
6. Pembeli membuat instruksi pembayaran simulasi melalui Payment Service.
7. Admin mengonfirmasi pembayaran. Payment Service menghubungi endpoint internal Order Service; order berubah menjadi `PAID`.
8. Admin mengubah status lanjutan secara berurutan: `PROCESSING`, `SHIPPED`, lalu `COMPLETED`.
9. Jika order `PENDING_PAYMENT` dibatalkan oleh admin, stok yang dipesan dikembalikan.

## Endpoint API

Semua endpoint publik di bawah ini diakses melalui `http://localhost:3000`. Endpoint terproteksi memerlukan header `Authorization: Bearer <JWT>`.

### User Service

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/users/register` | Publik | Daftar sebagai buyer |
| POST | `/users/login` | Publik | Login dan memperoleh JWT |
| GET | `/users/me` | Login | Profil akun aktif |

Contoh body registrasi:

```json
{
  "name": "Nama Pembeli",
  "email": "pembeli@example.com",
  "password": "password123"
}
```

### Product Service

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/products` | Publik | Katalog; mendukung `search`, `category`, `page`, `limit` |
| GET | `/products/:id` | Publik | Detail produk |
| POST | `/products` | Admin | Membuat produk |
| PUT | `/products/:id` | Admin | Memperbarui produk |
| DELETE | `/products/:id` | Admin | Menghapus produk |

### Order Service

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/orders` | Login | Checkout dan membuat pesanan |
| GET | `/orders` | Login | Pesanan milik akun; admin dapat melihat semua |
| GET | `/orders/:id` | Pemilik/admin | Detail pesanan |
| PUT | `/orders/:id/status` | Admin | Transisi status pesanan yang diizinkan |

Contoh body checkout:

```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

### Payment Service

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/payments` | Login | Membuat instruksi pembayaran untuk order milik sendiri |
| GET | `/payments/:id` | Pemilik/admin | Melihat pembayaran |
| GET | `/payments/order/:orderId` | Pemilik/admin | Melihat pembayaran berdasarkan order |
| POST | `/payments/:id/confirm` | Admin | Konfirmasi pembayaran simulasi |

Metode pembayaran yang diterima: `BANK_TRANSFER`, `E_WALLET`, `CREDIT_CARD`.

## Pengujian

Jalankan setelah stack Docker hidup:

```powershell
node scripts/system-smoke-test.js
```

Smoke test memverifikasi liveness/readiness Gateway, registrasi, login, penolakan email duplikat/password salah, perlindungan profil, katalog publik, larangan buyer membuat produk, dan 404 untuk path tak dikenal. Test membuat satu akun buyer unik berawalan `smoke-` pada database lokal setiap kali dijalankan.

Build frontend secara terpisah:

```powershell
Set-Location frontend
npm ci
npm run build
```

Smoke test bukan pengganti UAT browser dan seluruh integration test transaksi. Isi hasil aktual dan lampirkan bukti pada [test plan/UAT](docs/TEST-PLAN-UAS.md); jangan menandai skenario lulus sebelum dijalankan.

## Troubleshooting

| Gejala | Pemeriksaan/tindakan |
|---|---|
| Website/API tidak bisa dibuka | Pastikan Docker Desktop aktif dan jalankan `docker compose ps`. |
| Ada service berhenti/restarting | Lihat `docker compose logs --tail 100 <nama-service>`. |
| Gateway `/health` degraded | Lihat log empat backend; periksa service dan database terkait sudah healthy. |
| Login berhasil tetapi menu Admin tidak ada | Pastikan role di database `admin`, logout, lalu login lagi agar JWT diperbarui. |
| Password database tidak cocok setelah mengubah `.env` | Environment Postgres hanya diterapkan saat volume pertama dibuat. Jangan hapus volume data penting; atur password database/Compose dengan terencana. |
| Katalog kosong | Periksa `product-seed` dan `product-db`: `docker compose logs product-seed product-db`. |
| Smoke test gagal pada koneksi | Pastikan `/health` mengembalikan semua service online sebelum menjalankan test. |
| Port lokal sudah digunakan | Ubah port host yang dipetakan pada `docker-compose.yml`, lalu jalankan ulang Compose; jangan mengubah port internal tanpa menyesuaikan service. |

## Panduan presentasi

### Alur demo 5–7 menit

1. **Masalah dan tujuan (30–45 detik):** jelaskan bahwa aplikasi mendemonstrasikan proses e-commerce dan memisahkan tanggung jawab backend menjadi beberapa service.
2. **Arsitektur (60 detik):** tunjukkan frontend → API Gateway → User/Product/Order/Payment Service; jelaskan satu database per domain dan RabbitMQ untuk event.
3. **Pengalaman pembeli (90 detik):** buka katalog, cari produk, login sebagai buyer, masukkan produk ke keranjang, lalu checkout.
4. **Status transaksi (45 detik):** tunjukkan pesanan `PENDING_PAYMENT` dan metode pembayaran simulasi.
5. **Alur admin (90 detik):** logout, login sebagai admin, tunjukkan CRUD produk, konfirmasi pembayaran, dan perubahan status pesanan.
6. **Integrasi dan pengujian (60 detik):** buka `/health`, tunjukkan status empat service dan hasil smoke test; jelaskan event order yang dicatat Payment Service.
7. **Batasan dan penutup (30 detik):** tegaskan bahwa payment gateway sungguhan belum terhubung dan deployment gratis bersifat demo, bukan produksi.

Sebelum presentasi, pastikan stack sudah menyala, katalog terisi, akun buyer/admin bisa login, dan siapkan tangkapan layar sebagai cadangan jika internet atau free-tier service lambat.

### Susunan slide yang disarankan

1. Judul, anggota kelompok, dan tujuan proyek.
2. Masalah, pengguna sasaran, dan requirement utama.
3. Arsitektur microservices dan alasan pemisahan service.
4. ERD/model data dan database per service.
5. Demo fitur pembeli dan admin.
6. Alur checkout, reservasi stok, payment simulasi, dan event RabbitMQ.
7. Hasil pengujian, temuan/perbaikan, dan bukti UAT.
8. Deployment, batasan, retrospective, dan rencana pengembangan.

### Poin penjelasan untuk tanya jawab

- **Mengapa API Gateway?** Agar frontend memakai satu base URL dan tidak perlu mengetahui alamat tiap service.
- **Mengapa database dipisahkan?** Setiap service memiliki kepemilikan data dan schema yang lebih terdefinisi; service lain mengakses kapabilitas melalui API/event, bukan query silang database.
- **Mengapa memakai RabbitMQ?** Untuk menunjukkan komunikasi asinkron melalui event `order.created`; request checkout tetap menggunakan REST karena perlu hasil langsung.
- **Apakah payment sungguhan?** Tidak. Payment adalah simulasi akademik dan tidak memproses uang.
- **Apakah sudah production-ready?** Belum. Proyek ditujukan untuk demonstrasi; keamanan, observability, backup, kapasitas, dan pengujian produksi masih perlu ditingkatkan.

## Batasan dan keamanan

- `.env` berisi secret/password lokal; jangan commit atau membagikannya.
- Registrasi publik hanya menghasilkan role `buyer`.
- Password di-hash pada server; endpoint admin memerlukan JWT dengan role admin.
- Internal service token hanya digunakan antar-service, tidak boleh dimasukkan ke frontend.
- Pembayaran hanya simulasi, bukan koneksi bank, kartu, atau penyedia pembayaran.
- Gambar katalog dipilih berdasarkan kategori di frontend; model produk belum menyimpan URL gambar.
- Deployment free dapat sleep, dibatasi kuota, dan tidak memiliki SLA/backup produksi.
- Jangan memasukkan data pribadi atau transaksi nyata ke deployment demo.

## Deployment gratis

Panduan deployment Vercel, Neon, dan CloudAMQP ada di [deploy/VERCEL.md](deploy/VERCEL.md). Deployment memakai Vercel Hobby dan Container Runtime untuk backend, serta Vercel untuk frontend. Container Runtime Vercel masih Beta dan seluruh proses backend berbagi satu container; periksa kuota Hobby sebelum demo.

**Deployment publik aktif sejak 25 November 2026:** [Frontend](https://nusamarket-frontend.vercel.app) dan [Backend API](https://nusamarket-backend.vercel.app). Verifikasi: frontend memuat 8 produk, `/health/live` mengembalikan HTTP 200, `/health` melaporkan semua service online, dan CORS preflight dari frontend berhasil. Checkout, pembayaran, dan event AMQP belum diuji end-to-end di deployment publik.

Kedua project Vercel kini terhubung ke repository GitHub dan branch `main`; push berikutnya akan memicu deployment otomatis. Jangan mengirim password, token, connection string, atau file `.env` lewat chat.
