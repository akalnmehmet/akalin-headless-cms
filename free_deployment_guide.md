# Ücretsiz Canlıya Alma (Deployment) Rehberi

Bu kılavuz, **Akalın Portfolyo & CMS** projesini hiçbir sunucu veya veritabanı ücreti ödemeden internette nasıl yayınlayacağınızı adım adım açıklamaktadır.

---

## 🏗️ 1. Hedef Ücretsiz Mimari

Uygulamanın bileşenleri için kullanacağımız ücretsiz servisler şunlardır:

| Bileşen | Sağlayıcı (Provider) | Ücretsiz Paket Özellikleri |
| :--- | :--- | :--- |
| **Frontend (React)** | **Vercel** veya **Netlify** | Ömür boyu ücretsiz, otomatik SSL, GitHub entegrasyonu ile her `git push` işleminde otomatik derleme. |
| **Backend (Django)** | **Render** | Ücretsiz Web Service. Tek dezavantajı: 15 dakika istek gelmezse uyku moduna geçer, sonraki ilk istekte uyanması ~50 saniye sürer. |
| **Veritabanı (Postgres)** | **Neon.tech** | 3 GB depolama alanına sahip, yüksek performanslı, sunucusuz (Serverless) Postgres veritabanı. Kalıcı olarak ücretsizdir. |
| **Dosya Saklama (Medya)** | **Cloudinary** veya **Supabase** | Render ücretsiz diskleri geçici (ephemeral) olduğu için sunucu yeniden başladığında yüklenen resimler silinir. Cloudinary (25GB bant genişliği/depolama) veya Supabase Storage (1GB) kullanarak dosyaları kalıcı olarak ücretsiz saklayabiliriz. |

---

## ⚙️ 2. Aşama Aşama Yapılması Gerekenler

### Adım 2.1: Neon.tech Ücretsiz PostgreSQL Veritabanı Açma
1. [Neon.tech](https://neon.tech/) adresine gidin ve GitHub hesabınızla giriş yapın.
2. Yeni bir proje oluşturun (örn. `akalin-cms`).
3. Size verilen **PostgreSQL Connection String** bilgisini kopyalayın (şuna benzer: `postgresql://neondb_owner:***.neon.tech/neondb?sslmode=require`).
4. Bu bağlantı adresini backend çevre değişkenlerinizde `DATABASE_URL` olarak kullanacağız.

---

### Adım 2.2: Cloudinary (Medya Depolama) Hesabı Açma
1. [Cloudinary](https://cloudinary.com/) hesabı oluşturun.
2. Dashboard ekranından **Cloud Name**, **API Key** ve **API Secret** bilgilerini kopyalayın.
3. Django projesine `django-cloudinary-storage` kütüphanesini ekleyip `settings/prod.py` dosyasına entegre edeceğiz (Bu adımı kod tarafında sizin için yapabilirim).

---

### Adım 2.3: Backend'i Render Üzerinde Yayına Alma
1. [Render.com](https://render.com/) adresine üye olun ve GitHub hesabınızı bağlayın.
2. **New +** butonuna basarak **Web Service** seçin.
3. GitHub üzerindeki `akalin_CMS` deponuzu seçin.
4. Ayarları şu şekilde yapın:
   - **Name:** `akalin-backend`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. **Environment Variables** (Çevre Değişkenleri) kısmına şunları ekleyin:
   - `DEBUG` = `False`
   - `SECRET_KEY` = `guclu-ve-rastgele-bir-hash-degeri`
   - `DATABASE_URL` = *(Neon.tech'ten aldığınız bağlantı dizesi)*
   - `ALLOWED_HOSTS` = `akalin-backend.onrender.com` (Render'ın size vereceği domain)
   - `CORS_ALLOWED_ORIGINS` = `https://akalin-frontend.vercel.app` (Vercel'in vereceği domain)
   - `CLOUDINARY_CLOUD_NAME` = *(Cloudinary Cloud Name)*
   - `CLOUDINARY_API_KEY` = *(Cloudinary API Key)*
   - `CLOUDINARY_API_SECRET` = *(Cloudinary API Secret)*
   - `EMAIL_BACKEND` = `django.core.mail.backends.smtp.EmailBackend`
   - *(İsteğe bağlı SMTP ayarlarınız: EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)*

---

### Adım 2.4: Frontend'i Vercel Üzerinde Yayına Alma
React Router (Single Page App) kullandığımız için, Vercel üzerinde sayfalar yenilendiğinde 404 hatası almamak adına `vercel.json` adında bir yönlendirme dosyası oluşturmamız gerekir:

1. `frontend/public/` veya projenin root klasörüne aşağıdaki `vercel.json` dosyasını oluşturun:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

2. [Vercel](https://vercel.com/) hesabınıza girin ve GitHub deponuzu içeri aktarın (import).
3. **Framework Preset** olarak `Vite` seçin.
4. **Root Directory** alanını `frontend` olarak ayarlayın.
5. **Environment Variables** kısmına ekleyin:
   - `VITE_API_BASE_URL` = `https://akalin-backend.onrender.com` *(Render'da oluşan API URL'iniz)*
6. **Deploy** butonuna basın. Birkaç dakika içinde siteniz `https://akalin-portfolyo.vercel.app` gibi bir adreste yayına girecektir.

---

## 🛠️ 3. Kod Tarafında Yapılması Gereken Hazırlıklar

Sisteminizin canlıya tam uyumlu çalışabilmesi için yapabileceğimiz ufak güncellemeler:

1. **Cloudinary Entegrasyonu:** Backend bağımlılıklarına `django-cloudinary-storage` eklemek ve `settings/prod.py` içerisine medya sınıflarını kaydetmek.
2. **Vercel Yönlendirme Kuralı:** `frontend/vercel.json` dosyasını oluşturmak.
3. **Veritabanı Ayarı:** Python'da PostgreSQL veritabanı bağlantılarını kolaylaştırmak için `dj-database-url` paketini eklemek.

**Bu kod güncellemelerini yapmamı onaylıyor musunuz?** Onay verirseniz gerekli kod değişikliklerini hemen uygulayıp GitHub'a gönderebilirim.
