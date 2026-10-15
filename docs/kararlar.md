# Teknoloji kararları

Kriter: ücretsiz ya da çok cüzi maliyet. Ücretsiz plan bilgileri 10 Ekim 2026'da servislerin kendi sayfalarından kontrol edildi; değişebilir.

| Konu | Karar | Gerekçe |
|---|---|---|
| Frontend | Next.js + TypeScript | Sayfalar önceden üretilebilir (SSG/ISR). SEO iyi olur, okuyucu backend'i beklemez. |
| Stil | Tailwind CSS | Tamamen özelleştirilebilir; hazır bileşen kütüphanesi görünümünden kaçınmak kolay. |
| İçerik | Markdown + Shiki | Teknik içerik için en pratik format, kod blokları doğal destekleniyor. |
| Backend | Fastify + TypeScript + Zod | Frontend ile aynı dil, tipler paylaşılır. Hafif; ücretsiz sunucuda az kaynak harcar. |
| ORM | Prisma | Şema kodla tanımlanır, migration'lar yönetilir. |
| Veritabanı | PostgreSQL — Neon Free | Kart istemiyor, süresiz plan. Proje başına 1 GB. 5 dk boşta kalınca uyur. Render'ın ücretsiz Postgres'i 30 günde siliniyor, o yüzden tercih edilmedi. |
| Görseller | Cloudinary Free | Kart istemiyor, 3 kullanıcı, ayda 25 kredi (1 kredi = 1 GB depolama / 1 GB trafik / 1.000 dönüşüm). |
| Admin girişi | Kendi auth: argon2/bcrypt + httpOnly cookie | İki kullanıcı için yeterli, harici bağımlılık yok. |
| Frontend yayını | Vercel Hobby | Ücretsiz. **Yalnızca kişisel / ticari olmayan kullanım.** Reklam veya sponsorluk gelirse ücretli plan gerekir. |
| Backend yayını | Render Free | Ayda 750 saat. 15 dk trafik yoksa uyur, uyanması ~1 dk. Okuyucu sayfaları önceden üretildiği için gecikme çoğunlukla admin panelde hissedilir. |
| Analitik | Vercel Web Analytics | Hobby'de ayda 50.000 olay dahil. |
| Okuyucu araması | Tarayıcıda, önceden üretilmiş arama dizini üzerinde | Okuyucu isteği uyuyan backend'e gitmez, ek servis gerekmez. PostgreSQL tam metin araması yalnızca admin panelde. |
| Zamanlayıcı | cron-job.org (ücretsiz) | 14 dakikada bir zamanlanmış yazıların sayfalarını yeniler (`publish-due`), aynı istekle Render'ı uyanık tutar. |
| Repo | Tek repo (monorepo) | İki ayrı repoyu senkron tutmaktan kolay. |

## Ertelenen

- **Alan adı:** Tek gerçek maliyet. O zamana kadar ücretsiz `vercel.app` adresi.
