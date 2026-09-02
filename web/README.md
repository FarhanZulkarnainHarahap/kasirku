# NEXXUS POS Web

Antarmuka Next.js 16 App Router untuk dashboard, katalog, inventori, pelanggan, kasir, shift, checkout, riwayat transaksi, dan invoice. Semua data bisnis berasal dari Express API; web tidak mengakses Prisma atau menyimpan secret backend.

## Menjalankan

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`; API harus berjalan di `http://localhost:4000`.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

Scanner USB bekerja sebagai keyboard; fokus pencarian dengan `F2`, lalu scan barcode. Keranjang dipertahankan lokal dan checkout selalu memakai idempotency key. Manifest PWA tersedia; service worker/Serwist perlu HTTPS serta konfigurasi deployment sebelum antrean transaksi offline diaktifkan. Untuk printer thermal gunakan dialog print browser ukuran 58/80 mm; CSS menyembunyikan navigasi saat print.

## Verifikasi dan deployment

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Set environment publik ke API HTTPS produksi, masukkan origin web ke whitelist CORS API, lalu jalankan `npm run build && npm start`. Jangan menaruh database URL, Cloudinary secret, atau Resend key di web.
