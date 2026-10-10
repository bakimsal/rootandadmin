# frontend

Next.js uygulaması: herkese açık blog sayfaları ve admin panel arayüzü.

**Sorumlu:** Abdulbaki (öneri)

## İlk kurulum (bir kez, Faz 1)

Bu klasörün içinde Next.js iskeletini resmi araçla oluşturun. Repo kök dizinindeyken:

```bash
npx create-next-app@latest frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Klasör boş olmadığı için araç uyarı verirse bu README'yi geçici olarak başka yere taşıyıp komutu çalıştırın, sonra geri koyun.

Ardından içerik ve test için gerekenler:

```bash
cd frontend
npm install shiki gray-matter reading-time
```

## Çalıştırma

```bash
cd frontend
cp .env.example .env.local   # değerleri doldurun
npm run dev                  # http://localhost:3000
```

## Planlanan klasör yapısı

```
src/
├── app/
│   ├── (site)/              Herkese açık sayfalar
│   │   ├── page.tsx         Ana sayfa
│   │   ├── blog/[slug]/     Yazı detay
│   │   ├── kategori/[slug]/
│   │   ├── etiket/[slug]/
│   │   ├── yazar/[slug]/
│   │   ├── arama/
│   │   ├── hakkimizda/
│   │   └── iletisim/
│   ├── admin/               Admin panel (giriş korumalı)
│   │   ├── giris/
│   │   ├── yazilar/
│   │   └── yazilar/[id]/
│   ├── api/revalidate/      Backend'in çağırdığı sayfa yenileme ucu
│   ├── sitemap.ts
│   └── not-found.tsx
├── components/              Ortak bileşenler (ui/, blog/, admin/)
├── lib/
│   ├── api.ts               Backend istemcisi
│   └── mock/                Faz 2'de kullanılacak sahte veri
└── types/                   API sözleşmesindeki tipler
```

## Ortam değişkenleri

`.env.example` dosyasına bakın.
