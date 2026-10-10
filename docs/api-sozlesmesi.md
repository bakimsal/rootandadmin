# API sözleşmesi — TASLAK

> Bu bir başlangıç taslağıdır. 13–14 Ekim'deki toplantıda birlikte gözden geçirilip kesinleşecek. Değişiklikler önce burada yapılır, sonra koda geçer.

**Taban URL:** `/api` · **Format:** JSON · **Tarihler:** ISO 8601 (UTC) · **Kimlik doğrulama:** httpOnly cookie (yalnızca `/api/admin/*` ve `/api/auth/me`)

## Veri modeli

### Yazı (Post)

| Alan | Tip | Not |
|---|---|---|
| `id` | string (cuid) | |
| `title` | string | Zorunlu, en fazla 160 karakter |
| `slug` | string | Benzersiz. Boş gelirse başlıktan üretilir (Türkçe karakterler dönüştürülür) |
| `excerpt` | string | Liste ve SEO için kısa özet, en fazla 300 karakter |
| `content` | string | Markdown |
| `coverImage` | string \| null | Cloudinary URL |
| `status` | `DRAFT` \| `PUBLISHED` \| `SCHEDULED` | |
| `publishedAt` | string \| null | Yayın tarihi. `SCHEDULED` ise gelecekteki tarih |
| `readingTime` | number | Dakika. İçerikten otomatik hesaplanır (~200 kelime/dk), admin elle değiştirebilir |
| `readingTimeManual` | boolean | `true` ise otomatik hesaplama yapılmaz |
| `author` | Author | |
| `category` | Category | Tek kategori |
| `tags` | Tag[] | |
| `metaTitle` | string \| null | Boşsa `title` kullanılır |
| `metaDescription` | string \| null | Boşsa `excerpt` kullanılır |
| `createdAt`, `updatedAt` | string | |

### Yazar (Author)

`id`, `name`, `slug`, `bio`, `avatar`, `socials` (`{ github?, x?, linkedin?, website? }`)

### Kategori (Category)

`id`, `name`, `slug`, `description`. Başlangıç kategorileri: **Öğrendiklerimiz**, **Haberler**, **Düşünceler**.

### Etiket (Tag)

`id`, `name`, `slug`

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
Kodlar: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409, örn. slug çakışması), `INTERNAL` (500).

## Herkese açık uç noktalar

Yalnızca `PUBLISHED` ve `publishedAt <= şimdi` olan yazılar döner.

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/posts` | Sorgu: `page`, `limit` (en fazla 50), `category`, `tag`, `author` (slug), `q` (arama). Listede `content` dönmez |
| GET | `/api/posts/:slug` | Yazı detayı, `content` dahil |
| GET | `/api/posts/:slug/related` | Aynı kategori/etiketlerden en fazla 3 yazı *(sonraki sürüm)* |
| GET | `/api/categories` | Her kategori için `postCount` ile |
| GET | `/api/tags` | Her etiket için `postCount` ile |
| GET | `/api/authors` | |
| GET | `/api/authors/:slug` | Yazar ve yazı sayısı |

## Kimlik doğrulama

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/login` | Gövde: `{ email, password }`. Başarılıysa cookie set edilir |
| POST | `/api/auth/logout` | Cookie silinir |
| GET | `/api/auth/me` | Giriş yapan kullanıcı ve bağlı yazar profili |

## Admin uç noktaları (giriş gerekli)

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/admin/posts` | Tüm durumlar. Sorgu: `page`, `limit`, `status`, `q` |
| GET | `/api/admin/posts/:id` | |
| POST | `/api/admin/posts` | Yeni yazı. Varsayılan `status: DRAFT` |
| PATCH | `/api/admin/posts/:id` | Kısmi güncelleme |
| DELETE | `/api/admin/posts/:id` | |
| POST | `/api/admin/uploads` | `multipart/form-data`, alan adı `file`. Yanıt: `{ data: { url, width, height } }`. En fazla 5 MB, jpg/png/webp |
| POST/PATCH/DELETE | `/api/admin/categories[/:id]` | |
| POST/PATCH/DELETE | `/api/admin/tags[/:id]` | |
| PATCH | `/api/admin/authors/:id` | Profil güncelleme |

## Yayın sonrası yenileme

Backend bir yazı yayınlandığında, güncellendiğinde veya silindiğinde frontend'in yenileme uç noktasını çağırır, böylece önceden üretilmiş sayfalar güncellenir:

`POST {FRONTEND_URL}/api/revalidate` · Başlık: `x-revalidate-secret: <REVALIDATE_SECRET>` · Gövde: `{ "paths": ["/", "/blog/yazi-slug"] }`

## Açık sorular

- Haberler için ayrı, daha kısa bir format gerekiyor mu, yoksa "Haberler" kategorisi yeterli mi?
- Bir yazının birden fazla yazarı olabilir mi?
- Zamanlanmış yazılar nasıl yayına girecek: her istekte tarih kontrolü mü (önerilen, ek altyapı gerektirmez), yoksa zamanlanmış görev mi?
