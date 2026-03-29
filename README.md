# Seltifika

Bağımsız sertifika üretim ve yönetim paneli.

## Başlangıç

1. `.env` içindeki placeholder değerleri gerçek bilgilerle değiştirin.
2. `npm install`
3. `npm run prisma:migrate:dev`
4. `npm run prisma:seed`
5. `npm run dev`

## Gerekli Ortam Değişkenleri

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `APP_BASE_URL`
- `SESSION_SECRET`
- `RESEND_API_KEY`
- `RESEND_SENDER_EMAIL`
- `RESEND_SENDER_NAME`
- `FILE_STORAGE_ROOT`
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob kullanılıyorsa)
- `CERTIFICATE_FONT_REGULAR_PATH` (opsiyonel)
- `CERTIFICATE_FONT_BOLD_PATH` (opsiyonel)

## Deploy Notları

- Uygulama `seltifika.semmrjournal.com` için ayrı deploy edilmelidir.
- Local geliştirmede arka plan dosyaları `public/certificate-backgrounds` içinden okunabilir.
- Production ortamında arka plan yüklemeleri ve PDF çıktıları için `BLOB_READ_WRITE_TOKEN` tanımlanırsa Vercel Blob kullanılır.
- Arka plan yüklemeleri yalnızca `PNG`, `JPG` ve `JPEG` destekler.
- Blob tanımsızsa runtime PDF dosyaları `FILE_STORAGE_ROOT` altında saklanır.
- Sunucuda uygun Unicode fontları yoksa `CERTIFICATE_FONT_REGULAR_PATH` ve `CERTIFICATE_FONT_BOLD_PATH` ile TTF font yollarını tanımlayın.
- Hosting kurulumu ve GitHub akışı için [`DEPLOYMENT.md`](/Users/mrt/Documents/Codex/SeltifikaTüretme/DEPLOYMENT.md) dosyasını izleyin.
