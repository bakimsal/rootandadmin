# rootandadmin — Claude için proje bağlamı

İki kişilik ekibin (Abdulbaki İmsal @bakimsal, Buğra Gedik @bugragedik) siber güvenlik sitesi: haberler, blog yazıları ve projeler paylaşılacak; yanında içeriğin yönetildiği bir admin panel var. Kullanıcılarla Türkçe konuş.

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

Görev planı: `docs/gorev-plani.md`. Görevler kodla anılır (H, T, F, B, E, Y; örn. "F7", "B3"). Kullanıcı bir görev kodu verdiğinde önce o dosyada görevin **Bağlı**, **Nasıl** ve **Bitti sayılır** kısımlarını oku; adımları izle ve işi bitirmeden önce kabul kriterlerini tek tek kontrol et. Bağlı olduğu görevler bitmemiş görünüyorsa başlamadan kullanıcıya söyle.

Teknoloji gerekçeleri: `docs/kararlar.md`. İlk tarihli plan tablosu (artık görev planı esas): `docs/rootandadmin-plan.xlsx`.
