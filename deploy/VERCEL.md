# Deploy NusaMarket di Vercel (Hobby)

Panduan ini memakai Vercel untuk website dan backend, Neon untuk PostgreSQL, serta CloudAMQP untuk AMQP. Vercel Container Runtime masih Beta. Hobby memiliki kuota bulanan; lima proses Node.js dalam satu container dapat menghabiskan kuota tersebut. Periksa pemakaian dan ketentuan terkini sebelum demo. Deployment belum dianggap selesai sebelum URL live dan tes berhasil.

## Arsitektur deployment

- **Frontend:** Vercel project terpisah dari folder `frontend`, dibangun sebagai Vite static site.
- **Backend:** Vercel project terpisah dari root repository, memakai `Dockerfile.vercel` dan Container Runtime.
- **Database:** empat database PostgreSQL dalam project Neon yang sudah disiapkan.
- **Message broker:** AMQP dari CloudAMQP.

Container backend menjalankan API Gateway dan empat service Node.js di satu container. Gateway menerima trafik publik pada port `80`; service lain hanya tersedia di `127.0.0.1`. Ini adalah penyederhanaan untuk demo, bukan rancangan production. Worker AMQP ikut berjalan di dalam container dan tidak dijamin terus hidup ketika Vercel menskalakan container idle ke nol.

## 1. Pastikan kredensial aman

Kredensial yang pernah terekspos harus dirotasi. Sebelum deploy, buat password/URI baru untuk Neon dan CloudAMQP serta JWT/internal token baru; masukkan langsung ke Vercel Environment Variables, Neon, dan CloudAMQP. Jangan commit `.env` atau menempelkan secrets ke chat. Pastikan `NEON_DB_PASSWORD` berisi password database saja, bukan connection string.

## 2. Deploy backend

1. Pada Vercel, import repository `almondaja/ecommerce-microservices` dari GitHub.
2. Buat project backend dari repository yang sama, dengan **Root Directory** di root repository (bukan `frontend`).
3. Pilih preset **Container** jika tidak terdeteksi otomatis. Runtime akan menggunakan `Dockerfile.vercel`.
4. Tambahkan environment variables untuk **Production**:

   | Key | Value |
   |---|---|
   | `PORT` | `80` |
   | `JWT_SECRET` | Secret acak panjang, unik |
   | `INTERNAL_SERVICE_TOKEN` | Token acak panjang, berbeda dari JWT secret |
   | `CORS_ORIGIN` | URL origin website frontend, tanpa path atau slash akhir |
   | `NEON_DB_HOST` | Hostname Neon saja, tanpa skema, username, password, path, atau query |
   | `NEON_DB_PORT` | `5432` |
   | `NEON_DB_USER` | Role Neon |
   | `NEON_DB_PASSWORD` | Password role Neon saja |
   | `DB_POOL_MAX` | `3` |
   | `USER_DB_NAME` | `ecommerce_user_db` |
   | `PRODUCT_DB_NAME` | `ecommerce_product_db` |
   | `ORDER_DB_NAME` | `ecommerce_order_db` |
   | `PAYMENT_DB_NAME` | `ecommerce_payment_db` |
   | `AMQP_URL` | URI TLS `amqps://...` dari CloudAMQP |

5. Jangan menambah `.env` ke repository. Deploy backend dan catat URL deployment. Tunggu build berhasil, lalu buka `<URL_BACKEND>/health/live`; respons yang diharapkan memuat `status: alive`.

Runner `deploy/start-all.js` meneruskan kredensial database bersama ke service dan mengatur `DB_SSL=true`. Database harus memiliki schema sebelum verifikasi readiness:

| Database | SQL |
|---|---|
| `ecommerce_user_db` | `user-service/database/init.sql` |
| `ecommerce_product_db` | `product-service/database/init.sql`, lalu `product-service/database/seed.sql` |
| `ecommerce_order_db` | `order-service/database/init.sql` |
| `ecommerce_payment_db` | `payment-service/database/init.sql` |

Jalankan setiap file di database yang sesuai melalui Neon SQL Editor. Jangan menginisialisasi schema pada database produksi yang berisi data tanpa backup.

## 3. Deploy frontend

1. Import repository yang sama sebagai **project Vercel kedua**.
2. Atur **Root Directory** ke `frontend`.
3. Gunakan framework Vite, install command `npm ci`, build command `npm run build`, dan output directory `dist`.
4. Tambahkan environment variable build `VITE_API_BASE_URL` dengan URL backend yang dicatat tadi, tanpa slash di akhir.
5. Deploy dan catat URL website frontend.

## 4. Set CORS backend

Di backend project, ubah `CORS_ORIGIN` ke URL frontend persis, misalnya `https://nama-project.vercel.app` (tanpa slash akhir). Simpan perubahan dan deploy ulang backend.

## 5. Verifikasi aplikasi

1. Buka `<URL_BACKEND>/health/live`; harapkan status HTTP 200 dan `alive`.
2. Buka `<URL_BACKEND>/health`; harapkan `online` dan seluruh service `online`. Jika gagal, periksa log deploy, aksesibilitas Neon, schema, dan environment variables.
3. Buka frontend dan tes katalog, daftar/login, checkout, dan pembayaran simulasi.
4. Pastikan event `order.created` terlihat di `payment_order_events` pada database payment setelah order dibuat.
5. Smoke test pilihan (membuat akun buyer uji di database cloud):

   ```powershell
   $env:API_GATEWAY_URL = "https://nama-backend.vercel.app"
   node scripts/system-smoke-test.js
   ```

Hindari memakai data pribadi atau transaksi pembayaran sungguhan. Simpan bukti demo lokal jika kuota atau cold start Vercel mengganggu presentasi.

## Batasan dan biaya

- Paket Vercel Hobby gratis memiliki kuota. Dokumen Vercel saat ini mencantumkan 4 jam Active CPU dan 360 GB-hours Provisioned Memory per bulan; penggunaan di luar kuota/aturan akun dapat membatasi layanan. Periksa ulang [Hobby plan](https://vercel.com/docs/plans/hobby), [Function usage and pricing](https://vercel.com/docs/functions/usage-and-pricing), dan [Container Runtime](https://vercel.com/docs/functions/runtimes/container).
- Container Runtime tersedia dalam Beta dan bukan pengganti platform container production yang terjamin.
- Lima proses dalam satu container berbagi resource dan lifecycle. Jika layanan internal atau AMQP consumer berhenti, container harus dibangun ulang/restart. Untuk sistem nyata, pisahkan service dan worker ke platform yang sesuai.
- Neon dan CloudAMQP memiliki batas free-tier terpisah yang dapat berubah.
- Aplikasi pembayaran hanya simulasi; jangan gunakan kartu atau transaksi riil.

## Status

Deployment production dilakukan pada 25 November 2026:

- Frontend: <https://nusamarket-frontend.vercel.app>
- Backend API: <https://nusamarket-backend.vercel.app>
- `/health/live` mengembalikan HTTP 200 dan `/health` melaporkan Gateway serta empat service online.
- Frontend berhasil memuat katalog 8 produk; CORS preflight dari origin frontend berhasil.

Deployment dikirim dari workspace lokal melalui Vercel CLI. Git auto-deploy belum dihubungkan, dan alur checkout → pembayaran → event AMQP belum diverifikasi end-to-end pada deployment publik.
