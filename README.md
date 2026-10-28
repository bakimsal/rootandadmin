# rootandadmin

Siber güvenlik haberlerini, blog yazılarımızı ve projelerimizi paylaştığımız site ve yönetim paneli.

**Ekip:** Abdulbaki İmsal ([@bakimsal](https://github.com/bakimsal)) · Buğra Gedik ([@bugragedik](https://github.com/bugragedik))

## Teknolojiler

| Katman | Araç | Yayın |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS | Vercel (Hobby) |
| Backend | Node.js + TypeScript + Fastify, doğrulama için Zod | Render (Free) |
| Veritabanı | PostgreSQL + Prisma | Neon (Free) |
| Görseller | Cloudinary | Cloudinary (Free) |
| İçerik | Markdown, kod renklendirme için Shiki | — |

Aylık maliyet: 0. Kararların gerekçeleri için [docs/kararlar.md](docs/kararlar.md).

## Klasör yapısı

```
rootandadmin/
├── frontend/        Next.js uygulaması (blog + admin panel arayüzü)
├── backend/         Fastify API (auth, yazılar, kategoriler, görsel yükleme)
├── docs/
│   ├── gorev-plani.md        Görev görev yapılacaklar: kim, neyi, nasıl (esas plan)
│   ├── api-sozlesmesi.md     Frontend ile backend arasındaki sözleşme (sürüm 0.2, onay bekliyor)
│   ├── kararlar.md           Teknoloji kararları ve gerekçeleri
│   └── rootandadmin-plan.xlsx  İlk tarihli plan (artık geçerli değil, görev planı esas)
├── .github/         PR ve issue şablonları
├── CONTRIBUTING.md  Branch, commit ve PR kuralları
└── CLAUDE.md        Claude için proje bağlamı
```

## Başlarken

1. Repoyu klonlayın: `git clone https://github.com/bakimsal/rootandadmin.git`
2. `dev` branch'ine geçin: `git checkout dev`
3. Frontend için [frontend/README.md](frontend/README.md), backend için [backend/README.md](backend/README.md) adımlarını izleyin.
4. Çalışmaya başlamadan önce [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını okuyun.

## Plan

Proje tarih yerine görev sırasıyla ilerliyor. Her görevin sorumlusu, adımları ve kabul kriterleri [docs/gorev-plani.md](docs/gorev-plani.md) dosyasında. Görevler GitHub Projects panosunda issue olarak takip edilir.
