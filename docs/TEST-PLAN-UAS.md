# Test Plan dan UAT — NusaMarket

Dokumen ini adalah checklist pengujian manual untuk proyek UAS. Isi kolom hasil aktual dan bukti screenshot setelah setiap skenario dijalankan. Jangan menandai lulus sebelum ada hasil uji.

## A. Pengujian API dan integrasi

| ID | Area | Skenario | Hasil yang diharapkan | Hasil aktual |
|---|---|---|---|---|
| TC-01 | Health | GET `/health/live` pada API Gateway | Gateway mengembalikan HTTP 200 dan status `alive` | Lulus - smoke test 2026-11-25 |
| TC-02 | Readiness | GET `/health` pada API Gateway | Gateway dan empat service/database berstatus online | Lulus - semua service online 2026-11-25 |
| TC-03 | User | Registrasi dengan nama, email, password valid | HTTP 201 dan akun dibuat | Lulus - smoke test 2026-11-25 |
| TC-04 | User | Registrasi dengan email yang sudah digunakan | HTTP 409 dan akun duplikat ditolak | Lulus - smoke test 2026-11-25 |
| TC-05 | User | Login dengan kredensial benar | HTTP 200 dan JWT diterima | Lulus - smoke test 2026-11-25 |
| TC-06 | User | Login dengan password salah | HTTP 401 | Lulus - smoke test 2026-11-25 |
| TC-07 | User | GET `/users/me` tanpa token | HTTP 401 | Lulus - smoke test 2026-11-25 |
| TC-08 | Product | GET `/products` | Daftar produk dan pagination tampil | Lulus - smoke test 2026-11-25 |
| TC-09 | Product | Admin membuat produk valid | HTTP 201 dan produk tersimpan | Belum diuji |
| TC-10 | Product | Buyer mencoba membuat produk | HTTP 403 | Lulus - smoke test 2026-11-25 |
| TC-11 | Product | Admin mengubah dan menghapus produk | Data berubah dan produk terhapus | Belum diuji |
| TC-12 | Order | Buyer checkout dengan produk dan stok cukup | Order dibuat dengan status `PENDING_PAYMENT`; stok berkurang | Belum diuji |
| TC-13 | Order | Checkout dengan stok tidak cukup | Request ditolak; tidak ada order baru; reservasi stok sebelumnya dikembalikan | Belum diuji |
| TC-14 | Order | Buyer melihat pesanan milik akun lain | Akses ditolak atau data tidak ditemukan | Belum diuji |
| TC-15 | Payment | Buyer membuat pembayaran untuk order sendiri | Catatan pembayaran `PENDING` dibuat | Belum diuji |
| TC-16 | Payment | Admin mengonfirmasi pembayaran | Pembayaran `PAID` dan order menjadi `PAID` | Belum diuji |
| TC-17 | Order | Admin mengubah status berurutan | `PAID` → `PROCESSING` → `SHIPPED` → `COMPLETED` | Belum diuji |
| TC-18 | Order | Admin melakukan transisi status yang tidak diizinkan | HTTP 409 | Belum diuji |
| TC-19 | Order | Admin membatalkan order `PENDING_PAYMENT` | Order `CANCELLED` dan stok dikembalikan | Belum diuji |
| TC-20 | RabbitMQ | Order berhasil dibuat | Event `order.created` diterima Payment Service dan tercatat di `payment_order_events` | Belum diuji |
| TC-21 | Gateway | Request ke path service yang tidak dikenal | HTTP 404 dari API Gateway | Lulus — smoke test lokal 25 November 2026 |

## B. Pengujian antarmuka dan UAT

| ID | Aktor | Skenario | Kriteria penerimaan | Hasil aktual |
|---|---|---|---|---|
| UAT-01 | Pembeli | Membuka katalog dan mencari produk | Produk dan hasil pencarian sesuai | Belum diuji |
| UAT-02 | Pembeli | Membuka detail dan menambah produk ke keranjang | Detail benar dan jumlah keranjang berubah | Belum diuji |
| UAT-03 | Pembeli | Checkout setelah login | Order dan instruksi pembayaran simulasi dibuat | Belum diuji |
| UAT-04 | Pembeli | Membuka riwayat pesanan | Pesanan dan status tampil | Belum diuji |
| UAT-05 | Admin | Login sebagai admin | Menu admin tersedia | Belum diuji |
| UAT-06 | Admin | Menambah, mengedit, menghapus produk | Perubahan tampil di katalog | Belum diuji |
| UAT-07 | Admin | Mengonfirmasi pembayaran | Status pembayaran dan pesanan diperbarui | Belum diuji |
| UAT-08 | Admin | Memperbarui status pengiriman | Status berubah sesuai urutan yang diizinkan | Belum diuji |
| UAT-09 | Pembeli | Mencoba membuka halaman admin | Akses ditolak atau menu tidak tersedia | Belum diuji |
| UAT-10 | Pembeli/Admin | Menggunakan aplikasi pada layar desktop dan mobile | Layout dan kontrol utama dapat digunakan | Belum diuji |

## C. Bukti yang perlu disiapkan untuk laporan UAS

1. Screenshot repository dan struktur microservices.
2. Screenshot Docker Compose atau konfigurasi deployment.
3. Screenshot website hasil deployment.
4. Screenshot katalog, login, keranjang, checkout, dan riwayat pesanan.
5. Screenshot dashboard admin dan CRUD produk.
6. Screenshot Postman untuk register, login, CRUD produk, order, dan payment.
7. Screenshot `/health` yang menunjukkan service online.
8. Screenshot RabbitMQ/CloudAMQP dan tabel `payment_order_events`.
9. Tabel hasil UAT yang sudah diisi berdasarkan pengujian nyata.
10. Catatan bug yang ditemukan dan status perbaikannya.

**Verifikasi otomatis lokal 25 November 2026:** smoke test melewati TC-01, TC-02, TC-03, TC-04, TC-05, TC-06, TC-07, TC-08, TC-10, dan TC-21 pada stack Docker lokal yang aktif. TC lain tetap belum lulus sampai dijalankan secara aktual. Smoke test membuat satu akun buyer unik berawalan `smoke-` pada database setiap kali dijalankan.

**Aturan pelaporan:** kolom hasil aktual harus diisi setelah pengujian. Jangan menyatakan seluruh test passed hanya berdasarkan aplikasi berhasil dibuka atau health check.
