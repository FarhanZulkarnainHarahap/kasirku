# MY-CASHIER API

Express 5 + TypeScript + Prisma PostgreSQL API untuk MY-CASHIER: multi-tenant, role/permission, cookie JWT, CSRF, CORS whitelist, rate limiting, produk, Cloudinary, inventori, pelanggan, shift, checkout transaksional-idempoten, dashboard, PDF invoice, dan email Resend.

## Instalasi

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

API lokal: `http://localhost:4000/api/v1`.
Root check: `GET /`.
Health check: `GET /api/v1/health`.

## Environment

Production minimal:

```env
NODE_ENV=production
PORT=4000
WEB_APP_URL=https://my-kasirku.vercel.app
CORS_ALLOWED_ORIGINS=https://my-kasirku.vercel.app
DATABASE_URL=...
DIRECT_URL=...
JWT_SECRET=...
COOKIE_SECRET=...
CSRF_SECRET=...
APP_NAME=MY-CASHIER
```

Gunakan secret acak minimal 32 karakter. Jangan commit file `.env`.

## Prisma Postgres / Prisma Console

1. Buat project dan database di Prisma Console.
2. Salin pooled connection string ke `DATABASE_URL`.
3. Salin direct connection string ke `DIRECT_URL` untuk migration.
4. Jalankan `npm run db:deploy` di production; `npm run db:migrate` hanya untuk development.
5. Gunakan `npm run db:studio` untuk inspeksi. Seed demo ditolak di production.

Migration awal tersedia di `prisma/migrations/20260902010000_init`.

## Akun demo

| Role    | Email                  | Password    |
| ------- | ---------------------- | ----------- |
| Owner   | owner@my-cashier.test   | Owner123!   |
| Admin   | admin@my-cashier.test   | Admin123!   |
| Manager | manager@my-cashier.test | Manager123! |
| Cashier | cashier@my-cashier.test | Cashier123! |

Ganti seluruh password sebelum sistem dapat diakses pihak lain.

## Cloudinary dan Resend

Untuk Cloudinary isi `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, dan `CLOUDINARY_API_SECRET`. Upload memakai memory storage, validasi MIME/signature, maksimal lima JPG/PNG/WebP dan 5 MB per file. Tanpa credential endpoint memberi status konfigurasi yang jelas.

Untuk Resend, buat API key, tambahkan dan verifikasi domain beserta DNS record, lalu isi `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, dan opsional `RESEND_REPLY_TO_EMAIL`. Kegagalan email tidak membatalkan transaksi. Tanpa key, job ditandai `FAILED` dengan pesan `Resend belum dikonfigurasi`; test tidak mengirim email nyata.

## Keamanan, verifikasi, deployment

Gunakan secret acak minimal 32 karakter, whitelist origin HTTPS tanpa wildcard, simpan secret hanya di `.env` API, lalu:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:deploy
npm start
```

Pastikan domain web production masuk `CORS_ALLOWED_ORIGINS`, preflight OPTIONS berhasil, dan `GET /api/v1/health` mengembalikan `success: true`.
