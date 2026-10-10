# rootandadmin — Claude için proje bağlamı

İki kişilik ekibin (Abdulbaki İmsal @bakimsal, Buğra Gedik @bugragedik) blog platformu. Öğrenilenler, günlük haberler ve kişisel düşünceler paylaşılacak; yanında yazıların yönetildiği bir admin panel var. Kullanıcılarla Türkçe konuş.

## Yığın ve kısıtlar

- `frontend/`: Next.js (App Router) + TypeScript + Tailwind CSS → Vercel Hobby
- `backend/`: Fastify + TypeScript + Zod + Prisma → Render Free
- Veritabanı: PostgreSQL (Neon Free). Görseller: Cloudinary Free. İçerik: Markdown + Shiki.
- **Maliyet kuralı:** Yalnızca ücretsiz veya çok cüzi araçlar. Ücretli servis veya bağımlılık önermeden önce sor.
- Render ücretsiz sunucusu 15 dk boşta kalınca uyur. Okuyucu sayfaları önceden üretilmeli (SSG/ISR); okuyucu isteği doğrudan backend'e gitmemeli.

## Tasarım

Arayüz kesinlikle basit veya çocuksu görünmemeli; profesyonel, editoryal bir his hedefleniyor. Hazır bileşen kütüphanesi görünümünden kaçın. Tasarım yönü Faz 1'de seçilecek; seçilince buraya eklenecek.

## Çalışma şekli

- Frontend ve backend paralel geliştirilir; tek gerçek kaynak `docs/api-sozlesmesi.md`. Sözleşmeyle çelişen kod yazma; değişiklik gerekiyorsa önce dokümanı güncelle.
- Branch/commit/PR kuralları `CONTRIBUTING.md` içinde. `main` ve `dev`'e doğrudan push yok.
- Gizli bilgiler `.env` dosyalarında; yeni değişken eklenince `.env.example` güncellenir.

## Plan

4 hafta, 12 Ekim – 8 Kasım 2026. Detay: `docs/rootandadmin-plan.xlsx`. Teknoloji gerekçeleri: `docs/kararlar.md`.
