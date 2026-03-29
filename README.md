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
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `APP_BASE_URL`
- `SESSION_SECRET`
- `RESEND_API_KEY`
- `RESEND_SENDER_EMAIL`
- `RESEND_SENDER_NAME`
- `FILE_STORAGE_ROOT`

## Deploy Notları

- Uygulama `seltifika.semmrjournal.com` için ayrı deploy edilmelidir.
- `public/certificate-backgrounds` klasöründeki arka plan dosyalarını gerçek görsellerle değiştirin.
- Runtime PDF dosyaları `FILE_STORAGE_ROOT` altında saklanır.
- Hosting kurulumu ve GitHub akışı için [`DEPLOYMENT.md`](/Users/mrt/Documents/Codex/SeltifikaTüretme/DEPLOYMENT.md) dosyasını izleyin.
