# Panduan deployment gratis NusaMarket

> **Panduan legacy Render.** Render meminta metode pembayaran pada akun yang digunakan, jadi panduan deployment aktif telah dipindahkan ke [Vercel, Neon, dan CloudAMQP](VERCEL.md). Ikuti panduan baru tersebut untuk deployment saat ini.

Panduan ini untuk demo/UAS, bukan penggunaan produksi. Rancangan menggunakan:

| Bagian | Provider/plan | Peran |
|---|---|---|
| Frontend | Render Static Site (free) | Build dan host React/Vite |
| Backend | Render Web Service (Free) | Satu Docker container menjalankan Gateway dan empat service |
| Database | Neon Free | Satu project PostgreSQL dengan empat database |
| Message broker | CloudAMQP free (LavinMQ shared) | Broker AMQP untuk event `order.created` |

Semua memiliki free tier pada saat dokumentasi ini diperiksa (25 November 2026), tetapi kuota, eligibility, dan syarat provider dapat berubah. Tetap periksa halaman harga/usage sebelum mengaktifkan layanan dan jangan menambahkan payment method kecuali memahami potensi biaya.

## Yang perlu dipahami sebelum deploy

- Backend menjalankan lima proses Node.js dalam satu container agar demo muat dalam satu free web service. Empat service internal hanya bind ke `127.0.0.1`; Gateway bind ke `0.0.0.0` dan menerima trafik publik. Ini mengurangi isolasi resource dibanding deployment microservices produksi.
- Render Free Web Service spin down setelah 15 menit tidak ada trafik dan biasanya memerlukan sekitar satu menit untuk bangun saat request berikutnya. Filesystem container bersifat ephemeral; data harus berada di Neon.
- Render menyediakan 750 free instance-hours per workspace per bulan. Semua Free Web Services dalam workspace berbagi batas tersebut; service yang sleep tidak mengonsumsi instance-hours.
- Neon Free memiliki batas penggunaan project (termasuk compute/storage/egress); empat database di satu project berbagi kuota project.
- CloudAMQP menawarkan broker shared LavinMQ pada free tier saat diperiksa. LavinMQ berbicara AMQP, tetapi bukan broker RabbitMQ dedicated. Fitur proyek memakai AMQP dasar; verifikasi consumer/publisher setelah deploy.
- Aplikasi pembayaran hanya simulasi. Tidak ada pembayaran atau data kartu sungguhan.

## 0. Persiapan akun dan repository

1. Siapkan akun Render, Neon, dan CloudAMQP pada akun yang dikelola oleh pemilik proyek.
2. Pastikan repository GitHub terhubung ke akun Render. File `.env`, password, token, dan connection string rahasia **tidak boleh** di-commit.
3. Pastikan semua perubahan yang hendak dideploy sudah direview dan berada di branch Git yang akan dipilih. Provider membangun kode dari repository/branch yang terhubung, bukan dari file lokal yang belum di-push.
4. Jangan menaruh credential provider atau secret di chat. Masukkan secret langsung pada dashboard provider.

## 1. Buat PostgreSQL di Neon

1. Buat satu project pada Neon Free.
2. Buat empat database pada project/branch yang sama:
   - `ecommerce_user_db`
   - `ecommerce_product_db`
   - `ecommerce_order_db`
   - `ecommerce_payment_db`
3. Gunakan role yang sama untuk empat database (role project Neon yang mempunyai hak akses terhadap database tersebut).
4. Catat hostname pooled atau hostname yang diberikan Neon, port, username, dan password. Nilai ini akan dimasukkan langsung ke environment Render.
5. Untuk setiap database, pilih database yang sesuai di Neon SQL Editor lalu jalankan file:

   | Database | SQL file |
   |---|---|
   | `ecommerce_user_db` | `user-service/database/init.sql` |
   | `ecommerce_product_db` | `product-service/database/init.sql` |
   | `ecommerce_product_db` | `product-service/database/seed.sql` |
   | `ecommerce_order_db` | `order-service/database/init.sql` |
   | `ecommerce_payment_db` | `payment-service/database/init.sql` |

   Jalankan schema setiap service pada database yang benar. `seed.sql` hanya untuk database produk dan aman dijalankan kembali.

Jangan gunakan empat project Neon terpisah kecuali ada alasan khusus; itu membagi kuota free-tier ke beberapa project.

## 2. Buat AMQP broker gratis

1. Buat instance free pada CloudAMQP (di daftar harga saat ini bernama **Loyal Lemming**, shared LavinMQ).
2. Salin AMQP URL/URI TLS (`amqps://...`) dari dashboard instance.
3. Simpan URI itu untuk `AMQP_URL` pada Render. Jangan memasukkannya ke source code, file contoh, atau commit.
4. Free plan memiliki batas pesan/koneksi/queue. Lihat batas terbaru di dashboard provider sebelum demo.

Event yang digunakan aplikasi adalah `order.created`. Order Service menerbitkan event setelah order tersimpan; Payment Service mengonsumsi dan mencatat event di `payment_order_events`. Alur checkout dan konfirmasi pembayaran tetap dilakukan melalui REST.

## 3. Deploy backend pada Render

1. Pilih **New → Web Service** dan hubungkan repository serta branch proyek.
2. Pilih konfigurasi Docker:
   - **Root Directory / Docker Context:** root repository
   - **Dockerfile Path:** `Dockerfile.render`
   - **Plan:** Free
3. Pada Advanced/Health Check Path, atur:

   ```text
   /health/live
   ```

4. Tambahkan environment variables melalui dashboard Render. `deploy/render.env.example` berisi nama variabel dan bentuk nilainya; jangan mengisi contoh placeholder secara literal.

   | Variable | Nilai |
   |---|---|
   | `JWT_SECRET` | Secret acak panjang, unik |
   | `INTERNAL_SERVICE_TOKEN` | Token internal acak panjang, berbeda dari JWT secret |
   | `CORS_ORIGIN` | Origin website Render, misalnya `https://nusamarket-frontend.onrender.com` |
   | `NEON_DB_HOST` | Hostname Neon; pooled hostname disarankan jika tersedia |
   | `NEON_DB_PORT` | Port Neon, biasanya `5432` |
   | `NEON_DB_USER` | Role Neon |
   | `NEON_DB_PASSWORD` | Password role Neon |
   | `DB_POOL_MAX` | `3` sebagai nilai awal ringan |
   | `USER_DB_NAME` | `ecommerce_user_db` |
   | `PRODUCT_DB_NAME` | `ecommerce_product_db` |
   | `ORDER_DB_NAME` | `ecommerce_order_db` |
   | `PAYMENT_DB_NAME` | `ecommerce_payment_db` |
   | `AMQP_URL` | AMQP TLS URL dari CloudAMQP |

   Runner `deploy/start-all.js` meneruskan konfigurasi database bersama, menetapkan `DB_SSL=true`, memakai pool koneksi kecil, dan mengatur alamat antar-service. Jangan menetapkan `PORT` sendiri; Render memberikan port publik dan runner meneruskannya ke API Gateway.

5. Deploy dan tunggu status **Live**. Catat URL publik backend dari dashboard, misalnya `https://nama-api.onrender.com`.

Render health check `/health/live` hanya menguji proses Gateway agar backend tidak dianggap mati saat Neon sedang scale-to-zero. Endpoint kesiapan dependency adalah `/health`.

## 4. Deploy frontend pada Render Static Site

Frontend dipisah sebagai Static Site supaya tidak memakai instance-hours web service.

1. Pilih **New → Static Site** dan hubungkan repository/branch yang sama.
2. Atur:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
3. Tambahkan environment variable build-time:

   ```text
   VITE_API_BASE_URL=https://nama-api.onrender.com
   ```

4. Deploy, lalu catat origin website, misalnya `https://nama-nusamarket.onrender.com`.
5. Kembali ke Render Web Service backend dan ubah `CORS_ORIGIN` ke origin frontend persis (scheme HTTPS, tanpa path/trailing slash). Jika mengizinkan lebih dari satu origin, pisahkan dengan koma hanya untuk domain yang diperlukan.
6. Simpan perubahan environment dan deploy ulang backend.

## 5. Verifikasi backend dan frontend

Ganti URL contoh di bawah dengan URL backend sebenarnya:

- `https://nama-api.onrender.com/health/live` harus mengembalikan status `alive`.
- `https://nama-api.onrender.com/health` harus mengembalikan status `online` dan empat service `online`.
- Buka website Static Site dan pastikan katalog dapat dimuat.
- Jalankan smoke test ke URL deployment dari PowerShell:

  ```powershell
  $env:API_GATEWAY_URL = "https://nama-api.onrender.com"
  node scripts/system-smoke-test.js
  ```

Smoke test membuat akun buyer baru berawalan `smoke-` pada database deployment. Jika tidak ingin membuat akun uji tambahan, gunakan Postman/browser dan ikuti [test plan/UAT](../docs/TEST-PLAN-UAS.md) untuk pemeriksaan manual.

Lanjutkan tes checkout dan konfirmasi pembayaran dari browser. Untuk memverifikasi event, periksa tabel `payment_order_events` pada Neon `ecommerce_payment_db` sesudah satu order berhasil dibuat.

## 6. Buat admin pada deployment

1. Daftar melalui website sebagai buyer.
2. Buka Neon SQL Editor dan pilih `ecommerce_user_db`.
3. Jalankan query dengan alamat email akun tim:

   ```sql
   UPDATE users
   SET role = 'admin'
   WHERE email = 'admin@example.com';
   ```

4. Periksa `role` berubah menjadi `admin`, lalu logout dan login lagi agar JWT diperbarui.
5. Jangan membuat registrasi publik menerima role admin.

## Catatan free tier dan risiko

- Render Free web service sleep setelah 15 menit tanpa trafik; request pertama setelah sleep lambat. Buka `/health/live` dan `/health` sebelum demo.
- Render Free memiliki filesystem ephemeral dan dapat restart. Database harus tetap di Neon.
- Render free instance-hours dan bandwidth/build usage dibatasi; pantau halaman Billing/Usage. Jika kuota terlampaui, service/build dapat disuspend.
- Neon Free melakukan scale-to-zero dan membatasi compute, storage, dan network transfer; database dapat perlu waktu untuk aktif kembali.
- Free broker CloudAMQP adalah shared LavinMQ dan kuotanya dapat berubah. Pastikan koneksi AMQP sukses sebelum presentasi.
- Free services tidak memberikan SLA, backup, atau jaminan uptime produksi. Simpan screenshot/video demo sebagai cadangan.
- Jangan menaruh data pribadi pengguna lain, password, informasi kartu, atau transaksi riil pada demo publik.
- Deployment gratis tidak selalu berarti semua akses/fitur gratis selamanya; baca batas plan pada dashboard dan halaman resmi provider.

## Referensi provider

- [Render free services dan batasnya](https://render.com/docs/free)
- [Render Web Services](https://render.com/docs/web-services)
- [Neon plans/free tier](https://neon.com/docs/introduction/plans)
- [CloudAMQP plans and pricing](https://www.cloudamqp.com/plans.html)

**Status:** konfigurasi dan langkah deployment didokumentasikan, tetapi deployment publik belum dilakukan. Diperlukan pemilik akun untuk membuat/menyetujui resource, memasukkan secret, dan menghubungkan repository. Jangan melaporkan deployment sebagai selesai sampai URL aktif dan test aktual berhasil.
