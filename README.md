# NEXXUS POS

NEXXUS POS terdiri dari dua proyek independen:

- `web`: Next.js App Router untuk dashboard dan kasir.
- `api`: Express.js API, Prisma, dan PostgreSQL.

## Deployment Vercel

Import repository ini dua kali di Vercel.

### Web

- Root Directory: `web`
- Framework Preset: Next.js
- Build Command: `npm run build`
- Deploy project API terlebih dahulu.
- Isi `API_PROXY_TARGET` dengan origin API, misalnya `https://nexxus-pos-api.vercel.app`.
- Isi `NEXT_PUBLIC_API_URL=/api/v1` agar autentikasi cookie melewati proxy first-party.
- Isi `NEXT_PUBLIC_SOCKET_URL` dengan URL project API.

### API

- Root Directory: `api`
- Framework Preset: Express
- Install Command: `npm install`
- Environment: salin seluruh variable dari `api/.env.example` dan isi dengan credential production.
- Set `WEB_APP_URL` dan `CORS_ALLOWED_ORIGINS` ke URL deployment web.

Express dikenali melalui `api/src/app.ts`, yang mengekspor aplikasi sebagai default export.
