// API sözleşmesinin TypeScript karşılığı (docs/api-sozlesmesi.md, sürüm 0.3).
// Tek gerçek kaynak sözleşmedir. Bir alan değişecekse önce sözleşme güncellenir,
// sonra bu dosya ve backend'deki Zod şemaları. Backend şemaları bu tiplerle birebir aynı olmalı.
// Tarihler ISO 8601 metni olarak gelir (UTC).

/** ISO 8601 tarih metni, örn. "2026-10-27T07:30:00.000Z". */
export type IsoDate = string;

// ---------------------------------------------------------------------------
// Ortak yanıt biçimleri
// ---------------------------------------------------------------------------

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Tek kayıt ya da sayfasız liste: { data }. */
export interface DataResponse<T> {
  data: T;
}

/** Sayfalı liste: yalnızca yazı listeleri ve iletişim mesajları. */
export interface PagedResponse<T> {
  data: T[];
  meta: PageMeta;
}

export type ErrorCode =
  | "VALIDATION_ERROR" // 400
  | "UNAUTHORIZED" // 401
  | "FORBIDDEN" // 403
  | "NOT_FOUND" // 404
  | "CONFLICT" // 409
  | "PAYLOAD_TOO_LARGE" // 413
  | "RATE_LIMITED" // 429
  | "INTERNAL"; // 500

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    /** Alan bazında hata mesajları, örn. { title: "Zorunlu" }. */
    fields?: Record<string, string>;
  };
}

export interface PaginationQuery {
  /** 1'den başlar, varsayılan 1. */
  page?: number;
  /** Varsayılan 12, en fazla 50. */
  limit?: number;
}

// ---------------------------------------------------------------------------
// Sabit değerler
// ---------------------------------------------------------------------------

export type PostType = "NEWS" | "BLOG";
export type PostStatus = "DRAFT" | "PUBLISHED";
/** Admin listesindeki filtre. SCHEDULED saklanmaz, PUBLISHED + ileri tarihli publishedAt'ten türetilir. */
export type AdminPostStatusFilter = "DRAFT" | "SCHEDULED" | "PUBLISHED";
export type Severity = "CRITICAL" | "HIGH" | "INFO";

/** Önbellek etiketleri (fetch next.tags ve /api/revalidate gövdesi). */
export type CacheTag = "posts" | "categories" | "tags" | "authors" | "projects";

// ---------------------------------------------------------------------------
// Özet tipler (yazının içinde)
// ---------------------------------------------------------------------------

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface TagSummary {
  id: string;
  name: string;
  slug: string;
}

export interface AuthorSummary {
  name: string;
  slug: string;
  avatarUrl: string | null;
}

/** Herkese açık yanıtlardaki kapak görseli. */
export interface CoverImage {
  url: string;
  width: number;
  height: number;
  /** Zorunlu, en fazla 200 karakter. */
  alt: string;
}

/** Admin yanıtlarındaki kapak görseli: Cloudinary kimliği de döner. */
export interface AdminCoverImage extends CoverImage {
  publicId: string;
}

// ---------------------------------------------------------------------------
// Yazılar
// ---------------------------------------------------------------------------

/** Listeler ve ilgili yazılar. content dönmez. */
export interface PostSummary {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: CoverImage | null;
  publishedAt: IsoDate;
  readingTime: number;
  /** Blogda her zaman null. */
  severity: Severity | null;
  /** Blogda null olabilir. */
  category: CategorySummary | null;
  tags: TagSummary[];
  author: AuthorSummary;
}

/** Yazı detayı. */
export interface Post extends PostSummary {
  content: string;
  sourceUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: IsoDate;
}

/** Admin yazı detayı: tüm durumlar, taslak alanları boş olabilir. */
export interface AdminPost {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: AdminCoverImage | null;
  status: PostStatus;
  /** Türetilir: status = PUBLISHED ve publishedAt > şimdi. */
  scheduled: boolean;
  publishedAt: IsoDate | null;
  readingTime: number;
  readingTimeManual: boolean;
  severity: Severity | null;
  sourceUrl: string | null;
  category: CategorySummary | null;
  tags: TagSummary[];
  author: AuthorSummary;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/** Admin yazı listesi satırı. */
export interface AdminPostSummary {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  status: PostStatus;
  scheduled: boolean;
  publishedAt: IsoDate | null;
  severity: Severity | null;
  category: CategorySummary | null;
  author: AuthorSummary;
  updatedAt: IsoDate;
}

/** POST / PATCH /api/admin/posts gövdesi ("Yazma alanları"). */
export interface PostWriteInput {
  type: PostType;
  title: string;
  /** Boşsa başlıktan üretilir. */
  slug?: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: AdminCoverImage | null;
  /** Varsayılan DRAFT. */
  status?: PostStatus;
  /** İleri bir tarih yazıyı zamanlar. Yayına alırken boşsa şimdiki zaman yazılır. */
  publishedAt?: IsoDate | null;
  /** Yalnızca readingTimeManual = true ise dikkate alınır. */
  readingTime?: number;
  readingTimeManual?: boolean;
  /** Yalnızca haberde. Blogda gönderilirse 400. */
  severity?: Severity | null;
  sourceUrl?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

/** POST /api/admin/posts: type ve title zorunlu. */
export type PostCreateInput = PostWriteInput;
/** PATCH /api/admin/posts/:id: değişen alanlar. */
export type PostUpdateInput = Partial<PostWriteInput>;

export interface PostListQuery extends PaginationQuery {
  type?: PostType;
  /** Kategori slug'ı. */
  category?: string;
  severity?: Severity;
  /** Etiket slug'ı. */
  tag?: string;
  /** Yazar slug'ı. */
  author?: string;
}

export interface AdminPostListQuery extends PaginationQuery {
  type?: PostType;
  status?: AdminPostStatusFilter;
  /** Başlık, özet ve içerikte tam metin arama. */
  q?: string;
}

/** GET /api/search-index öğesi. */
export interface SearchIndexItem {
  slug: string;
  type: PostType;
  title: string;
  excerpt: string | null;
  severity: Severity | null;
  category: CategorySummary | null;
  tags: TagSummary[];
  publishedAt: IsoDate;
}

// ---------------------------------------------------------------------------
// Kategori, etiket
// ---------------------------------------------------------------------------

export interface Category extends CategorySummary {
  /** Yalnızca herkese açık görünen yazıları sayar. */
  postCount: number;
}

export interface Tag extends TagSummary {
  /** Yalnızca herkese açık görünen yazıları sayar. */
  postCount: number;
}

/** POST /api/admin/categories ve /api/admin/tags. */
export interface TaxonomyCreateInput {
  name: string;
  /** Boşsa addan üretilir. */
  slug?: string;
}

export type TaxonomyUpdateInput = Partial<TaxonomyCreateInput>;

// ---------------------------------------------------------------------------
// Yazar, kullanıcı
// ---------------------------------------------------------------------------

export interface Author {
  id: string;
  name: string;
  slug: string;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  /** Yalnızca kullanıcı adı, adres değil. */
  githubUsername: string | null;
  /** Yalnızca herkese açık görünen yazıları sayar. */
  postCount: number;
}

/** PATCH /api/admin/authors/:id (yalnızca kendi profili). */
export interface AuthorUpdateInput {
  name?: string;
  slug?: string;
  role?: string | null;
  bio?: string | null;
  /** Fotoğraf değişince avatarPublicId ile birlikte gönderilir. */
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  linkedinUrl?: string | null;
  githubUsername?: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
}

/** POST /api/auth/login ve GET /api/auth/me yanıtındaki data. */
export interface Me {
  user: SessionUser;
  author: Author;
}

export interface LoginInput {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Proje
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  language: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  featured: boolean;
  order: number;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface ProjectListQuery {
  /** Yalnızca öne çıkan projeler. */
  featured?: true;
}

export interface ProjectCreateInput {
  name: string;
  description: string;
  slug?: string;
  language?: string | null;
  repoUrl?: string | null;
  demoUrl?: string | null;
  featured?: boolean;
  order?: number;
}

export type ProjectUpdateInput = Partial<ProjectCreateInput>;

/** PUT /api/admin/projects/order: tüm projelerin kimlikleri, yeni sırayla. */
export interface ProjectOrderInput {
  ids: string[];
}

// ---------------------------------------------------------------------------
// Canlı akış
// ---------------------------------------------------------------------------

export type FeedKind = "NEWS" | "BLOG" | "PROJECT";
/** Şeritteki rozet. Türkçe metinler (KRİTİK, HABER, BLOG, PROJE) frontend'de. */
export type FeedLabel = "CRITICAL" | "NEWS" | "BLOG" | "PROJECT";

export interface FeedItem {
  kind: FeedKind;
  label: FeedLabel;
  title: string;
  slug: string;
  /** Yalnızca projede: demoUrl, yoksa repoUrl. */
  externalUrl: string | null;
  /** Yazıda publishedAt, projede createdAt. */
  date: IsoDate;
}

// ---------------------------------------------------------------------------
// İletişim
// ---------------------------------------------------------------------------

/** POST /api/contact gövdesi. */
export interface ContactInput {
  /** En fazla 100 karakter. */
  name: string;
  email: string;
  /** En fazla 2000 karakter. */
  message: string;
  /** Tuzak alan: formda gizli, her zaman boş gönderilir. */
  website?: string;
}

export interface ContactReceived {
  received: true;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: IsoDate;
}

export interface ContactMessageListQuery extends PaginationQuery {
  read?: boolean;
}

export interface ContactMessageUpdateInput {
  read: boolean;
}

// ---------------------------------------------------------------------------
// Görsel yükleme, yenileme, zamanlayıcı, sağlık
// ---------------------------------------------------------------------------

/** POST /api/admin/uploads yanıtındaki data. */
export interface UploadResult {
  url: string;
  width: number;
  height: number;
  publicId: string;
}

/** Frontend'in POST /api/revalidate gövdesi (backend gönderir). */
export interface RevalidateInput {
  tags: CacheTag[];
}

export interface RevalidateResult {
  revalidated: CacheTag[];
}

/** POST /api/internal/publish-due yanıtındaki data. */
export interface PublishDueResult {
  revalidated: number;
}

/** GET /api/health: zarfsız. */
export interface HealthResponse {
  status: "ok";
}

// ---------------------------------------------------------------------------
// Uç nokta → yanıt eşlemesi (lib/api.ts ve sahte veri için kısa yol)
// ---------------------------------------------------------------------------

export type PostListResponse = PagedResponse<PostSummary>;
export type PostDetailResponse = DataResponse<Post>;
export type RelatedPostsResponse = DataResponse<PostSummary[]>;
export type SearchIndexResponse = DataResponse<SearchIndexItem[]>;
export type CategoryListResponse = DataResponse<Category[]>;
export type TagListResponse = DataResponse<Tag[]>;
export type AuthorListResponse = DataResponse<Author[]>;
export type AuthorDetailResponse = DataResponse<Author>;
export type ProjectListResponse = DataResponse<Project[]>;
export type FeedResponse = DataResponse<FeedItem[]>;
export type ContactResponse = DataResponse<ContactReceived>;
export type MeResponse = DataResponse<Me>;

export type AdminPostListResponse = PagedResponse<AdminPostSummary>;
export type AdminPostResponse = DataResponse<AdminPost>;
export type UploadResponse = DataResponse<UploadResult>;
export type CategoryResponse = DataResponse<Category>;
export type TagResponse = DataResponse<Tag>;
export type ProjectResponse = DataResponse<Project>;
export type AuthorResponse = DataResponse<Author>;
export type ContactMessageListResponse = PagedResponse<ContactMessage>;
export type ContactMessageResponse = DataResponse<ContactMessage>;
export type RevalidateResponse = DataResponse<RevalidateResult>;
export type PublishDueResponse = DataResponse<PublishDueResult>;
