# Status Penyelesaian Minggu 1–16 — NusaMarket

Status di bawah membedakan implementasi kode, pengujian yang benar-benar dijalankan, dan pekerjaan yang masih harus dilakukan. Berdasarkan rencana proyek, Minggu 13–14 mencakup testing/bug fixing dan fitur freeze; Minggu 15 mensyaratkan deployment serta dokumentasi; Minggu 16 mencakup demo, laporan, retrospective, dan presentasi.

| Minggu | Target rencana | Bukti/kondisi | Status |
|---:|---|---|---|
| 1–3 | Planning, requirement, SRS, backlog | Dilaporkan selesai pada laporan UTS proyek; dokumen sumber perlu disertakan di paket laporan akhir | Selesai menurut laporan UTS |
| 4–5 | Arsitektur, ERD, UI/UX | Dilaporkan selesai pada laporan UTS; lampirkan artefak desain pada laporan akhir | Selesai menurut laporan UTS |
| 6 | Repository, Docker, database, environment | Docker Compose, image/service, database terpisah, dan RabbitMQ lokal telah dinyalakan | Implementasi dan runtime lokal diverifikasi |
| 7 | User Service | Registrasi, login, JWT, profil; alur register/login/otorisasi smoke test lulus | Implementasi tersedia; cakupan sebagian diuji |
| 8 | Product Service | Katalog, akses admin, CRUD, reservasi stok | Implementasi tersedia; katalog publik dan penolakan buyer diuji; CRUD admin belum diuji menyeluruh |
| 9 | Frontend | React/Vite, katalog, autentikasi, cart, order, admin | Implementasi tersedia; build frontend sebelumnya lulus; UAT browser masih perlu dilaksanakan |
| 10 | Order Service | Checkout, REST ke Product Service, order dan transisi status | Implementasi tersedia; transaksi checkout penuh belum diverifikasi pada smoke test ini |
| 11 | Payment Service & API Gateway | Payment simulasi, proxy Gateway, health checks | Gateway dan empat service online; alur pembayaran belum diverifikasi penuh |
| 12 | Integrasi dan message broker | REST antar-service dan publisher/consumer AMQP `order.created` | Kode tersedia; penerimaan event cloud/lokal melalui transaksi belum dibuktikan dalam test terbaru |
| 13 | System testing & bug fixing | 11 container berjalan; `/health` online; 10 pemeriksaan smoke test API lulus | Sebagian besar pemeriksaan smoke lulus; full regression/integration test masih pending |
| 14 | UAT & penyempurnaan | Skenario UAT tersedia dalam test plan; belum ada catatan peserta, screenshot, atau hasil UAT browser | Belum selesai |
| 15 | Deployment & dokumentasi | Frontend dan backend aktif di Vercel; endpoint health, CORS, dan katalog publik diverifikasi | Deployment publik aktif; checkout/pembayaran end-to-end dan Git auto-deploy masih pending |
| 16 | Demo, laporan akhir, retrospective, presentasi | README berisi alur demo dan outline slide; belum ada bukti demo, laporan final, retrospective, atau slide aktual | Belum selesai |

## Pemeriksaan lokal terakhir

Pada 25 November 2026:

- Docker Compose menampilkan 11 container jangka panjang dalam keadaan `running` (frontend, Gateway, empat service, empat database, RabbitMQ); `product-seed` adalah job sekali jalan.
- Keempat database dan RabbitMQ berstatus `healthy`.
- `GET http://localhost:3000/health` mengembalikan Gateway `online` dan seluruh service `user`, `product`, `order`, `payment` `online`.
- `node scripts/system-smoke-test.js` lulus untuk TC-01, TC-02, TC-03, TC-04, TC-05, TC-06, TC-07, TC-08, TC-10, dan TC-21.
- `npm --prefix frontend run build` lulus dan container `Dockerfile.vercel` berhasil dibangun; endpoint `/health/live` lulus pada container lokal dengan konfigurasi dummy (25 November 2026).
- Smoke test tersebut tidak menguji transaksi checkout → payment → status lengkap dan bukan pengganti UAT manual.

## Pekerjaan wajib sebelum Minggu 16 dapat dinyatakan selesai

- [ ] Jalankan integration test checkout dengan stok cukup dan stok tidak cukup.
- [ ] Verifikasi reservasi/pengembalian stok dan pembatalan order.
- [ ] Verifikasi pembuatan pembayaran, konfirmasi admin, dan transisi status lengkap.
- [ ] Verifikasi event `order.created` benar-benar diterima dan dicatat Payment Service.
- [ ] Lakukan UAT browser pembeli/admin; catat peserta, skenario, hasil aktual, bug, dan bukti screenshot.
- [x] Deploy frontend/backend dengan URL publik; frontend menampilkan 8 produk, backend health/readiness online, dan CORS preflight berhasil (25 November 2026).
- [ ] Verifikasi checkout → pembayaran → event `order.created` pada deployment publik.
- [ ] Pastikan `.env` dan semua secret tidak berada di commit/repository.
- [ ] Lengkapi laporan akhir dengan artefak requirement/desain, arsitektur, hasil test/UAT, batasan, dan retrospective.
- [ ] Buat slide presentasi dan lakukan rehearsal end-to-end.
- [ ] Siapkan screenshot/video lokal bila Vercel/Neon/broker free tier lambat atau tidak tersedia saat demo.

**Kesimpulan:** deployment publik sudah aktif, tetapi proyek belum selesai sampai Minggu 16. UAT, transaksi end-to-end, laporan akhir, retrospective, dan slide presentasi masih belum dibuktikan.
