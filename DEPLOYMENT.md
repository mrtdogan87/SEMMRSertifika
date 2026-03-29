# Deployment

## Yerel Hazırlık

1. `.env` içini gerçek değerlerle doldurun.
2. Gerekirse `public/certificate-backgrounds/*.png` dosyalarını gerçek sertifika zeminleriyle değiştirin.
3. Veritabanını hazırlayın:
   - `npm run prisma:migrate:dev`
   - `npm run prisma:seed`
4. Uygulamayı test edin:
   - `npm run lint`
   - `npm run build`

## Hosting.com.tr Üzerinde

1. `seltifika.semmrjournal.com` subdomain’ini oluşturun.
2. Uygulamayı Node.js destekli Application Hosting alanına bağlayın.
3. Uzak çalışma dizininde yazılabilir klasör tanımlayın:
   - `storage/certificates`
4. Environment değişkenlerini panelden tanımlayın.
5. Build/start komutlarını şu şekilde ayarlayın:
   - Build: `npm run build`
   - Start: `npm run start`
6. İlk deploy sonrası şunları çalıştırın:
   - `npm run prisma:migrate:deploy`
   - `npm run prisma:seed`

## GitHub Akışı

1. Yeni GitHub reposu oluşturun.
2. Yerelde remote ekleyin:
   - `git remote add origin <REPO_URL>`
3. İlk push:
   - `git add .`
   - `git commit -m "Initial seltifika app"`
   - `git push -u origin main`
4. GitHub Actions CI, her push ve pull request’te `lint` ve `build` çalıştırır.

## Eksik Kalan Manuel Adımlar

- Gerçek PostgreSQL bağlantı bilgilerini eklemek
- Gerçek Resend anahtarlarını eklemek
- Sertifika arka planlarını gerçek görsellerle değiştirmek
- Hosting panelinde subdomain yönlendirmesini tamamlamak
