# MY-CASHIER

MY-CASHIER terdiri dari dua proyek independen:

- `web`: Next.js App Router untuk dashboard dan kasir.
- `api`: Express.js API, Prisma, dan PostgreSQL.

## Development

```bash
cd api
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Untuk lokal, gunakan `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`.

## Production

API production yang digunakan web:

```env
NEXT_PUBLIC_API_URL=https://my-kasirku-2303node.vercel.app/api/v1
NEXT_PUBLIC_SOCKET_URL=https://my-kasirku-2303node.vercel.app
```

Environment API wajib memuat:

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

## Deployment Vercel

Import repository ini dua kali di Vercel.

### Web

- Root Directory: `web`
- Framework Preset: Next.js
- Install Command: `npm install`
- Build Command: `npm run build`
- Deploy project API terlebih dahulu.
- Isi `NEXT_PUBLIC_API_URL` dengan `https://my-kasirku-2303node.vercel.app/api/v1`.
- Isi `NEXT_PUBLIC_SOCKET_URL` dengan `https://my-kasirku-2303node.vercel.app`.

### API

- Root Directory: `api`
- Install Command: `npm install`
- Build Command: `npm run build`
- Start Command: `npm start` (menjalankan `dist/src/server.js`)
- Environment: salin seluruh variable dari `api/.env.example` dan isi dengan credential production.
- Set `WEB_APP_URL` dan `CORS_ALLOWED_ORIGINS` ke URL deployment web.
- Jalankan migration production dengan `npm run db:deploy`.

Express dikenali melalui `api/src/app.ts`, yang mengekspor aplikasi sebagai default export.

Health check: `GET https://my-kasirku-2303node.vercel.app/api/v1/health`.
Root check: `GET https://my-kasirku-2303node.vercel.app/`.

Troubleshooting cepat: pastikan `NEXT_PUBLIC_API_URL` berisi `/api/v1`, origin web masuk `CORS_ALLOWED_ORIGINS`, cookie HTTPS aktif di production, dan database PostgreSQL bisa diakses oleh Prisma.
