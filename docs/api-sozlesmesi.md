# API sözleşmesi

> **Sürüm 0.3 · 28 Ekim 2026.** 0.2'de veri modeli kesinleşti (T1). 0.3'te uç noktalar yeni modele göre baştan yazıldı; her ucun isteği, örnek yanıtı ve hata kodları burada (T2). TypeScript tipleri `frontend/src/types/api.ts` içinde; backend'in Zod şemaları bu tiplerle birebir aynı olmalı. Değişiklikler önce burada yapılır, sonra koda geçer. Bu dosyaya dokunan PR ikinizin onayı olmadan birleşmez.

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
- **CategorySummary** (yazının içinde): `{ id, name, slug }`. `id` admin formlarında `categoryId` olarak kullanılır.

### Etiket (Tag)

`id`, `name`, `slug`. Herkese açık listede ayrıca `postCount` döner. Etiketler serbesttir; bloglarda filtre olarak kullanılır.

- `postCount` yalnızca herkese açık görünen yazıları sayar.
- Bir etiket silinince yalnızca yazılarla bağlantısı silinir, yazılar kalır.
- **TagSummary** (yazının içinde): `{ id, name, slug }`. `id` admin formlarında `tagIds` içinde kullanılır.

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
| `createdAt`, `updatedAt` | string | Canlı akışta yeni projeler `createdAt` ile yer alır |

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

Ayrı bir tablo değil. Son yayınlanan haberlerden, bloglardan ve yeni eklenen projelerden oluşur. Biçimi `GET /api/feed` altında.

## Ortak kurallar

### Yanıt biçimleri

**Sayfalı liste:** yalnızca `GET /api/posts`, `GET /api/admin/posts` ve `GET /api/admin/contact-messages`.
```
{ "data": [ ... ], "meta": { "page": 1, "limit": 12, "total": 42, "totalPages": 4 } }
```

**Sayfasız liste:** diğer bütün listeler (kategoriler, etiketler, yazarlar, projeler, canlı akış, arama dizini, ilgili yazılar). Kayıt sayısı az olduğu için hepsi tek seferde döner: `{ "data": [ ... ] }`

**Tek kayıt:** `{ "data": { ... } }`

**Gövdesiz başarı:** `204 No Content` (silme ve çıkış).

**İstisna:** `GET /api/health` zarfsız `{ "status": "ok" }` döner (B1, Render'ın sağlık kontrolü).

**Hata:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Başlık zorunludur", "fields": { "title": "Zorunlu" } } }
```

| Kod | HTTP | Ne zaman |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Gövde ya da sorgu Zod şemasına uymuyor. `fields` alan bazında mesaj içerir |
| `UNAUTHORIZED` | 401 | Oturum yok ya da süresi dolmuş; hatalı giriş; yanlış gizli anahtar |
| `FORBIDDEN` | 403 | Oturum var ama işlem yasak (başkasının profili) ya da `Origin` başlığı `FRONTEND_URL` değil |
| `NOT_FOUND` | 404 | Kayıt yok. Herkese açık uçlarda taslak ve tarihi gelmemiş yazılar da `404` döner |
| `CONFLICT` | 409 | Slug ya da ad çakışması, yazısı olan kategoriyi silme |
| `PAYLOAD_TOO_LARGE` | 413 | Yüklenen dosya 5 MB'tan büyük ya da gövde 1 MB'tan büyük |
| `RATE_LIMITED` | 429 | Hız limiti aşıldı. `Retry-After` başlığı saniye cinsinden bekleme süresini verir |
| `INTERNAL` | 500 | Beklenmeyen hata. Ayrıntı yalnızca log'a yazılır, yanıtta gösterilmez |

### Sayfalama ve sıralama

- `page` 1'den başlar, varsayılan `1`. `limit` varsayılan `12` (F6'daki sayfa başı kayıt), en fazla `50`.
- Aralık dışı ya da sayı olmayan değer `400 VALIDATION_ERROR` döner. Son sayfadan büyük `page` boş `data` ve doğru `meta` döner.
- Yazılar `publishedAt`'e göre yeniden eskiye sıralanır. Admin listesi `updatedAt`'e göre yeniden eskiye sıralanır.

### Admin uçlarının ortak kuralları

- Hepsi oturum çerezi ister. Çerez yoksa ya da oturum geçersizse `401`.
- Veri değiştiren istekler (POST, PATCH, PUT, DELETE) `Origin` başlığı `FRONTEND_URL` değilse `403` döner (B3).
- Gövdesi Zod şemasına uymayan istek `400`, bulunamayan kayıt `404` döner. Bu üç kod aşağıdaki her admin ucunda geçerlidir; tabloda ayrıca yazılmaz.

### Önbellek etiketleri

Frontend, sayfa üretirken yaptığı her isteği aşağıdaki etiketle işaretler (`fetch(url, { next: { tags } })`). "Yayın sonrası yenileme" bu etiketleri kullanır.

| Uç nokta | Etiketler |
|---|---|
| `/api/posts`, `/api/posts/:slug`, `/api/posts/:slug/related`, `/api/search-index` | `posts` |
| `/api/categories` | `categories`, `posts` |
| `/api/tags` | `tags`, `posts` |
| `/api/authors`, `/api/authors/:slug` | `authors`, `posts` |
| `/api/projects` | `projects` |
| `/api/feed` | `posts`, `projects` |

## Herkese açık uç noktalar

Oturum gerektirmez. Yazılar için yalnızca "Görünürlük" kuralına uyan kayıtlar döner. Bu uçları okuyucunun tarayıcısı değil, frontend sayfa üretirken çağırır. Tek istisna `POST /api/contact`.

### Yanıt tipleri

**PostSummary** (listeler, ilgili yazılar):

```json
{
  "id": "cm2q8x1v40001zafiyet01",
  "type": "NEWS",
  "title": "OpenSSH'ta uzaktan kod çalıştırma açığı",
  "slug": "openssh-uzaktan-kod-calistirma-acigi",
  "excerpt": "CVE-2026-1234 numaralı açık, kimlik doğrulama öncesinde kod çalıştırmaya izin veriyor. Yama yayınlandı.",
  "coverImage": {
    "url": "https://res.cloudinary.com/rootandadmin/image/upload/v1/rootandadmin/openssh.webp",
    "width": 1600,
    "height": 900,
    "alt": "Terminal ekranında OpenSSH sürüm çıktısı"
  },
  "publishedAt": "2026-10-27T07:30:00.000Z",
  "readingTime": 4,
  "severity": "CRITICAL",
  "category": { "id": "cm2q8cat0001zafiyet", "name": "zafiyet", "slug": "zafiyet" },
  "tags": [{ "id": "cm2q8tag0001openssh", "name": "OpenSSH", "slug": "openssh" }],
  "author": { "name": "Buğra Gedik", "slug": "bugra-gedik", "avatarUrl": "https://res.cloudinary.com/rootandadmin/image/upload/v1/rootandadmin/bugra.webp" }
}
```

**Post** (detay): PostSummary alanlarına ek olarak `content`, `sourceUrl`, `metaTitle`, `metaDescription`, `updatedAt`.

```json
{
  "...": "PostSummary alanları",
  "content": "## Ne oldu?\n\nOpenSSH 9.9 öncesi sürümlerde ...",
  "sourceUrl": "https://www.openssh.com/security.html",
  "metaTitle": null,
  "metaDescription": null,
  "updatedAt": "2026-10-27T09:12:44.000Z"
}
```

Blog yazısında `severity` her zaman `null`, `category` `null` olabilir.

### `GET /api/posts`

Yazı listesi. `content` dönmez.

| Sorgu | Tip | Not |
|---|---|---|
| `page`, `limit` | number | Bkz. "Sayfalama" |
| `type` | `NEWS` \| `BLOG` | |
| `category` | string | Kategori slug'ı |
| `severity` | `CRITICAL` \| `HIGH` \| `INFO` | Yalnızca haberlerde anlamlı |
| `tag` | string | Etiket slug'ı |
| `author` | string | Yazar slug'ı |

Örnek: `GET /api/posts?type=NEWS&category=zafiyet&page=1`

```json
{
  "data": [ { "...": "PostSummary" } ],
  "meta": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
}
```

Hatalar: `400` (geçersiz sorgu). Var olmayan kategori, etiket ya da yazar slug'ı hata değil, boş liste döner.

### `GET /api/posts/:slug`

Yazı detayı, `content` dahil. Yanıt: `{ "data": Post }`. Hatalar: `404` (yok, taslak ya da tarihi gelmemiş).

Frontend gelen `type` ile adresi karşılaştırır: `/bloglar/...` adresinden bir haber istenirse `/haberler/...` adresine yönlendirir.

### `GET /api/posts/:slug/related`

En fazla 3 ilgili yazı, PostSummary biçiminde. Seçim kuralı aşağıda, "İlgili yazılar" başlığında.

```json
{ "data": [ { "...": "PostSummary" }, { "...": "PostSummary" } ] }
```

Hatalar: `404` (asıl yazı yok ya da görünmüyor).

### `GET /api/search-index`

Herkese açık tüm yazıların arama dizini. Sayfasız.

```json
{
  "data": [
    {
      "slug": "openssh-uzaktan-kod-calistirma-acigi",
      "type": "NEWS",
      "title": "OpenSSH'ta uzaktan kod çalıştırma açığı",
      "excerpt": "CVE-2026-1234 numaralı açık, kimlik doğrulama öncesinde kod çalıştırmaya izin veriyor. Yama yayınlandı.",
      "severity": "CRITICAL",
      "category": { "id": "cm2q8cat0001zafiyet", "name": "zafiyet", "slug": "zafiyet" },
      "tags": [{ "id": "cm2q8tag0001openssh", "name": "OpenSSH", "slug": "openssh" }],
      "publishedAt": "2026-10-27T07:30:00.000Z"
    }
  ]
}
```

Hata yok (yazı yoksa boş dizi).

### `GET /api/categories`

```json
{ "data": [ { "id": "cm2q8cat0001zafiyet", "name": "zafiyet", "slug": "zafiyet", "postCount": 7 } ] }
```

Ada göre alfabetik. Hata yok.

### `GET /api/tags`

```json
{ "data": [ { "id": "cm2q8tag0001openssh", "name": "OpenSSH", "slug": "openssh", "postCount": 2 } ] }
```

Ada göre alfabetik. Hata yok.

### `GET /api/authors`

Ekip kartları ve yazar sayfaları için. `avatarPublicId` dönmez.

```json
{
  "data": [
    {
      "id": "cm2q8aut0001bugra",
      "name": "Buğra Gedik",
      "slug": "bugra-gedik",
      "role": "Backend · Güvenlik",
      "bio": "Sızma testleri ve sunucu güvenliği üzerine yazıyor.",
      "avatarUrl": "https://res.cloudinary.com/rootandadmin/image/upload/v1/rootandadmin/bugra.webp",
      "linkedinUrl": "https://www.linkedin.com/in/bugragedik",
      "githubUsername": "bugragedik",
      "postCount": 5
    }
  ]
}
```

Ada göre alfabetik. Hata yok.

### `GET /api/authors/:slug`

Tek yazar, `postCount` dahil. Yazarın yazıları `GET /api/posts?author=<slug>` ile alınır. Yanıt: `{ "data": Author }`. Hatalar: `404`.

### `GET /api/projects`

| Sorgu | Tip | Not |
|---|---|---|
| `featured` | `true` | Yalnızca öne çıkan projeler (ana sayfa) |

```json
{
  "data": [
    {
      "id": "cm2q8prj0001portscan",
      "name": "portscan-lite",
      "slug": "portscan-lite",
      "description": "Go ile yazılmış, tek dosyalık hızlı port tarayıcı.",
      "language": "Go",
      "repoUrl": "https://github.com/bakimsal/portscan-lite",
      "demoUrl": null,
      "featured": true,
      "order": 0,
      "createdAt": "2026-10-20T10:00:00.000Z",
      "updatedAt": "2026-10-20T10:00:00.000Z"
    }
  ]
}
```

`order`'a göre küçükten büyüğe, eşitse `createdAt`'e göre yeniden eskiye. Hatalar: `400` (`featured` için geçersiz değer).

### `GET /api/feed`

Ana sayfadaki kayan şerit. Son 8 kayıt, tarihe göre yeniden eskiye: yayınlanmış haberler, bloglar ve yeni eklenen projeler.

```json
{
  "data": [
    {
      "kind": "NEWS",
      "label": "CRITICAL",
      "title": "OpenSSH'ta uzaktan kod çalıştırma açığı",
      "slug": "openssh-uzaktan-kod-calistirma-acigi",
      "externalUrl": null,
      "date": "2026-10-27T07:30:00.000Z"
    },
    {
      "kind": "PROJECT",
      "label": "PROJECT",
      "title": "portscan-lite",
      "slug": "portscan-lite",
      "externalUrl": "https://github.com/bakimsal/portscan-lite",
      "date": "2026-10-20T10:00:00.000Z"
    }
  ]
}
```

- `kind`: `NEWS` | `BLOG` | `PROJECT`. Frontend adresi bundan kurar: `/haberler/<slug>`, `/bloglar/<slug>`, proje için `externalUrl`.
- `label`: şeritteki rozet. `CRITICAL` (önemi kritik olan haber), `NEWS`, `BLOG`, `PROJECT`. Türkçe karşılıkları (KRİTİK, HABER, BLOG, PROJE) frontend'de yazılır.
- `externalUrl`: yalnızca projede dolu: `demoUrl`, yoksa `repoUrl`. İkisi de yoksa `null`.
- `date`: yazıda `publishedAt`, projede `createdAt`.

Hata yok.

### `POST /api/contact`

İletişim formu. Okuyucunun tarayıcısından doğrudan çağrılan tek herkese açık uç. Sitenin kendi `/api` adresi üzerinden backend'e gider (F10).

Gövde:

```json
{ "name": "Ayşe Yılmaz", "email": "ayse@example.com", "message": "Merhaba, ...", "website": "" }
```

- `name` en fazla 100, `message` en fazla 2000 karakter; `email` geçerli e-posta.
- `website` tuzak alandır (honeypot): formda gizlidir, insanlar boş bırakır. Doluysa mesaj kaydedilmez ama yanıt yine başarılıdır.

Yanıt `201`: `{ "data": { "received": true } }`

Hatalar: `400`, `429` (aynı IP'den saatte 3'ten fazla mesaj).

### `GET /api/health`

Render'ın sağlık kontrolü (B1). Yanıt `200`: `{ "status": "ok" }`. Veritabanına bağlanmaz, böylece Neon uyurken de hızlı cevap verir.

### İlgili yazılar

Yazı detay sayfasının altında gösterilir (F7). Seçim kuralı:

1. Aynı türden (`type`), görünür yazılar arasından seçilir; yazının kendisi hariç.
2. Önce aynı kategoride olan ya da en az bir ortak etiketi bulunan yazılar, ortak etiket sayısına ve sonra `publishedAt`'e göre sıralanır.
3. 3'ten az sonuç çıkarsa kalan yer aynı türün en yeni yazılarıyla doldurulur.

### Arama

Okuyucunun arama isteği backend'e gitmez. Render'ın ücretsiz sunucusu uyuyorsa okuyucu yaklaşık 1 dakika beklerdi.

- Frontend, `GET /api/search-index` yanıtını kendi `/search-index.json` adresinde önceden üretir ve yayın yenilemesiyle günceller. Arama tarayıcıda bu dosya üzerinde yapılır.
- `content` dizine dahil değil, dosya küçük kalsın diye.
- Metin araması yalnızca admin listesinde backend'de yapılır (`/api/admin/posts?q=`).

## Kimlik doğrulama

### `POST /api/auth/login`

Gövde: `{ "email": "abdulbaki@example.com", "password": "..." }`

Yanıt `200`, oturum çerezi set edilir. Gövde `GET /api/auth/me` ile aynıdır:

```json
{
  "data": {
    "user": { "id": "cm2q8usr0001abdulbaki", "email": "abdulbaki@example.com" },
    "author": { "...": "Author, postCount dahil" }
  }
}
```

Hatalar:
- `400`: alanlar eksik ya da biçimsiz.
- `401`: e-posta ya da şifre yanlış. Mesaj her zaman aynıdır: "E-posta veya şifre hatalı".
- `429`: aynı IP'den 15 dakikada 5'ten fazla deneme.

### `POST /api/auth/logout`

Oturum silinir, çerez temizlenir. Yanıt `204`. Oturum zaten yoksa da `204` döner.

### `GET /api/auth/me`

Giriş yapan kullanıcı ve bağlı yazar profili. Yanıt: `POST /api/auth/login` ile aynı. Hatalar: `401`.

## Admin uç noktaları (giriş gerekli)

Ortak kurallar yukarıda: `401`, `403` (`Origin`), `400`, `404`.

### Yazılar

**AdminPost**: Post alanlarına ek olarak `status`, `scheduled`, `readingTimeManual`, `createdAt`; `coverImage` içinde `publicId` de döner.

```json
{
  "id": "cm2q8x1v40001zafiyet01",
  "type": "NEWS",
  "title": "OpenSSH'ta uzaktan kod çalıştırma açığı",
  "slug": "openssh-uzaktan-kod-calistirma-acigi",
  "excerpt": "CVE-2026-1234 numaralı açık, kimlik doğrulama öncesinde kod çalıştırmaya izin veriyor. Yama yayınlandı.",
  "content": "## Ne oldu?\n\nOpenSSH 9.9 öncesi sürümlerde ...",
  "coverImage": {
    "url": "https://res.cloudinary.com/rootandadmin/image/upload/v1/rootandadmin/openssh.webp",
    "width": 1600,
    "height": 900,
    "alt": "Terminal ekranında OpenSSH sürüm çıktısı",
    "publicId": "rootandadmin/openssh"
  },
  "status": "PUBLISHED",
  "scheduled": false,
  "publishedAt": "2026-10-27T07:30:00.000Z",
  "readingTime": 4,
  "readingTimeManual": false,
  "severity": "CRITICAL",
  "sourceUrl": "https://www.openssh.com/security.html",
  "category": { "id": "cm2q8cat0001zafiyet", "name": "zafiyet", "slug": "zafiyet" },
  "tags": [{ "id": "cm2q8tag0001openssh", "name": "OpenSSH", "slug": "openssh" }],
  "author": { "name": "Buğra Gedik", "slug": "bugra-gedik", "avatarUrl": "https://res.cloudinary.com/rootandadmin/image/upload/v1/rootandadmin/bugra.webp" },
  "metaTitle": null,
  "metaDescription": null,
  "createdAt": "2026-10-26T18:02:11.000Z",
  "updatedAt": "2026-10-27T09:12:44.000Z"
}
```

**AdminPostSummary** (admin listesi): `id`, `type`, `title`, `slug`, `status`, `scheduled`, `publishedAt`, `severity`, `category`, `author`, `updatedAt`.

| Metot ve yol | İstek | Yanıt | Ek hatalar |
|---|---|---|---|
| `GET /api/admin/posts` | Sorgu: `page`, `limit`, `type`, `status` (`DRAFT` \| `SCHEDULED` \| `PUBLISHED`), `q` (başlık, özet ve içerikte tam metin arama) | `200`, sayfalı AdminPostSummary listesi | — |
| `GET /api/admin/posts/:id` | — | `200`, `{ data: AdminPost }` | — |
| `POST /api/admin/posts` | Gövde: "Yazma alanları" (Veri modeli bölümünde). `type` ve `title` zorunlu, `status` varsayılanı `DRAFT` | `201`, `{ data: AdminPost }` | `409` (elle girilen slug çakışıyor) |
| `PATCH /api/admin/posts/:id` | Gövde: yazma alanlarından değişenler | `200`, `{ data: AdminPost }` | `409` (slug çakışması) |
| `DELETE /api/admin/posts/:id` | — | `204`. Kapak görseli Cloudinary'den de silinir | — |

Örnek: taslak oluşturma.

```json
{ "type": "BLOG", "title": "Ev laboratuvarı kurmak", "tagIds": ["cm2q8tag0002homelab"] }
```

Örnek: yazıyı ileri tarihe zamanlama.

```json
{ "status": "PUBLISHED", "publishedAt": "2026-11-03T06:00:00.000Z" }
```

Yayın doğrulaması geçmezse `400` alan bazında döner:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Yayına almak için eksik alanlar var",
    "fields": { "content": "Yayında zorunlu", "excerpt": "Yayında zorunlu", "categoryId": "Haberde zorunlu" }
  }
}
```

### Görsel yükleme

`POST /api/admin/uploads` · `multipart/form-data`, alan adı `file`. Kapak görselleri ve profil fotoğrafları için.

Yanıt `201`:

```json
{ "data": { "url": "https://res.cloudinary.com/rootandadmin/image/upload/v1/rootandadmin/openssh.webp", "width": 1600, "height": 900, "publicId": "rootandadmin/openssh" } }
```

Ek hatalar: `400` (dosya yok, ya da içeriği jpg, png veya webp değil; tür dosyanın ilk baytlarından anlaşılır), `413` (5 MB'tan büyük).

### Kategoriler ve etiketler

Admin panel listeleri herkese açık `GET /api/categories` ve `GET /api/tags` uçlarından alır.

| Metot ve yol | İstek | Yanıt | Ek hatalar |
|---|---|---|---|
| `POST /api/admin/categories` | `{ "name": "zafiyet", "slug": "zafiyet" }` (`slug` isteğe bağlı, boşsa addan üretilir) | `201`, `{ data: Category }` | `409` (ad ya da slug var) |
| `PATCH /api/admin/categories/:id` | `{ "name"?, "slug"? }` | `200`, `{ data: Category }` | `409` |
| `DELETE /api/admin/categories/:id` | — | `204` | `409` (kategoride yazı var; taslaklar da sayılır) |
| `POST /api/admin/tags` | `{ "name": "OpenSSH", "slug"? }` | `201`, `{ data: Tag }` | `409` |
| `PATCH /api/admin/tags/:id` | `{ "name"?, "slug"? }` | `200`, `{ data: Tag }` | `409` |
| `DELETE /api/admin/tags/:id` | — | `204`. Yazılarla bağlantısı silinir, yazılar kalır | — |

### Projeler

| Metot ve yol | İstek | Yanıt | Ek hatalar |
|---|---|---|---|
| `GET /api/admin/projects` | — | `200`, sayfasız Project listesi (`GET /api/projects` ile aynı sıra) | — |
| `POST /api/admin/projects` | `{ "name", "description", "slug"?, "language"?, "repoUrl"?, "demoUrl"?, "featured"?, "order"? }` | `201`, `{ data: Project }` | `409` (slug) |
| `PATCH /api/admin/projects/:id` | Aynı alanlardan değişenler | `200`, `{ data: Project }` | `409` |
| `DELETE /api/admin/projects/:id` | — | `204` | — |
| `PUT /api/admin/projects/order` | `{ "ids": ["cm2q8prj0002...", "cm2q8prj0001..."] }` (tüm projeler, yeni sırayla) | `200`, sayfasız Project listesi | `400` (liste eksik, fazla ya da tekrarlı) |

Sıralama ucu F12'deki "sıralamayı değiştir" için: admin panel sürükle bırakla sırayı değiştirir, tek istekle kaydeder. Backend `order` alanlarını listedeki sıraya göre `0, 1, 2…` olarak yazar.

### Yazar profili

Yazarlar oluşturulmaz ve silinmez; seed ile gelirler (B2). Admin yalnızca kendi profilini günceller.

`PATCH /api/admin/authors/:id`

Gövde: `{ "name"?, "slug"?, "role"?, "bio"?, "avatarUrl"?, "avatarPublicId"?, "linkedinUrl"?, "githubUsername"? }`. Fotoğraf değişince `avatarUrl` ile `avatarPublicId` birlikte gönderilir; eski fotoğraf Cloudinary'den silinir.

Yanıt `200`: `{ data: Author }` (`postCount` dahil). Ek hatalar: `403` (başkasının profili), `409` (slug).

### İletişim mesajları

| Metot ve yol | İstek | Yanıt |
|---|---|---|
| `GET /api/admin/contact-messages` | Sorgu: `page`, `limit`, `read` (`true` \| `false`) | `200`, sayfalı ContactMessage listesi, yeniden eskiye |
| `PATCH /api/admin/contact-messages/:id` | `{ "read": true }` | `200`, `{ data: ContactMessage }` |
| `DELETE /api/admin/contact-messages/:id` | — | `204` |

```json
{
  "data": [
    {
      "id": "cm2q8msg0001",
      "name": "Ayşe Yılmaz",
      "email": "ayse@example.com",
      "message": "Merhaba, OpenSSH yazınızla ilgili bir sorum var...",
      "read": false,
      "createdAt": "2026-10-27T12:40:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
}
```

Okunmamış mesaj sayısı için `?read=false&limit=1` isteğindeki `meta.total` kullanılır.

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

Frontend'in yanıtı: `200` `{ "data": { "revalidated": ["posts"] } }`. Başlık yanlışsa `401 UNAUTHORIZED`, gövde geçersizse `400 VALIDATION_ERROR`. Bilinmeyen etiketler yok sayılır.

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

T1 sırasında çıkan sorular. Bu sürümü onaylayan PR'da itiraz edilmezse geçerlidir:

- **Bloglar kategori kullanacak mı?** Kategori haberde zorunlu, blogda isteğe bağlı. Bloglar etiketle filtrelenir (F6).
- **Yazı detay adresleri ne olacak?** Menüyle uyumlu olarak `/haberler/[slug]` ve `/bloglar/[slug]`. Slug iki türde ortak benzersiz olduğu için yanlış türün adresiyle gelen istek doğru adrese yönlendirilir.
- **Proje detay sayfası olacak mı?** İlk sürümde hayır. Proje kartları doğrudan `repoUrl` ve `demoUrl` adreslerine gider. Gerekirse sonraki sürümde Project'e Markdown bir `content` alanı eklenir.
- **Canlı akıştaki "proje" kaydı neyi kapsar?** Yalnızca yeni eklenen projeleri (`createdAt`). Her düzenleme akışa düşerse şerit aynı projeyle dolar.

## Kararlar (T2)

Bu sürümü onaylayan PR'da itiraz edilmezse geçerlidir:

- **Sayfalama nerede?** Yalnızca yazı listelerinde ve iletişim mesajlarında. Kategori, etiket, yazar, proje, canlı akış ve arama dizini az kayıtlı olduğu için tek seferde döner.
- **Varsayılan sayfa boyu:** 12 (F6), en fazla 50.
- **Özet tiplerinde `id`:** CategorySummary ve TagSummary `id` içerir; admin formu ayrı istek atmadan seçili kategoriyi ve etiketleri bilir.
- **Canlı akış biçimi:** `kind`, `label`, `title`, `slug`, `externalUrl`, `date`. Rozetlerin Türkçe metni frontend'de.
- **Tuzak alanın adı:** `website`. Botlar bu adı genelde doldurur.
- **Proje sıralaması:** tek istekle (`PUT /api/admin/projects/order`), tek tek `order` güncellemek yerine.
- **Yeni hata kodu:** `PAYLOAD_TOO_LARGE` (413), B7'deki 6 MB testi için.
- **`/api/health` zarfsız:** `{ "status": "ok" }`, B1'de yazdığı gibi.

## Açık sorular

Şu an yok.
