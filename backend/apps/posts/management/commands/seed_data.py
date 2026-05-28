"""
Geliştirme için zengin mock veri oluşturur.
Tüm UX özelliklerini (TOC, syntax highlight, progress bar, arama) test eder.

Kullanım:
    python manage.py seed_data           # veri yoksa ekler
    python manage.py seed_data --reset   # mevcut veriyi silip yeniden oluşturur
"""

from django.core.management.base import BaseCommand

from apps.career.models import CareerEntry
from apps.posts.models import BlogPost, Category, Tag
from apps.projects.models import Project
from apps.site_settings.models import SiteSettings


class Command(BaseCommand):
    help = "Geliştirme için zengin örnek veri oluşturur"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Mevcut veriyi sil ve yeniden oluştur",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            BlogPost.objects.all().delete()
            Category.objects.all().delete()
            Tag.objects.all().delete()
            Project.objects.all().delete()
            CareerEntry.objects.all().delete()
            self.stdout.write("Mevcut veriler silindi.")

        # ── Site Ayarları ─────────────────────────────────────────────────────
        settings = SiteSettings.load()
        settings.owner_name = "Mehmet Akalın"
        settings.owner_title = "Yazılım Geliştirici & Robotik Mühendisi"
        settings.owner_bio = (
            "Yazılım mühendisliği ve robotik alanlarında çalışıyorum. "
            "Backend sistemler, ROS2 tabanlı otonom navigasyon ve DevOps pipeline'ları üzerine projeler geliştiriyorum. "
            "Django, React ve Docker ekosisteminde full-stack projeler inşa ediyorum."
        )
        settings.status_text = "Aktif geliştirme yapıyor — yeni projelere açık"
        settings.status_active = True
        settings.skills = [
            "Python", "Django", "DRF",
            "React", "TypeScript",
            "ROS2", "C++",
            "Docker", "PostgreSQL",
            "GitHub Actions",
        ]
        settings.github_url = "https://github.com/mehmetakalin"
        settings.linkedin_url = "https://linkedin.com/in/mehmetakalin"
        settings.save()

        # ── Kategoriler ───────────────────────────────────────────────────────
        cat_backend, _ = Category.objects.get_or_create(
            slug="backend",
            defaults={"name": "Backend", "description": "Sunucu taraflı geliştirme, API tasarımı, veritabanı"},
        )
        cat_robotik, _ = Category.objects.get_or_create(
            slug="robotik",
            defaults={"name": "Robotik", "description": "ROS2, SLAM, otonom sistemler ve gömülü yazılım"},
        )
        cat_devops, _ = Category.objects.get_or_create(
            slug="devops",
            defaults={"name": "DevOps", "description": "Docker, CI/CD, bulut altyapı ve otomasyon"},
        )
        cat_frontend, _ = Category.objects.get_or_create(
            slug="frontend",
            defaults={"name": "Frontend", "description": "React, TypeScript ve modern web arayüzleri"},
        )

        # ── Etiketler ─────────────────────────────────────────────────────────
        tag_django, _ = Tag.objects.get_or_create(slug="django",     defaults={"name": "Django",     "color": "#0ca678"})
        tag_react,  _ = Tag.objects.get_or_create(slug="react",      defaults={"name": "React",      "color": "#61dafb"})
        tag_ros2,   _ = Tag.objects.get_or_create(slug="ros2",       defaults={"name": "ROS2",       "color": "#22c55e"})
        tag_docker, _ = Tag.objects.get_or_create(slug="docker",     defaults={"name": "Docker",     "color": "#2496ed"})
        tag_python, _ = Tag.objects.get_or_create(slug="python",     defaults={"name": "Python",     "color": "#f59e0b"})
        tag_ts,     _ = Tag.objects.get_or_create(slug="typescript", defaults={"name": "TypeScript", "color": "#3178c6"})
        tag_pg,     _ = Tag.objects.get_or_create(slug="postgresql", defaults={"name": "PostgreSQL", "color": "#336791"})
        tag_jwt,    _ = Tag.objects.get_or_create(slug="jwt",        defaults={"name": "JWT",        "color": "#d63aff"})

        # ── Blog Yazısı 1 — Derin teknik içerik (TOC testi için) ─────────────
        post1, created1 = BlogPost.objects.get_or_create(
            slug="grapesjs-headless-cms-mimarisi",
            defaults={
                "title": "GrapesJS Headless CMS: Tam Teknik Mimari",
                "summary": "GrapesJS görsel editörünü Django DRF backend ve React 18 frontend ile birleştiren decoupled CMS sisteminin kapsamlı teknik analizi. İkili içerik saklama, XSS koruma katmanları ve JWT auth akışı.",
                "content_html": """
<h2>Giriş ve Motivasyon</h2>
<p>Modern içerik yönetim sistemleri iki temel sorunla boğuşur: <strong>yazarın deneyimi</strong> ve <strong>geliştiricinin özgürlüğü</strong>.
Geleneksel CMS'ler (WordPress, Drupal) yazara WYSIWYG sunarken frontend'i kısıtlar.
Headless CMS'ler ise frontend özgürlüğü sağlar ama yazara ham Markdown veya JSON bırakır.</p>

<p>GrapesJS bu iki dünyayı birleştiriyor: yazara görsel bir blok editörü sunarken backend'e temiz HTML + JSON çifti gönderiyor.</p>

<h2>İkili İçerik Saklama Stratejisi</h2>
<p>GrapesJS iki farklı formatta çıktı üretir ve biz her ikisini de veritabanında saklıyoruz:</p>

<h3>content_html — Ziyaretçiye Sunulan</h3>
<p>Sanitize edilmiş HTML, doğrudan <code>dangerouslySetInnerHTML</code> ile render ediliyor.
Performans için önbelleklenebilir, CDN'e koyulabilir statik içerik.</p>

<h3>content_json — Editöre Yüklenen</h3>
<p>GrapesJS bileşen ağacının JSON temsili. Admin editörü açtığında bu veriyi yükleyip tam düzenleme yapabiliyor.
Sürüm kontrolü ve içerik geçmişi için de kullanılabilir.</p>

<h2>XSS Koruma Katmanları</h2>
<p>İki ayrı noktada XSS temizlemesi yapılıyor — defence in depth prensibi:</p>

<h3>Backend: nh3 ile Sanitize</h3>
<p>Veri veritabanına yazılmadan önce Python tarafında temizleniyor:</p>
<pre><code class="language-python">import nh3

ALLOWED_TAGS = {
    "p", "h1", "h2", "h3", "pre", "code",
    "img", "a", "ul", "ol", "li", "blockquote",
    "strong", "em", "table", "thead", "tbody",
    "tr", "td", "span", "div"
}
ALLOWED_ATTRS = {
    "a": {"href", "target", "rel"},
    "img": {"src", "alt", "class"},
    "*": {"class"}
}

def sanitize_html(raw_html: str) -> str:
    return nh3.clean(
        raw_html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS
    )</code></pre>

<h3>Frontend: DOMPurify ile Sanitize</h3>
<p>Ziyaretçi tarafında DOM'a yazmadan önce tekrar temizleniyor:</p>
<pre><code class="language-typescript">import DOMPurify from "dompurify";

const clean = DOMPurify.sanitize(post.content_html, {
  ALLOWED_TAGS: ["p","h1","h2","h3","pre","code","img","a"],
  ALLOWED_ATTR: ["href","src","alt","class"],
  FORCE_HTTPS: true,
});

return &lt;div dangerouslySetInnerHTML={{ __html: clean }} /&gt;;</code></pre>

<h2>JWT Kimlik Doğrulama Akışı</h2>
<p>Admin paneli için SimpleJWT kullanıyoruz. Token rotasyonu ile güvenlik artırılıyor:</p>
<pre><code class="language-python"># config/settings/base.py
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}</code></pre>

<h3>Axios Interceptor ile Otomatik Yenileme</h3>
<pre><code class="language-typescript">api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    const { data } = await axios.post("/api/token/refresh/", {
      refresh: getRefreshToken(),
    });
    setAccessToken(data.access);
    error.config.headers.Authorization = `Bearer ${data.access}`;
    return axios(error.config);
  }
  return Promise.reject(error);
});</code></pre>

<h2>Medya Yönetimi Pipeline'ı</h2>
<p>Görsel yükleme işlemi birkaç adımdan oluşuyor:</p>
<ol>
<li>MIME tipi doğrulama — sadece <code>image/jpeg</code>, <code>image/png</code>, <code>image/webp</code></li>
<li>5MB boyut limiti kontrolü</li>
<li>Pillow ile 2048x2048 max boyuta küçültme</li>
<li>WebP formatına dönüştürme (quality=85)</li>
<li>UUID adıyla kaydetme</li>
</ol>
<pre><code class="language-python">from PIL import Image
from io import BytesIO

def process_image(file):
    img = Image.open(file)
    img.thumbnail((2048, 2048), Image.LANCZOS)
    output = BytesIO()
    img.save(output, format="WEBP", quality=85)
    output.seek(0)
    return output</code></pre>

<h2>Sonuç ve Öğrenimler</h2>
<p>Bu mimari, içerik yazarına modern bir editör deneyimi sunarken geliştiriciye tam frontend kontrolü bırakıyor.
<strong>nh3</strong> ile <strong>DOMPurify</strong>'ın birlikte kullanımı çift katmanlı güvenlik sağlıyor.
Token rotasyonu ile refresh token'ın çalınması durumunda bile sistem kendini koruyor.</p>

<blockquote>
Decoupled mimari, kısa vadede ekstra karmaşıklık getirse de uzun vadede bakım kolaylığı ve ölçeklenebilirlik açısından büyük kazanım sağlıyor.
</blockquote>
""",
                "status": "PUBLISHED",
                "meta_title": "GrapesJS Headless CMS Mimarisi | Mehmet Akalın",
                "meta_description": "GrapesJS + Django DRF ile Headless CMS sisteminin tam teknik mimarisi. XSS koruma, JWT auth ve medya pipeline.",
            },
        )
        if created1:
            post1.categories.add(cat_backend, cat_frontend)
            post1.tags.add(tag_django, tag_react, tag_ts, tag_jwt)

        # ── Blog Yazısı 2 — ROS2 ─────────────────────────────────────────────
        post2, created2 = BlogPost.objects.get_or_create(
            slug="ros2-slam-otonom-navigasyon",
            defaults={
                "title": "ROS2 ile SLAM ve Otonom Navigasyon Sistemi",
                "summary": "AUtomotion-R projesinde kullandığım ROS2 Humble tabanlı SLAM algoritmaları, Nav2 navigasyon stack'i ve gerçek zamanlı engel tespiti sisteminin detaylı teknik analizi.",
                "content_html": """
<h2>Projeye Genel Bakış</h2>
<p>AUtomotion-R, İTÜ Araç Teknolojileri Topluluğu bünyesinde geliştirdiğim otonom araç projesidir.
Sistem ROS2 Humble üzerinde çalışıyor ve gerçek zamanlı harita oluşturma ile yol planlama yapabiliyor.</p>

<h2>Sistem Mimarisi</h2>
<p>Dört ana katmandan oluşan bir pipeline kuruldu:</p>

<h3>1. Algılama Katmanı</h3>
<p>LiDAR ve kamera sensörlerinden gelen ham veri burada işleniyor.
<code>/scan</code> topic'i üzerinden SLAM'e, <code>/camera/image_raw</code> üzerinden nesne tespitine gönderiliyor.</p>

<h3>2. Haritalama Katmanı (SLAM)</h3>
<p>SLAM Toolbox ile gerçek zamanlı occupancy grid haritası oluşturuluyor:</p>
<pre><code class="language-yaml"># slam_params.yaml
slam_toolbox:
  ros__parameters:
    solver_plugin: solver_plugins::CeresSolver
    ceres_linear_solver: SPARSE_NORMAL_CHOLESKY
    ceres_preconditioner: SCHUR_JACOBI
    resolution: 0.05
    max_laser_range: 20.0
    minimum_time_interval: 0.5
    transform_publish_period: 0.02</code></pre>

<h3>3. Planlama Katmanı (Nav2)</h3>
<p>Global planner olarak NavFn, local planner olarak DWB Controller kullanılıyor:</p>
<pre><code class="language-python">import rclpy
from nav2_msgs.action import NavigateToPose
from rclpy.action import ActionClient

class NavigationClient(Node):
    def __init__(self):
        super().__init__("navigation_client")
        self._client = ActionClient(
            self, NavigateToPose, "navigate_to_pose"
        )

    def send_goal(self, x: float, y: float, theta: float = 0.0):
        goal = NavigateToPose.Goal()
        goal.pose.header.frame_id = "map"
        goal.pose.pose.position.x = x
        goal.pose.pose.position.y = y
        self._client.send_goal_async(goal)</code></pre>

<h3>4. Kontrol Katmanı</h3>
<p>Hesaplanan yol komutları <code>/cmd_vel</code> topic'i üzerinden motor sürücülerine iletiliyor.
Acil durum durdurucu watchdog ise 100ms timeout ile çalışıyor.</p>

<h2>Simülasyon Ortamı</h2>
<p>Gazebo Fortress ile gerçekçi sensör simülasyonu yapılıyor. Custom dünya dosyası İTÜ kampüsünü modelliyor:</p>
<pre><code class="language-xml">&lt;world name="itu_campus"&gt;
  &lt;plugin filename="gz-sim-physics-system"
          name="gz::sim::systems::Physics"/&gt;
  &lt;plugin filename="gz-sim-sensors-system"
          name="gz::sim::systems::Sensors"&gt;
    &lt;render_engine&gt;ogre2&lt;/render_engine&gt;
  &lt;/plugin&gt;
  &lt;light type="directional" name="sun"&gt;
    &lt;cast_shadows&gt;true&lt;/cast_shadows&gt;
  &lt;/light&gt;
&lt;/world&gt;</code></pre>

<h2>Performans Sonuçları</h2>
<p>Gerçek ortam testlerinde elde edilen metrikler:</p>
<ul>
<li>Harita oluşturma doğruluğu: <strong>±3cm</strong> (20x20m alan)</li>
<li>Navigasyon gecikmesi: <strong>~150ms</strong> (engel tespitinden hedefe güncelleme)</li>
<li>CPU kullanımı: Intel i7 üzerinde <strong>~40%</strong> (tüm stack çalışırken)</li>
<li>Başarılı otonom geçiş oranı: <strong>%94</strong> (100 deneme)</li>
</ul>

<h2>Sonraki Adımlar</h2>
<p>Projenin devam planı şunları kapsıyor:</p>
<ol>
<li>YOLOv8 ile gerçek zamanlı nesne tespiti entegrasyonu</li>
<li>Multi-robot koordinasyon protokolü</li>
<li>Dinamik engel tahmin modeli (pedestrian tracking)</li>
</ol>

<blockquote>
ROS2'nun DDS tabanlı iletişim katmanı, multi-robot senaryolarda gecikme sorunlarını önemli ölçüde azaltıyor. Bu sayede araçlar arası senkronizasyon çok daha güvenilir hale geldi.
</blockquote>
""",
                "status": "PUBLISHED",
                "meta_title": "ROS2 SLAM ve Otonom Navigasyon | Mehmet Akalın",
                "meta_description": "ROS2 Humble ile SLAM tabanlı otonom navigasyon sisteminin geliştirilmesi. Nav2, SLAM Toolbox ve Gazebo simülasyonu.",
            },
        )
        if created2:
            post2.categories.add(cat_robotik)
            post2.tags.add(tag_ros2, tag_python)

        # ── Blog Yazısı 3 — Docker & DevOps ──────────────────────────────────
        post3, created3 = BlogPost.objects.get_or_create(
            slug="docker-ile-django-production-deploy",
            defaults={
                "title": "Docker ile Django Production Deploy Rehberi",
                "summary": "Gunicorn, Nginx, PostgreSQL ve GitHub Actions kullanarak Django uygulamasını sıfırdan production'a taşıma. Multi-stage Dockerfile, environment yönetimi ve sıfır-kesinti deploy stratejisi.",
                "content_html": """
<h2>Neden Docker?</h2>
<p>Docker, <em>"bende çalışıyor"</em> problemini kalıcı olarak çözüyor. Geliştirme, test ve production ortamları
aynı container görüntüsünü çalıştırıyor — tutarsızlık sıfıra iniyor.</p>

<h2>Multi-Stage Dockerfile</h2>
<p>İki aşamalı build ile hem geliştirici araçlarını dahil etmeyiz hem de imaj boyutunu küçültürüz:</p>
<pre><code class="language-dockerfile"># ── Aşama 1: Bağımlılık kurulumu ──
FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements/prod.txt .
RUN pip install --no-cache-dir --user -r prod.txt

# ── Aşama 2: Çalışma görüntüsü ──
FROM python:3.12-slim

WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
ENV DJANGO_SETTINGS_MODULE=config.settings.prod

RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120"]</code></pre>

<h2>Docker Compose Yapısı</h2>
<h3>Geliştirme Ortamı</h3>
<pre><code class="language-yaml">services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: portfolyo_db
      POSTGRES_USER: portfolyo
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U portfolyo"]
      interval: 10s
      retries: 5

  backend:
    build:
      context: ./backend
      target: builder        # dev için builder stage
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app       # hot reload için mount
    depends_on:
      db:
        condition: service_healthy
    env_file: .env
    ports:
      - "8000:8000"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:</code></pre>

<h3>Environment Değişkenleri</h3>
<pre><code class="language-bash"># .env.example
SECRET_KEY=django-insecure-change-me-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=portfolyo_db
DB_USER=portfolyo
DB_PASSWORD=localpass
DB_HOST=db
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173</code></pre>

<h2>GitHub Actions CI/CD Pipeline</h2>
<p>Her <code>main</code> branch push'unda otomatik lint → test → build → deploy çalışıyor:</p>
<pre><code class="language-yaml">name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements/dev.txt
      - run: ruff check .
      - run: pytest --cov=apps --cov-fail-under=80

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run build
        working-directory: frontend</code></pre>

<h2>Nginx Reverse Proxy</h2>
<p>Production'da Nginx, statik dosyaları doğrudan sunuyor ve Django'ya proxy yapıyor:</p>
<pre><code class="language-nginx">upstream django_backend {
    server backend:8000;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Statik dosyalar
    location /static/ {
        alias /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}</code></pre>

<h2>Sıfır Kesinti Deploy Stratejisi</h2>
<p>Rolling update ile aktif bağlantıları kesmeden deploy ediyoruz:</p>
<ol>
<li>Yeni container'ı başlat ve healthcheck bekle</li>
<li>Nginx upstream'e yeni container'ı ekle</li>
<li>Eski container'dan gelen istekleri tamamla (graceful shutdown)</li>
<li>Eski container'ı kaldır</li>
</ol>

<blockquote>
Multi-stage build kullanarak development bağımlılıklarını (pytest, ruff, factory-boy) production imajından çıkardık. Bu sayede imaj boyutu 1.2GB'dan 380MB'a indi.
</blockquote>
""",
                "status": "PUBLISHED",
                "meta_title": "Docker ile Django Production Deploy | Mehmet Akalın",
                "meta_description": "Gunicorn, Nginx ve GitHub Actions ile Django production deployment. Multi-stage Dockerfile ve sıfır-kesinti deploy.",
            },
        )
        if created3:
            post3.categories.add(cat_devops, cat_backend)
            post3.tags.add(tag_docker, tag_django, tag_pg)

        # ── Blog Yazısı 4 — PostgreSQL Full-Text Search ───────────────────────
        post4, created4 = BlogPost.objects.get_or_create(
            slug="postgresql-full-text-search-django",
            defaults={
                "title": "PostgreSQL Full-Text Search ile Django Arama Sistemi",
                "summary": "Django ORM üzerinden PostgreSQL GIN indeksleri, SearchVector ve SearchRank kullanarak Türkçe dil desteğiyle güçlü arama altyapısı kurma.",
                "content_html": """
<h2>Full-Text Search Neden Gerekli?</h2>
<p>Basit <code>LIKE '%kelime%'</code> sorguları büyük tablolarda indeks kullanamaz ve yavaş çalışır.
PostgreSQL'in yerleşik full-text search motoru ise GIN indeksleri sayesinde milyonlarca kayıtta bile milisaniyelerde sonuç döndürür.</p>

<h2>Model Ayarları</h2>
<p>BlogPost modeline GIN indeksi ekliyoruz:</p>
<pre><code class="language-python">from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVector

class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    summary = models.TextField()
    content_html = models.TextField()

    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
            GinIndex(
                SearchVector("title", "summary", config="turkish"),
                name="post_search_gin",
            ),
        ]</code></pre>

<h2>View Katmanı — Arama Implementasyonu</h2>
<h3>Basit Arama (LIKE tabanlı)</h3>
<pre><code class="language-python">from django.db.models import Q

def search_posts_simple(query: str):
    return BlogPost.objects.filter(
        Q(title__icontains=query) |
        Q(summary__icontains=query),
        status="PUBLISHED",
    )</code></pre>

<h3>Full-Text Search (SearchVector + SearchRank)</h3>
<pre><code class="language-python">from django.contrib.postgres.search import (
    SearchQuery, SearchRank, SearchVector
)

def search_posts_fulltext(query: str):
    search_vector = SearchVector(
        "title", weight="A", config="turkish"
    ) + SearchVector(
        "summary", weight="B", config="turkish"
    )
    search_query = SearchQuery(query, config="turkish")

    return (
        BlogPost.objects
        .annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query),
        )
        .filter(search=search_query, status="PUBLISHED")
        .order_by("-rank", "-created_at")
    )</code></pre>

<h2>DRF Filter Entegrasyonu</h2>
<p>Arama işlemini DRF filter backend'i ile API'ye bağlıyoruz:</p>
<pre><code class="language-python">from rest_framework import filters, viewsets
from django_filters.rest_framework import DjangoFilterBackend

class PostViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlogPost.objects.filter(status="PUBLISHED")
    serializer_class = PostListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {"categories__slug": ["exact"], "tags__slug": ["exact"]}
    search_fields = ["title", "summary"]
    ordering_fields = ["-created_at", "-view_count", "reading_time"]
    ordering = ["-created_at"]</code></pre>

<h2>Türkçe Dil Desteği</h2>
<p>PostgreSQL'e Turkish text search konfigürasyonu ekliyoruz:</p>
<pre><code class="language-sql">-- Migration içinde çalıştırılacak SQL
CREATE TEXT SEARCH CONFIGURATION turkish (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION turkish
    ALTER MAPPING FOR hword, hword_part, word
    WITH turkish_stem;</code></pre>

<h2>Performans Karşılaştırması</h2>
<p>10.000 kayıt üzerinde yapılan benchmark sonuçları:</p>
<ul>
<li><code>LIKE '%django%'</code> (indekssiz): <strong>~450ms</strong></li>
<li>Full-text search (GIN indeksli): <strong>~8ms</strong></li>
<li>İyileştirme oranı: <strong>56×</strong></li>
</ul>

<blockquote>
GIN indeksi oluşturma işlemi tek seferlik bir maliyet getirir ancak her arama sorgusunda bu maliyeti katbekat geri kazanırsınız. 10.000 kayıt için GIN indeks boyutu yaklaşık 2MB — çok küçük bir tradeoff.
</blockquote>
""",
                "status": "PUBLISHED",
                "meta_title": "PostgreSQL Full-Text Search ile Django | Mehmet Akalın",
                "meta_description": "Django'da PostgreSQL GIN indeksleri ve SearchVector ile Türkçe dil desteğiyle güçlü arama altyapısı.",
            },
        )
        if created4:
            post4.categories.add(cat_backend)
            post4.tags.add(tag_django, tag_pg, tag_python)

        # ── Blog Yazısı 5 — React + TypeScript ───────────────────────────────
        post5, created5 = BlogPost.objects.get_or_create(
            slug="react-18-zustand-typescript-state-yonetimi",
            defaults={
                "title": "React 18 + Zustand ile Modern State Yönetimi",
                "summary": "Redux'tan Zustand'a geçişin teknik gerekçesi, persist middleware, devtools entegrasyonu ve TypeScript ile tip güvenli store tasarımı.",
                "content_html": """
<h2>Redux'tan Neden Ayrıldım?</h2>
<p>Redux güçlüdür ancak basit işlemler için bile çok fazla boilerplate gerektirir.
Actions, reducers, selectors, middleware — küçük bir state parçası için onlarca dosya.</p>

<p>Zustand ise aynı gücü çok daha az kod ile sunuyor. Temel store tek bir fonksiyon çağrısı:</p>
<pre><code class="language-typescript">import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create&lt;CounterState&gt;()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));</code></pre>

<h2>Persist Middleware ile LocalStorage</h2>
<p>Sayfa yenilenmesinde state'i korumak için persist middleware kullanıyoruz:</p>
<pre><code class="language-typescript">import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create&lt;ThemeState&gt;()(
  persist(
    (set, get) => ({
      theme: "dark",
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: "theme-preference",          // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);</code></pre>

<h2>Auth Store — JWT Token Yönetimi</h2>
<p>Access ve refresh token'ları Zustand'da tutuyoruz:</p>
<pre><code class="language-typescript">interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create&lt;AuthState&gt;()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, isAuthenticated: false }),
      setAccessToken: (token) => set({ accessToken: token }),
    }),
    { name: "auth-storage" }
  )
);</code></pre>

<h2>React 18 Concurrent Features</h2>
<h3>Suspense ile Lazy Loading</h3>
<pre><code class="language-typescript">import { lazy, Suspense } from "react";

// GrapesJS sadece admin rotasında yükleniyor
const GrapesEditor = lazy(() => import("./pages/admin/GrapesEditor"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

function App() {
  return (
    &lt;Suspense fallback={&lt;LoadingSpinner /&gt;}&gt;
      &lt;Routes&gt;
        &lt;Route path="/admin" element={&lt;AdminDashboard /&gt;} /&gt;
      &lt;/Routes&gt;
    &lt;/Suspense&gt;
  );
}</code></pre>

<h2>Custom Hook Patterns</h2>
<pre><code class="language-typescript">// Belge başlığını ve meta'yı güncelleyen hook
export function useDocumentMeta(title?: string, description?: string) {
  useEffect(() => {
    if (title) document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute("content", description);
  }, [title, description]);
}

// Kullanımı
export default function BlogPostPage() {
  useDocumentMeta(`${post.title} — Portföy`, post.meta_description);
  // ...
}</code></pre>

<h2>Sonuç</h2>
<p>Zustand, Redux'un sağladığı tüm özellikleri (devtools, persist, immer) çok daha az boilerplate ile sunuyor.
React 18'in concurrent özellikleri ile birleşince modern, performanslı ve tipler sayesinde güvenli bir frontend mimarisi ortaya çıkıyor.</p>
""",
                "status": "PUBLISHED",
                "meta_title": "React 18 + Zustand State Yönetimi | Mehmet Akalın",
                "meta_description": "Redux'tan Zustand'a geçiş, persist middleware ve TypeScript ile tip güvenli store tasarımı.",
            },
        )
        if created5:
            post5.categories.add(cat_frontend)
            post5.tags.add(tag_react, tag_ts)

        # ── Taslak yazı ───────────────────────────────────────────────────────
        BlogPost.objects.get_or_create(
            slug="kubernetes-django-deployment",
            defaults={
                "title": "Kubernetes ile Django Deployment",
                "summary": "K8s Deployments, Services ve Ingress kullanarak Django uygulamasını Kubernetes cluster'ına taşıma.",
                "content_html": "<p>Çok yakında...</p>",
                "status": "DRAFT",
            },
        )

        # ── Projeler ─────────────────────────────────────────────────────────
        Project.objects.get_or_create(
            slug="automotion-r",
            defaults={
                "title": "AUtomotion-R",
                "description": (
                    "İTÜ Araç Teknolojileri Topluluğu bünyesinde geliştirilen otonom araç projesi. "
                    "ROS2 Humble, Nav2 ve SLAM Toolbox kullanılarak gerçek zamanlı harita oluşturma "
                    "ve otonom navigasyon sistemi geliştirildi. Gazebo simülasyonu ile test edildi."
                ),
                "tech_stack": ["ROS2", "Python", "C++", "SLAM Toolbox", "Nav2", "Gazebo", "Ubuntu 22.04"],
                "github_url": "https://github.com/mehmetakalin/automotion-r",
                "status": "ACTIVE",
                "is_featured": True,
                "sort_order": 0,
                "start_date": "2024-01-01",
            },
        )

        Project.objects.get_or_create(
            slug="grapesjs-headless-cms",
            defaults={
                "title": "GrapesJS Headless CMS & Portfolyo",
                "description": (
                    "GrapesJS görsel editörünü Django DRF backend ve React 18 frontend ile birleştiren "
                    "kişisel portfolyo ve içerik yönetim sistemi. "
                    "İkili içerik saklama (HTML+JSON), JWT rotasyonu, çift katman XSS koruma, "
                    "medya pipeline'ı ve full-text search içeriyor."
                ),
                "tech_stack": ["Django", "DRF", "React 18", "TypeScript", "GrapesJS", "PostgreSQL", "Docker", "Tailwind v4"],
                "github_url": "https://github.com/mehmetakalin/portfolyo",
                "live_url": "https://mehmetakalin.dev",
                "status": "IN_PROGRESS",
                "is_featured": True,
                "sort_order": 1,
                "start_date": "2026-01-01",
            },
        )

        Project.objects.get_or_create(
            slug="ros2-slam-navigation",
            defaults={
                "title": "ROS2 SLAM Navigation Stack",
                "description": (
                    "ROS2 tabanlı SLAM ve otonom navigasyon stack'i. "
                    "Gerçek zamanlı occupancy grid harita oluşturma, LiDAR tabanlı engel tespiti "
                    "ve A* tabanlı global yol planlama içeriyor."
                ),
                "tech_stack": ["ROS2", "C++", "Python", "SLAM Toolbox", "OpenCV", "PCL"],
                "github_url": "https://github.com/mehmetakalin/ros2-slam",
                "status": "ACTIVE",
                "is_featured": False,
                "sort_order": 2,
            },
        )

        Project.objects.get_or_create(
            slug="django-drf-jwt-boilerplate",
            defaults={
                "title": "Django DRF + JWT Boilerplate",
                "description": (
                    "Yeni Django projelerinde hızlı başlangıç için hazır şablon. "
                    "SimpleJWT rotasyonu, custom user model, pytest kurulumu, "
                    "Docker Compose, Ruff linter ve GitHub Actions CI içeriyor."
                ),
                "tech_stack": ["Django", "DRF", "PostgreSQL", "Docker", "pytest", "GitHub Actions"],
                "github_url": "https://github.com/mehmetakalin/django-drf-starter",
                "status": "ACTIVE",
                "is_featured": False,
                "sort_order": 3,
            },
        )

        Project.objects.get_or_create(
            slug="real-time-sensor-dashboard",
            defaults={
                "title": "Gerçek Zamanlı Sensör Dashboard",
                "description": (
                    "ROS2 node'larından gelen sensör verilerini (LiDAR, IMU, GPS) "
                    "WebSocket üzerinden React frontend'e ileten gerçek zamanlı dashboard. "
                    "Plotly.js ile canlı grafik ve harita görselleştirmesi."
                ),
                "tech_stack": ["React", "TypeScript", "WebSocket", "Plotly.js", "ROS2", "Python"],
                "status": "ARCHIVED",
                "is_featured": False,
                "sort_order": 4,
            },
        )

        # ── Kariyer Kayıtları ─────────────────────────────────────────────────
        CareerEntry.objects.get_or_create(
            company="ITU ATA (Arac Teknolojileri Toplulugu)",
            position="Robotik Yazilim Gelistirici",
            defaults={
                "location": "Istanbul, Turkiye",
                "entry_type": "WORK",
                "description": (
                    "AUtomotion-R otonom arac projesinde ROS2 Humble tabanli yazilim gelistirdim. "
                    "SLAM Toolbox ile gercek zamanli harita olusturma, Nav2 ile otonom navigasyon "
                    "ve Gazebo simulasyon ortaminin kurulumunu ustlendim. "
                    "Algilama, haritalama, planlama ve kontrol pipeline'ini sifirdan tasarlayip implemente ettim."
                ),
                "tech_stack": ["ROS2", "Python", "C++", "SLAM Toolbox", "Nav2", "Gazebo", "Ubuntu 22.04"],
                "start_date": "2024-01-01",
                "is_current": True,
                "sort_order": 0,
            },
        )

        CareerEntry.objects.get_or_create(
            company="Serbest Calisan",
            position="Backend Gelistirici",
            defaults={
                "location": "Uzaktan",
                "entry_type": "WORK",
                "description": (
                    "Kucuk ve orta olcekli isletmeler icin Django DRF tabanli REST API'ler gelistirdim. "
                    "JWT kimlik dogrulama, PostgreSQL veritabani tasarimi, Docker ile containerization "
                    "ve GitHub Actions ile CI/CD pipeline kurulumu konularinda projeler yurutttum."
                ),
                "tech_stack": ["Django", "DRF", "PostgreSQL", "Docker", "GitHub Actions"],
                "start_date": "2023-06-01",
                "end_date": "2023-12-31",
                "is_current": False,
                "sort_order": 1,
            },
        )

        CareerEntry.objects.get_or_create(
            company="Istanbul Teknik Universitesi",
            position="Bilgisayar Muhendisligi",
            defaults={
                "location": "Istanbul, Turkiye",
                "entry_type": "EDUCATION",
                "description": (
                    "Algoritmalar ve veri yapilari, isletim sistemleri, bilgisayar aglari, "
                    "yapay zeka ve makine ogrenmesi derslerini iceren lisans programi. "
                    "Mezuniyet projesi: ROS2 tabanli otonom navigasyon sistemi."
                ),
                "tech_stack": ["Python", "C", "C++", "Java", "MATLAB"],
                "start_date": "2021-09-01",
                "is_current": True,
                "sort_order": 2,
            },
        )

        CareerEntry.objects.get_or_create(
            company="BTK Akademi",
            position="Python ile Yapay Zeka Egitimi",
            defaults={
                "location": "Cevrimici",
                "entry_type": "EDUCATION",
                "description": (
                    "Makine ogrenmesi temelleri, scikit-learn ile siniflandirma ve regresyon modelleri, "
                    "derin ogrenmeye giris konularini kapsayan sertifika programi."
                ),
                "tech_stack": ["Python", "scikit-learn", "NumPy", "Pandas", "Jupyter"],
                "start_date": "2023-01-01",
                "end_date": "2023-05-31",
                "is_current": False,
                "sort_order": 3,
            },
        )

        self.stdout.write(self.style.SUCCESS(
            f"Seed tamamlandi: "
            f"{Category.objects.count()} kategori, "
            f"{Tag.objects.count()} etiket, "
            f"{BlogPost.objects.filter(status='PUBLISHED').count()} yayinli yazi "
            f"({BlogPost.objects.filter(status='DRAFT').count()} taslak), "
            f"{Project.objects.count()} proje, "
            f"{CareerEntry.objects.count()} kariyer kaydi."
        ))
