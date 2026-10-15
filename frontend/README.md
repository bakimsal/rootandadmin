# frontend

Next.js uygulaması: herkese açık blog sayfaları ve admin panel arayüzü.

**Sorumlu:** Abdulbaki (öneri)

## İlk kurulum (bir kez, F1)

Bu klasörün içinde Next.js iskeletini resmi araçla oluşturun. Repo kök dizinindeyken:

```bash
npx create-next-app@latest frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Klasör boş olmadığı için araç uyarı verirse bu README'yi geçici olarak başka yere taşıyıp komutu çalıştırın, sonra geri koyun.

Ardından içerik ve test için gerekenler:

```bash
cd frontend
npm install unified remark-parse remark-gfm remark-rehype rehype-sanitize rehype-pretty-code rehype-slug rehype-stringify shiki
npm install -D prettier prettier-plugin-tailwindcss
```

Markdown işleme zinciri F7'de anlatılıyor. Okuma süresi backend'de hesaplandığı için frontend'de ayrı bir pakete gerek yok.

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
│   │   ├── haberler/        Haber listesi; [slug]/ haber detay (adres önerisi, sözleşmede açık soru)
│   │   ├── bloglar/         Blog listesi; [slug]/ blog detay
│   │   ├── projeler/
│   │   ├── yazar/[slug]/
│   │   ├── ara/             Arama, tarayıcıda search-index.json üzerinde
│   │   └── iletisim/
│   ├── admin/               Admin panel (giriş korumalı)
│   │   ├── giris/
│   │   ├── yazilar/         Liste; [id]/ düzenleme
│   │   ├── projeler/
│   │   ├── mesajlar/
│   │   └── profil/
│   ├── api/revalidate/      Backend'in çağırdığı sayfa yenileme ucu (revalidateTag)
│   ├── search-index.json/   Önceden üretilen arama dizini
│   ├── rss.xml/
│   ├── sitemap.ts
│   ├── robots.ts
│   └── not-found.tsx
├── components/              Ortak bileşenler (ui/, blog/, admin/)
├── lib/
│   ├── api.ts               Backend istemcisi
│   └── mock/                Faz 2A'da kullanılacak sahte veri (F4)
└── types/                   API sözleşmesindeki tipler
```

## Ortam değişkenleri

`.env.example` dosyasına bakın.
