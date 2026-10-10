# backend

Fastify + TypeScript API. Veritabanı PostgreSQL (Neon), ORM Prisma.

**Sorumlu:** Buğra (öneri)

## İlk kurulum (bir kez, Faz 1)

Repo kök dizinindeyken:

```bash
cd backend
npm init -y
npm install fastify @fastify/cookie @fastify/cors @fastify/multipart zod @prisma/client argon2 cloudinary slugify
npm install -D typescript tsx @types/node prisma
npx tsc --init
npx prisma init
```

`package.json` içine betikleri ekleyin:

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio"
}
```

## Çalıştırma

```bash
cd backend
cp .env.example .env    # değerleri doldurun
npm run db:migrate
npm run dev             # http://localhost:4000
```

## Planlanan klasör yapısı

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts             İki admin kullanıcı ve başlangıç kategorileri
└── src/
    ├── server.ts           Uygulamanın başlangıç noktası
    ├── config.ts           Ortam değişkenlerinin Zod ile doğrulanması
    ├── plugins/            prisma, auth, cors, hata yönetimi
    ├── modules/
    │   ├── auth/           routes.ts, service.ts, schemas.ts
    │   ├── posts/
    │   ├── categories/
    │   ├── tags/
    │   ├── authors/
    │   └── uploads/
    └── lib/                slug, okuma süresi, revalidate yardımcıları
```

Her modül aynı düzeni izler: `routes.ts` (uç noktalar), `service.ts` (iş mantığı), `schemas.ts` (Zod şemaları). Uç noktalar [docs/api-sozlesmesi.md](../docs/api-sozlesmesi.md) ile birebir uyumlu olmalı.

## Ortam değişkenleri

`.env.example` dosyasına bakın.
