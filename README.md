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
- Environment: isi `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_SOCKET_URL` dengan URL project API.

### API

- Root Directory: `api`
- Framework Preset: Express
- Install Command: `npm install`
- Environment: salin seluruh variable dari `api/.env.example` dan isi dengan credential production.

Express dikenali melalui `api/src/app.ts`, yang mengekspor aplikasi sebagai default export.
