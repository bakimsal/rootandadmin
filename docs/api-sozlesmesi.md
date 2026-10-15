# API sözleşmesi

> **Sürüm 0.2 · 15 Ekim 2026.** "Veri modeli" bölümü T1 görevine göre yeniden yazıldı ve ikinizin onayını bekliyor. `docs/gorev-plani.md` bu sürüme göre güncellendi. Uç nokta bölümleri T2'de yeni modele göre baştan yazılacak; şimdilik yalnızca veri modeli kararlarının gerektirdiği değişiklikler işlendi. Değişiklikler önce burada yapılır, sonra koda geçer. Bu dosyaya dokunan PR ikinizin onayı olmadan birleşmez.

**Taban URL:** `/api` · **Format:** JSON · **Tarihler:** ISO 8601, UTC (ekranda `Europe/Istanbul` saat dilimiyle gösterilir) · **Kimlik doğrulama:** httpOnly oturum çerezi (yalnızca `/api/admin/*` ve `/api/auth/me`)

## Veri modeli

### Genel kurallar

- Tüm kimlikler (`id`) `cuid` biçiminde metindir.
- Tüm tarih alanları veritabanında saat dilimli tutulur (Prisma: `@db.Timestamptz(3)`).
- Her `slug` kendi tablosunda benzersizdir. Kategori ve etiket `name` alanları da benzersizdir; çakışmada `409 CONFLICT` döner.
- "İç alan" diye işaretlenen alanlar veritabanında bulunur ama hiçbir API yanıtında dönmez.

### Yazı (Post)

Haber ve blog aynı tabloda tutulur ve `type` ile ayrılır.

| Alan | Tip | Not |
|---|---|---|
| `id` | string | |
| `type` | `NEWS` \| `BLOG` | Zorunlu. Oluşturulduktan sonra değiştirilebilir (bkz. "Tür değişikliği") |
| `title` | string | Zorunlu, en fazla 160 karakter |
| `slug` | string | Benzersiz. Kurallar aşağıda |
| `excerpt` | string \| null | Liste ve SEO için kısa özet, en fazla 300 karakter. Yayında zorunlu |
| `content` | string | Markdown. Taslakta boş olabilir, yayında zorunlu |
| `coverImage` | CoverImage \| null | Aşağıya bakın |
| `status` | `DRAFT` \| `PUBLISHED` | Veritabanında yalnızca bu iki durum tutulur |
| `scheduled` | boolean | **Yalnızca admin yanıtlarında.** Türetilir, saklanmaz: `status = PUBLISHED` ve `publishedAt > şimdi` |
| `publishedAt` | string \| null | Yayın tarihi. Gelecekteki bir tarih yazıyı zamanlanmış yapar |
| `readingTime` | number | Dakika, en az 1 |
| `readingTimeManual` | boolean | `true` ise okuma süresi otomatik hesaplanmaz |
| `severity` | `CRITICAL` \| `HIGH` \| `INFO` \| null | Yalnızca haberde. Haberde varsayılanı `INFO`; blogda her zaman `null` |
| `sourceUrl` | string \| null | Haberin dayandığı kaynağın adresi (`https://`). İsteğe bağlı |
| `category` | CategorySummary \| null | Tek kategori. Haber yayına alınırken zorunlu, blogda isteğe bağlı |
| `tags` | TagSummary[] | |
| `author` | AuthorSummary | |
| `metaTitle` | string \| null | Boşsa `title` kullanılır. En fazla 70 karakter |
| `metaDescription` | string \| null | Boşsa `excerpt` kullanılır. En fazla 160 karakter |
| `createdAt`, `updatedAt` | string | |
| `lastRevalidatedAt` | tarih \| null | **İç alan.** Zamanlanmış yazıların sayfa yenilemesi için (bkz. "Zamanlanmış yazılar") |

**CoverImage:** `{ url, width, height, alt, publicId }`

- `url`, `width`, `height` görsel yükleme yanıtından gelir. `width` ve `height` görselin sayfada yer kaydırmadan yüklenmesi için gereklidir.
- `alt` zorunlu, en fazla 200 karakter. Hem erişilebilirlik hem SEO için.
- `publicId` Cloudinary'deki kimliktir. Görsel değiştirilince ya da yazı silinince eskisi Cloudinary'den silinir. Yalnızca admin yanıtlarında döner.
- Veritabanında düz sütunlar olarak tutulabilir (`coverImageUrl`, `coverImageWidth`…). API'de her zaman bu nesne biçimindedir.

**Görünürlük:** Herkese açık uçlarda yalnızca `status = PUBLISHED` ve `publishedAt <= şimdi` olan yazılar görünür. Admin uçları tüm yazıları döndürür. Admin listesindeki `status` filtresi `DRAFT`, `SCHEDULED` ve `PUBLISHED` değerlerini alır. Buradaki `SCHEDULED` saklanan bir durum değildir, yukarıdaki koşuldan türetilir. Filtrede `PUBLISHED` yalnızca tarihi gelmiş yazıları, `SCHEDULED` tarihi gelmemiş olanları getirir.

**Taslak ve yayın doğrulaması:** Backend'de iki ayrı Zod şeması bulunur.

| Alan | Taslak (`DRAFT`) | Yayın (`PUBLISHED`) |
|---|---|---|
| `type`, `title` | Zorunlu | Zorunlu |
| `content`, `excerpt` | Boş olabilir | Zorunlu |
| `category` | Boş olabilir | Haberde zorunlu, blogda isteğe bağlı |
| `severity` | Haberde boşsa `INFO` olur | Haberde zorunlu; blogda gönderilirse `400` |
| `coverImage` | Boş olabilir | Boş olabilir. Doluysa `alt` zorunlu |

PATCH isteklerinde kontrol, yazının güncellemeden sonraki tam hali üzerinden yapılır. Örneğin yalnızca `{ "status": "PUBLISHED" }` gönderilse bile içeriği boş bir yazı yayına alınamaz.

**Tür değişikliği:** Tür `BLOG` yapılınca backend `severity`'yi kendiliğinden `null` yapar. Tür `NEWS` yapılınca `severity` boşsa `INFO` olur. `400` yalnızca blog olan ya da blog yapılan bir yazı için istekte açıkça bir `severity` değeri gönderilirse döner. Böylece admin panelin türü değiştirirken ayrıca `severity: null` göndermesi gerekmez.

**Slug kuralları:**

1. Slug boş gelirse başlıktan üretilir: `slugify(title, { locale: 'tr', lower: true, strict: true })`. Örnek: "Şifreleme Çıkmazları" → `sifreleme-cikmazlari`.
2. Üretilen slug başka bir yazıda varsa sonuna sırayla `-2`, `-3`… eklenir.
3. Slug elle girildiyse ve başka bir yazıda varsa otomatik ek yapılmaz, `409 CONFLICT` döner (`fields.slug`).
4. Yayınlanmış bir yazının slug'ı değişirse eski link kırılır. Admin panel bu durumda kaydetmeden önce uyarı gösterir. Eski adreslerin yeni adrese yönlendirilmesi sonraki sürüme bırakıldı.

**`publishedAt` kuralları:**

- Yazı yayına alınırken `publishedAt` boşsa o anki zaman yazılır.
- Gelecekteki bir tarih girilirse yazı o tarihe kadar zamanlanmış kalır.
- Yayındaki bir yazı taslağa geri alınırsa `publishedAt` korunur. Tekrar yayına alınınca aynı tarihle görünür; admin isterse tarihi değiştirir.
- Taslakta `publishedAt` dolu olabilir. Bu yalnızca planlanan tarihi gösterir, yazıyı yayına almaz.

**Okuma süresi:** `readingTimeManual = false` ise içerik her kaydedildiğinde sunucuda hesaplanır: kelime sayısı / 200, yukarı yuvarlanır, en az 1. İstek gövdesindeki `readingTime` yalnızca `readingTimeManual = true` ise dikkate alınır.

**Yazma alanları (POST / PATCH `/api/admin/posts`):** `type`, `title`, `slug`, `excerpt`, `content`, `coverImage` (`{ url, width, height, alt, publicId }` ya da `null`), `status`, `publishedAt`, `readingTime`, `readingTimeManual`, `severity`, `sourceUrl`, `categoryId`, `tagIds` (string[]), `metaTitle`, `metaDescription`.

- `author` gövdeden alınmaz; yazar her zaman oturumdaki kullanıcının yazar profilidir.
- Yeni etiket gerekiyorsa admin panel önce `POST /api/admin/tags` ile oluşturur, sonra kimliğini `tagIds` içine koyar.
- `id`, `scheduled`, `createdAt` ve `updatedAt` gövdede gelirse yok sayılır.

### Kategori (Category)

`id`, `name`, `slug`. Herkese açık listede ayrıca `postCount` döner.

- Kategoriler haber filtresi içindir. Başlangıç kategorileri: **zafiyet**, **saldırı**, **araç**.
- `postCount` yalnızca herkese açık görünen yazıları sayar.
- Yazısı olan bir kategori silinemez, `409 CONFLICT` döner (Prisma: `onDelete: Restrict`).
- **CategorySummary** (yazının içinde): `{ name, slug }`

### Etiket (Tag)

`id`, `name`, `slug`. Herkese açık listede ayrıca `postCount` döner. Etiketler serbesttir; bloglarda filtre olarak kullanılır.

- `postCount` yalnızca herkese açık görünen yazıları sayar.
- Bir etiket silinince yalnızca yazılarla bağlantısı silinir, yazılar kalır.
- **TagSummary** (yazının içinde): `{ name, slug }`

### Proje (Project)

| Alan | Tip | Not |
|---|---|---|
| `id` | string | |
| `name` | string | Zorunlu, en fazla 100 karakter |
| `slug` | string | Benzersiz, yazıdakiyle aynı kurallarla üretilir |
| `description` | string | Kart metni, en fazla 300 karakter |
| `language` | string \| null | Ana dil, örn. `Go`, `Python` |
| `repoUrl` | string \| null | `https://` adresi |
| `demoUrl` | string \| null | `https://` adresi |
| `featured` | boolean | Ana sayfada gösterilir. Varsayılan `false` |
| `order` | number | Küçükten büyüğe sıralanır. Varsayılan `0` |
| `createdAt`, `updatedAt` | string | Canlı akıştaki "proje güncellemesi" bunlardan beslenir |

Projelerde taslak durumu yok: kaydedilen proje hemen herkese açıktır.

### Yazar (Author)

| Alan | Tip | Not |
|---|---|---|
| `id` | string | |
| `name` | string | Zorunlu |
| `slug` | string | Benzersiz |
| `role` | string \| null | Ekip kartındaki unvan, örn. "Backend · Güvenlik" |
| `bio` | string \| null | En fazla 500 karakter |
| `avatarUrl` | string \| null | Cloudinary adresi |
| `avatarPublicId` | string \| null | **İç alan.** Fotoğraf değişince eskisi Cloudinary'den silinir, ücretsiz kota dolmasın |
| `linkedinUrl` | string \| null | `https://` adresi |
| `githubUsername` | string \| null | Yalnızca kullanıcı adı, adres değil |

- **AuthorSummary** (yazının içinde): `{ name, slug, avatarUrl }`
- Yazarlar API'den silinemez. Bir yazar yalnızca kendi profilini güncelleyebilir.
- Profil fotoğrafı güncellenirken `avatarUrl` ile birlikte yükleme yanıtındaki `publicId` de gönderilir (`avatarPublicId` olarak saklanır).

### Kullanıcı (User)

Admin girişi için. Her kullanıcı tam olarak bir yazar profiline bağlıdır. Yazardan ayrı tutulur, böylece şifre hash'i herkese açık yazar sorgularına hiçbir zaman karışmaz.

| Alan | Tip | Not |
|---|---|---|
| `id` | string | |
| `email` | string | Benzersiz, küçük harfe çevrilerek saklanır |
| `passwordHash` | string | **İç alan.** argon2 |
| `authorId` | string | Benzersiz (yazarla 1-1) |
| `createdAt` | string | |
| `lastLoginAt` | string \| null | |

`GET /api/auth/me` yanıtı: `{ "data": { "user": { "id", "email" }, "author": Author } }`

### Oturum (Session) — iç model

API'de görünmez. Alanlar: `id`, `tokenHash`, `userId`, `expiresAt`, `createdAt`.

- Girişte `crypto.randomBytes(32)` ile rastgele bir anahtar üretilir. Anahtarın kendisi çerezde, SHA-256 özeti `tokenHash` olarak veritabanında tutulur. Böylece veritabanı sızsa bile çalışan bir oturum ele geçirilemez.
- Oturumlar 7 gün geçerlidir. Çıkışta kayıt silinir. Kullanıcı silinince oturumları da silinir (`onDelete: Cascade`).

### İletişim mesajı (ContactMessage)

| Alan | Tip | Not |
|---|---|---|
| `id` | string | |
| `name` | string | Zorunlu, en fazla 100 karakter |
| `email` | string | Zorunlu, geçerli e-posta |
| `message` | string | Zorunlu, en fazla 2000 karakter |
| `read` | boolean | Varsayılan `false` |
| `createdAt` | string | |

- IP adresi saklanmaz. Hız limiti bellekte tutulur. Kişisel veri en az tutulur (KVKK).
- Tuzak alan (honeypot) veritabanında yer almaz.

### Veritabanı indeksleri

- `Post`: `@@index([type, status, publishedAt])`, ayrıca `categoryId` ve `authorId` için indeks
- `Project`: `@@index([featured, order])`
- `Session`: `tokenHash` benzersiz, `expiresAt` için indeks
- `ContactMessage`: `@@index([read, createdAt])`

### Canlı akış

Ayrı bir tablo değil. Son yayınlanan haberlerden, bloglardan ve projelerden otomatik oluşur. Biçimi T2'de tanımlanacak.

## Ortak yanıt biçimleri

**Liste:**
```json
{ "data": [ ... ], "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```

**Tek kayıt:** `{ "data": { ... } }`

**Hata:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Başlık zorunludur", "fields": { "title": "Zorunlu" } } }
```
Kodlar: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409; örn. slug çakışması, yazısı olan kategoriyi silme), `RATE_LIMITED` (429), `INTERNAL` (500).

## Herkese açık uç noktalar

> T2'de projeler, canlı akış (`/api/feed`) ve iletişim formu (`POST /api/contact`) eklenecek, her uç noktaya örnek yanıt yazılacak.

Yazılar için yalnızca "Görünürlük" kuralına uyan kayıtlar döner.

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/posts` | Sorgu: `page`, `limit` (en fazla 50), `type`, `category`, `severity`, `tag`, `author` (slug). Listede `content` dönmez |
| GET | `/api/posts/:slug` | Yazı detayı, `content` dahil |
| GET | `/api/posts/:slug/related` | İlgili yazılar, en fazla 3 (aşağıya bakın) |
| GET | `/api/search-index` | Arama dizini (aşağıya bakın) |
| GET | `/api/categories` | Her kategori için `postCount` ile |
| GET | `/api/tags` | Her etiket için `postCount` ile |
| GET | `/api/authors` | |
| GET | `/api/authors/:slug` | Yazar ve yazı sayısı |

### İlgili yazılar

Yazı detay sayfasının altında gösterilir (F7). Liste öğesi biçiminde, `content` olmadan döner.

1. Aynı türden (`type`), görünür yazılar arasından seçilir; yazının kendisi hariç.
2. Önce aynı kategoride olan ya da en az bir ortak etiketi bulunan yazılar, ortak etiket sayısına ve sonra `publishedAt`'e göre sıralanır.
3. 3'ten az sonuç çıkarsa kalan yer aynı türün en yeni yazılarıyla doldurulur.

Frontend bu ucu sayfa üretilirken çağırır; okuyucu isteği backend'e gitmez.

### Arama

Okuyucunun arama isteği backend'e gitmez. Render'ın ücretsiz sunucusu uyuyorsa okuyucu yaklaşık 1 dakika beklerdi.

- Frontend, `GET /api/search-index` yanıtını kendi `/search-index.json` adresinde önceden üretir ve yayın yenilemesiyle günceller. Arama tarayıcıda bu dosya üzerinde yapılır.
- Yanıt: herkese açık tüm yazılar için `{ slug, type, title, excerpt, severity, category, tags, publishedAt }` dizisi. Sayfalama yok. `content` dahil değil, dosya küçük kalsın diye.
- Metin araması yalnızca admin listesinde backend'de yapılır (`/api/admin/posts?q=`).

## Kimlik doğrulama

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/login` | Gövde: `{ email, password }`. Başarılıysa çerez set edilir |
| POST | `/api/auth/logout` | Oturum silinir, çerez temizlenir |
| GET | `/api/auth/me` | Giriş yapan kullanıcı ve bağlı yazar profili (biçim "Kullanıcı" bölümünde) |

## Admin uç noktaları (giriş gerekli)

> T2'de projeler ve iletişim mesajları için uç noktalar eklenecek.

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/admin/posts` | Tüm durumlar. Sorgu: `page`, `limit` (en fazla 50), `type`, `status` (`DRAFT` \| `SCHEDULED` \| `PUBLISHED`), `q` |
| GET | `/api/admin/posts/:id` | |
| POST | `/api/admin/posts` | Yeni yazı. Varsayılan `status: DRAFT`. Gövde: "Yazma alanları" |
| PATCH | `/api/admin/posts/:id` | Kısmi güncelleme |
| DELETE | `/api/admin/posts/:id` | Kapak görseli Cloudinary'den de silinir |
| POST | `/api/admin/uploads` | `multipart/form-data`, alan adı `file`. Yanıt: `{ data: { url, width, height, publicId } }`. En fazla 5 MB, jpg/png/webp |
| POST/PATCH/DELETE | `/api/admin/categories[/:id]` | |
| POST/PATCH/DELETE | `/api/admin/tags[/:id]` | |
| PATCH | `/api/admin/authors/:id` | Yalnızca kendi profili, aksi halde `403` |

## Yayın sonrası yenileme

Okuyucu içeriğini etkileyen bir değişiklik olunca backend frontend'in yenileme ucunu çağırır. Böylece önceden üretilmiş sayfalar güncellenir.

`POST {FRONTEND_URL}/api/revalidate` · Başlık: `x-revalidate-secret: <REVALIDATE_SECRET>` · Gövde: `{ "tags": ["posts"] }`

Yenileme sayfa yollarıyla değil, **önbellek etiketleriyle** yapılır. Frontend her veri isteğini ilgili etiketle işaretler, yenileme ucu da gelen etiketler için `revalidateTag()` çağırır. Böylece kategori, etiket, yazar sayfaları, sitemap ve arama dizini ayrıca listelenmeden güncellenir.

| Olay | Gönderilen etiketler |
|---|---|
| Yazı oluşturma, güncelleme veya silme (öncesinde ya da sonrasında herkese açıksa) | `posts` |
| Kategori değişikliği | `categories`, `posts` |
| Etiket değişikliği | `tags`, `posts` |
| Yazar profili değişikliği | `authors`, `posts` |
| Proje değişikliği | `projects` |

İstek başarısız olursa admin işlemi yine başarılı sayılır, hata yalnızca log'a yazılır.

## Zamanlanmış yazılar

Zamanlanmış bir yazı, tarihi gelince herkese açık uçlarda kendiliğinden görünür; ek bir durum değişikliği gerekmez. Ancak önceden üretilmiş sayfaların da yenilenmesi gerekir. Bunun için:

`POST /api/internal/publish-due` · Başlık: `x-cron-secret: <CRON_SECRET>` · Gövde yok

1. Backend `status = PUBLISHED`, `publishedAt <= şimdi` ve (`lastRevalidatedAt` boş ya da `publishedAt`'ten önce) olan yazıları bulur.
2. Bu tür yazı varsa `{ "tags": ["posts"] }` ile yenileme ucunu çağırır. Başarılı olursa bu yazıların `lastRevalidatedAt` alanına şimdiki zamanı yazar.
3. Yanıt: `{ "data": { "revalidated": 2 } }`. Anahtar yanlışsa `401`.

Normal yayınlamada da yenileme başarılı olursa `lastRevalidatedAt` güncellenir. Böylece aynı yazı ikinci kez yenilenmez.

Bu ucu Y4'teki ücretsiz zamanlayıcı (cron-job.org) 14 dakikada bir çağırır. Aynı istek Render sunucusunu da uyanık tutar. Zamanlanmış bir yazı, tarihi geldikten sonra en geç 14 dakika içinde sitede görünür.

## Kararlar (T1)

Önceki taslağın açık soruları:

- **Haberler için ayrı format gerekiyor mu?** Evet, ama ayrı tablo yerine `type = NEWS` ile. Habere özel alanlar: `severity` ve isteğe bağlı `sourceUrl`.
- **Bir yazının birden fazla yazarı olabilir mi?** İlk sürümde hayır, tek yazar. Gerekirse sonradan bir migration ile çoklu yazara geçilir.
- **Zamanlanmış yazılar nasıl yayına girecek?** Okumada tarih kontrolüyle; sayfaların yenilenmesi için `publish-due` ucu. Ayrıntı "Zamanlanmış yazılar" bölümünde.

## Açık sorular

- Bloglar da kategori kullanacak mı, yoksa yalnızca etiketle mi filtrelenecek? Şu anki karar: kategori haberde zorunlu, blogda isteğe bağlı.
- Yazı detay adresleri ne olacak? Öneri: menüyle uyumlu olarak `/haberler/[slug]` ve `/bloglar/[slug]`. Slug iki türde ortak benzersiz olduğu için tek bir `/yazi/[slug]` da mümkün.
- Proje detay sayfası olacak mı (T3'te tasarlanmamış ekran olarak geçiyor)? Olacaksa Project'e Markdown bir `content` alanı eklenmeli.
- Canlı akıştaki "proje güncellemesi" yalnızca yeni projeleri mi kapsıyor, yoksa her düzenlemeyi mi?
