# Akalın Portfolyo & Headless CMS

Django REST Framework (Python) + React 18 (TypeScript) + Tailwind CSS ile geliştirilmiş, Türkçe-İngilizce çoklu dil (i18n) destekli ve GrapesJS görsel editörü ile güçlendirilmiş gelişmiş kişisel portfolyo ve içerik yönetim sistemi (CMS).

---

## 🚀 Proje Genel Bakış

Bu proje, modern bir yazılım geliştiricinin tüm portfolyo ve içerik yönetim ihtiyaçlarını tek bir çatı altında karşılamak üzere tasarlanmıştır. Geleneksel portfolyo sitelerinden farklı olarak; tamamen özelleştirilmiş, zengin bileşenlere sahip bir **Headless CMS** entegrasyonu sunar. Sürükle-bırak destekli **GrapesJS editör**, Türkçe ve İngilizce dillerini kapsayan **tam i18n altyapısı**, gelişmiş **arama/komut paleti (Cmd+K)**, detaylı kariyer/eğitim zaman çizelgesi, rate-limit korumalı iletişim arayüzü ve tam özellikli medya kütüphanesi projenin temel taşlarını oluşturmaktadır.

---

## ✨ Öne Çıkan Özellikler

### 🌍 Çoklu Dil Desteği (i18n)
- **Arayüz Yerelleştirmesi:** Butonlar, menüler, etiketler ve formlar `react-i18next` altyapısı ile Türkçe ve İngilizce olarak dinamik şekilde değiştirilebilir.
- **İçerik Yerelleştirmesi (Dual-Language Fields):** Veritabanında yer alan blog yazıları, kategoriler, etiketler, projeler, kariyer bilgileri ve site ayarları için hem Türkçe (`tr`) hem de İngilizce (`en`) veri saklanır ve dinamik olarak render edilir.
- **Dil Koruyucu Yönlendirme:** Rotalar dil kodu prefix'li (`/tr/...` veya `/en/...`) olacak şekilde tasarlanmıştır.

### 🎨 Görsel Sayfa/Blog Editörü (GrapesJS)
- **Sürükle-Bırak Tasarım:** Herhangi bir kod yazmaya gerek kalmadan gelişmiş blog yazıları, uyarı kutuları, iki kolonlu düzenler ve zengin içerikler oluşturun.
- **Çift Dil Editörü:** Tek arayüzden yazının hem Türkçe hem de İngilizce versiyonunu sekme yapısıyla kolayca tasarlayın.

### 📊 Admin Kontrol Paneli & Analitik
- **Metrik Kartları:** Toplam yayınlanan/taslak yazılar, projeler ve toplam okuma sayıları.
- **Okuma İstatistikleri:** En çok okunan yazıları gösteren dinamik grafik gösterimleri.
- **Medya Galerisi:** Yüklenen görselleri otomatik WebP formatına dönüştürüp, ölçeklendirerek (max 2048x2048px, quality=85) disk ve CDN performansını optimize eden medya kütüphanesi.
- **Yönetim Modülleri:** Projeler, Kariyer Geçmişi, Kategori ve Etiketler için tam CRUD arayüzleri.
- **Proje Sıralama:** Sürükle-bırak (`@dnd-kit`) ile ana sayfadaki projelerin sıralamasını anında değiştirme.
- **Site Ayarları:** Profil fotoğrafı (Media kütüphanesinden seçilebilir), anasayfa biyografisi, hakkımda biyografisi, CV PDF yükleme ve durum rozeti kontrolü.

### 🔍 Ziyaretçi Deneyimi (Public Site)
- **Komut Paleti (Cmd+K):** Site genelinde blog yazıları ve projeler arasında anında klavye/kısayol tabanlı arama.
- **Blog Yazısı Detayları:** Okuma ilerleme barı, dinamik İçindekiler Tablosu (TOC), başlık anchor linkleri (paylaşım uyumlu), kod bloğu kopyalama butonu, `highlight.js` ile kod renklendirme.
- **İletişim Formu:** Spam korumalı, Django SMTP/mail entegrasyonlu ve saatlik rate-limit kısıtlamalı iletişim formu.
- **SEO Uyumlu:** Otomatik sitemap.xml, canonical URL, RSS 2.0 feed (`feed.xml`) ve sosyal paylaşım kartları meta verileri.

---

## 🛠️ Teknoloji Yığını

### Backend
| Paket | Versiyon | Açıklama |
|-------|----------|----------|
| **Django** | 5.1.5 | Güçlü ve güvenli Python web framework'ü |
| **Django REST Framework** | 3.15.2 | REST API tasarımı ve serializer katmanı |
| **SimpleJWT** | 5.3.1 | JSON Web Token tabanlı kimlik doğrulama |
| **django-cors-headers** | 4.x | Cross-Origin Resource Sharing yönetimi |
| **django-filter** | 24.3 | API üzerinde kategori, etiket ve parametre bazlı filtreleme |
| **Pillow** | 10.x | Görsel işleme, sıkıştırma ve WebP dönüşüm motoru |
| **nh3** | 0.2.x | XSS saldırılarına karşı backend HTML sanitizasyon kütüphanesi |
| **python-decouple** | 3.x | .env dosyaları üzerinden konfigürasyon yönetimi |

### Frontend
| Paket | Versiyon | Açıklama |
|-------|----------|----------|
| **React** | 18.x | Modern UI kütüphanesi |
| **TypeScript** | 5.x | Statik tip güvenliği |
| **Vite** | 5.x / 8.x | Son derece hızlı modül paketleyici ve geliştirme sunucusu |
| **Tailwind CSS** | 3.x / 4.x | Yardımcı sınıf tabanlı modern CSS framework'ü |
| **react-router-dom** | 6.x | Dil prefix'li gelişmiş istemci taraflı routing |
| **Zustand** | 4.x / 5.x | Hafif ve performanslı state yönetimi |
| **Axios** | 1.x | API istekleri ve otomatik 401 token yenileme (Interceptor) |
| **GrapesJS** | 0.21.x / 0.22.x | Görsel editör çekirdeği |
| **highlight.js** | 11.x | Kod blokları için syntax highlighting |
| **DOMPurify** | 3.x | Frontend tarafında HTML güvenlik süzgeci |
| **@dnd-kit** | 6.x | Sürükle-bırak proje sıralama kütüphanesi |

### Altyapı & Veri Depolama
- **PostgreSQL 16** — Üretim ortamı ilişkisel veritabanı.
- **Redis 7** — RSS feed, sitemap ve okuma engeli için önbellek servisi.
- **SQLite3** — Yerel geliştirme ortamı veritabanı.

---

## 📂 Proje Yapısı

```text
akalin_portfolyo/
├── backend/
│   ├── apps/
│   │   ├── posts/           # Blog yazıları, kategoriler, etiketler
│   │   ├── projects/        # Projeler (teknoloji yığınları, detaylar)
│   │   ├── media/           # Medya kütüphanesi, WebP dönüşüm motoru
│   │   ├── site_settings/   # Singleton site ayarları, profil resimleri, CV
│   │   └── career/          # Kariyer ve eğitim zaman çizelgesi verileri
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py      # Ortak konfigürasyonlar
│   │   │   ├── dev.py       # SQLite ve console email kullanan lokal ayarlar
│   │   │   └── prod.py      # PostgreSQL, S3, Redis ve SMTP kullanan üretim ayarları
│   │   ├── urls.py          # Global URL yönlendirici
│   │   └── views.py         # RSS feed (feed.xml), sitemap.xml ve iletişim API'leri
│   ├── tests/               # Backend birim ve entegrasyon testleri
│   ├── media/               # Geliştirme ortamında yüklenen medya dosyaları (git-ignored)
│   ├── manage.py            # Django yönetim betiği
│   ├── Dockerfile           # Backend container yapılandırması
│   └── .env.example         # Örnek çevre değişkenleri dosyası
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/      # HomePage, BlogListPage, BlogPostPage, ProjectsPage, ...
│   │   │   └── admin/       # LoginPage, AdminDashboard, GrapesEditor, SiteSettingsForm...
│   │   ├── components/      # Layout, CommandPalette, TableOfContents, CareerTimeline...
│   │   ├── api/             # Axios API entegrasyonları (posts, projects, media, settings)
│   │   ├── store/           # Zustand durum yönetimi (authStore, themeStore)
│   │   ├── hooks/           # useDocumentMeta (Dinamik SEO başlığı & açıklaması)
│   │   ├── i18n/            # Çoklu dil konfigürasyonu ve dil kaynakları (tr/en)
│   │   ├── utils/           # tocUtils, string yardımcıları
│   │   └── types/           # Global TypeScript tip ve arayüz tanımları
│   ├── index.html           # Giriş HTML şablonu
│   ├── package.json         # NPM bağımlılık tanımları
│   └── vite.config.ts       # Vite yapılandırması
├── docker-compose.yml       # Çoklu container orkestrasyonu (PostgreSQL, Redis, Django)
└── README.md                # Proje dokümantasyonu (Bu dosya)
```

---

## ⚙️ Kurulum & Çalıştırma

### Gereksinimler
- Python 3.12+
- Node.js 20+
- SQLite3 (Yerel geliştirme için)

### 1. Backend Kurulumu

```bash
cd backend

# Sanal ortam oluşturup aktif edin
python -m venv .venv
# Linux/macOS için:
source .venv/bin/activate
# Windows (PowerShell) için:
.\.venv\Scripts\Activate.ps1

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Çevre değişkenleri şablonunu kopyalayın
cp .env.example .env

# Veritabanını oluşturun (Lokalde SQLite3 dosyası oluşturur)
python manage.py migrate

# Yönetim paneli için admin (superuser) kullanıcısı oluşturun
python manage.py createsuperuser

# Geliştirme sunucusunu başlatın
python manage.py runserver
# Sunucu http://127.0.0.1:8000/ adresinde çalışmaya başlayacaktır.
```

### 2. Frontend Kurulumu

```bash
cd frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
# Uygulama http://localhost:5173/ adresinde çalışmaya başlayacaktır.
```

---

## 🔒 Ortam Değişkenleri

### Backend `.env` yapılandırması
Lokal geliştirme için aşağıdaki `.env` şablonu yeterlidir:

```env
SECRET_KEY=rastgele-uzun-ve-guvenli-bir-karakter-dizisi
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173

# E-posta Ayarları (Geliştirme aşamasında terminale yazdırır)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
CONTACT_EMAIL=alici-adres@domain.com
```

### Frontend `.env.local` yapılandırması
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📝 API Referansı

### Kimlik Doğrulama
- `POST /api/token/` - Kullanıcı adı ve şifre ile JWT (Access & Refresh) üretir.
- `POST /api/token/refresh/` - Refresh token kullanarak yeni Access token üretir.
- `POST /api/token/blacklist/` - Çıkış yaparken mevcut refresh token'ı geçersiz kılar.

### Blog Yönetimi
- `GET /api/posts/` - Yayındaki tüm yazıları listeler. (Arama için `?search=`, kategori için `?categories__slug=`, etiket için `?tags__slug=` filtreleri kullanılabilir).
- `GET /api/posts/<slug>/` - Belirli bir yazının detayını getirir. (Taslak önizleme için `?preview=1` parametresi ve admin token gerekir).
- `POST /api/posts/<slug>/view/` - Yazı okunma sayacını 1 artırır (IP bazlı 24 saatlik engelleme korumalı).
- `GET /api/admin/posts/` - [Admin] Taslaklar dahil tüm yazıları listeler.
- `POST /api/admin/posts/` - [Admin] GrapesJS HTML ve JSON verileriyle yeni yazı ekler.
- `PUT/PATCH /api/admin/posts/<id>/` - [Admin] Yazıyı düzenler.
- `DELETE /api/admin/posts/<id>/` - [Admin] Yazıyı arşivler (Soft delete).

### Projeler
- `GET /api/projects/` - Yayındaki tüm projeleri sıralı listeler.
- `GET /api/projects/<slug>/` - Proje detayını getirir.
- `POST /api/admin/projects/` - [Admin] Yeni proje ekler.
- `PATCH /api/admin/projects/reorder/` - [Admin] Sürükle-bırak sonrası yeni sıralamayı toplu kaydeder.

### Kariyer ve Eğitim Geçmişi
- `GET /api/career/` - Eğitim, iş ve gönüllülük zaman çizgisi verilerini döner.
- `POST /api/admin/career/` - [Admin] Yeni kariyer girdisi oluşturur.

---

## 🧪 Testlerin Çalıştırılması

### Backend Testleri (pytest)
```bash
cd backend
# Tüm testleri çalıştırır
pytest
# Kapsam raporu oluşturur
pytest --cov=apps --cov-report=term-missing
```

### Frontend Testleri (Vitest)
```bash
cd frontend
# Testleri tek seferlik çalıştırır
npm test
```

---

## 🔗 Lisans ve Katkıda Bulunma
Bu proje kişisel portfolyo ve CMS gereksinimleri için özel olarak geliştirilmiştir. Kodlar üzerinde özgürce değişiklik yapabilir, kendi sunucunuzda yayına alabilirsiniz.
