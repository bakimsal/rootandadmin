# Çalışma kuralları

## Branch'ler

- `main` → Yayındaki kod. Doğrudan push yok, yalnızca `dev`'den PR ile birleşir (haftalık).
- `dev` → Geliştirme branch'i. Tüm iş branch'leri buraya PR ile birleşir.
- İş branch'leri `dev`'den açılır ve şu formatta isimlendirilir:
  - `feat/kisa-aciklama` → yeni özellik (örn. `feat/yazi-detay-sayfasi`)
  - `fix/kisa-aciklama` → hata düzeltme
  - `docs/kisa-aciklama` → doküman
  - `chore/kisa-aciklama` → yapılandırma, bağımlılık vb.

## Akış

1. GitHub Projects panosundan bir görev (issue) al, kendine ata.
2. `dev`'i güncelle: `git checkout dev && git pull`
3. Branch aç: `git checkout -b feat/gorev-adi`
4. Küçük ve anlamlı commit'ler at.
5. Push et ve `dev`'e PR aç. PR açıklamasına `Closes #<issue-no>` yaz.
6. **PR'ı diğer kişi inceler ve onaylar.** Kendi PR'ını kendin birleştirme.
7. Birleştikten sonra branch'i sil.

## Commit mesajları

[Conventional Commits](https://www.conventionalcommits.org/) formatı, açıklama Türkçe olabilir:

```
feat(frontend): yazı detay sayfası eklendi
fix(backend): slug çakışması düzeltildi
docs: API sözleşmesine sayfalama eklendi
```

Kapsamlar: `frontend`, `backend`, `docs`, `ci`.

## Gizli bilgiler

- `.env` dosyaları **asla** commit'lenmez. Yeni bir değişken eklediğinde `.env.example` dosyasını güncelle.
- Şifreleri ve API anahtarlarını birbirinize özel mesajla iletin, issue veya PR'a yazmayın.

## API sözleşmesi

Frontend ile backend arasındaki her değişiklik önce [docs/api-sozlesmesi.md](docs/api-sozlesmesi.md) dosyasında yapılır, sonra koda geçer. Sözleşmeyi değiştiren PR'ı iki kişi de görmelidir.
