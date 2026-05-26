from django.core.management.base import BaseCommand

from apps.posts.models import BlogPost, Category, Tag
from apps.projects.models import Project


class Command(BaseCommand):
    help = "Geliştirme için örnek veri oluşturur"

    def handle(self, *args, **kwargs):
        # Kategoriler
        cat_backend, _ = Category.objects.get_or_create(
            slug="backend", defaults={"name": "Backend", "description": "Sunucu taraflı geliştirme"}
        )
        cat_robotik, _ = Category.objects.get_or_create(
            slug="robotik", defaults={"name": "Robotik", "description": "ROS2, SLAM ve otonom sistemler"}
        )
        cat_devops, _ = Category.objects.get_or_create(
            slug="devops", defaults={"name": "DevOps", "description": "Docker, CI/CD ve altyapı"}
        )

        # Etiketler
        tag_django, _ = Tag.objects.get_or_create(slug="django", defaults={"name": "Django", "color": "#092E20"})
        tag_react, _ = Tag.objects.get_or_create(slug="react", defaults={"name": "React", "color": "#61DAFB"})
        tag_ros2, _ = Tag.objects.get_or_create(slug="ros2", defaults={"name": "ROS2", "color": "#22272E"})
        tag_docker, _ = Tag.objects.get_or_create(slug="docker", defaults={"name": "Docker", "color": "#2496ED"})
        tag_python, _ = Tag.objects.get_or_create(slug="python", defaults={"name": "Python", "color": "#3776AB"})

        # Blog yazıları
        post1, created1 = BlogPost.objects.get_or_create(
            slug="grapesjs-headless-cms-mimarisi",
            defaults={
                "title": "GrapesJS Headless CMS Mimarisi",
                "summary": "GrapesJS ile sürükle-bırak editör ve Django DRF backend entegrasyonunun teknik detayları.",
                "content_html": """
<h2>Giriş</h2>
<p>Modern web geliştirmede <strong>Headless CMS</strong> mimarileri giderek yaygınlaşıyor.
Bu yazıda GrapesJS görsel editörünü Django REST Framework ile nasıl entegre ettiğimi anlatıyorum.</p>

<h2>İkili İçerik Saklama Stratejisi</h2>
<p>GrapesJS iki farklı formatta çıktı üretir:</p>
<ul>
<li><strong>HTML/CSS</strong> — ziyaretçiye sunulan statik içerik</li>
<li><strong>JSON</strong> — editörün yeniden yüklenebilmesi için bileşen ağacı</li>
</ul>
<p>Her ikisini de veritabanında tutarak hem hız hem esneklik sağlıyoruz.</p>

<h2>Güvenlik Katmanları</h2>
<p>XSS koruması iki ayrı noktada uygulanıyor:</p>
<ol>
<li>Frontend: <code>DOMPurify</code> ile HTML DOM'a yazılmadan temizleniyor</li>
<li>Backend: Python <code>nh3</code> kütüphanesi ile veritabanına yazmadan önce temizleniyor</li>
</ol>
<blockquote>nh3, Rust tabanlı html5ever üzerine inşa edilmiş modern ve aktif olarak geliştirilmekte olan bir kütüphanedir.</blockquote>
""",
                "status": "PUBLISHED",
                "meta_title": "GrapesJS Headless CMS Mimarisi | Mehmet Akalın",
                "meta_description": "GrapesJS + Django DRF ile Headless CMS sisteminin teknik mimarisi.",
            },
        )
        if created1:
            post1.categories.add(cat_backend)
            post1.tags.add(tag_django, tag_react)

        post2, created2 = BlogPost.objects.get_or_create(
            slug="ros2-slam-otonom-navigasyon",
            defaults={
                "title": "ROS2 ile SLAM ve Otonom Navigasyon",
                "summary": "AUtomotion-R projesinde kullandığım ROS2 tabanlı SLAM algoritmaları ve gerçek zamanlı navigasyon sistemi.",
                "content_html": """
<h2>Proje Kapsamı</h2>
<p>AUtomotion-R, İTÜ Araç Teknolojileri Topluluğu bünyesinde geliştirdiğim otonom araç projesidir.
ROS2 Humble üzerinde çalışan bu sistem, gerçek zamanlı harita oluşturma ve yol planlama yapabiliyor.</p>

<h2>Kullanılan Teknolojiler</h2>
<ul>
<li><strong>ROS2 Humble</strong> — merkezi iletişim altyapısı</li>
<li><strong>Nav2</strong> — navigasyon stack'i</li>
<li><strong>SLAM Toolbox</strong> — eş zamanlı harita oluşturma ve konum belirleme</li>
<li><strong>Gazebo</strong> — simülasyon ortamı</li>
</ul>

<h2>Sistem Mimarisi</h2>
<p>Algılama → Haritalama → Planlama → Kontrol pipeline'ı ROS2 node'ları üzerinden asenkron olarak çalışıyor.</p>
""",
                "status": "PUBLISHED",
                "meta_title": "ROS2 SLAM ve Otonom Navigasyon | Mehmet Akalın",
                "meta_description": "ROS2 Humble ile SLAM tabanlı otonom navigasyon sisteminin geliştirilmesi.",
            },
        )
        if created2:
            post2.categories.add(cat_robotik)
            post2.tags.add(tag_ros2, tag_python)

        post3, created3 = BlogPost.objects.get_or_create(
            slug="docker-ile-django-deploy",
            defaults={
                "title": "Docker ile Django Production Deploy",
                "summary": "Gunicorn, Nginx ve GitHub Actions kullanarak Django uygulamasını production ortamına taşıma rehberi.",
                "content_html": """
<h2>Neden Docker?</h2>
<p>Docker, geliştirme ve production ortamları arasındaki <em>"bende çalışıyor"</em> sorununu ortadan kaldırır.
Her ortamda aynı container görüntüsü çalışır.</p>

<h2>Dockerfile Yapısı</h2>
<pre><code>FROM python:3.12-slim AS base
WORKDIR /app
COPY requirements/prod.txt .
RUN pip install --no-cache-dir -r prod.txt
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]</code></pre>

<h2>GitHub Actions CI/CD</h2>
<p>Her <code>main</code> branch push'unda otomatik olarak lint, test, build ve deploy adımları çalışır.</p>
""",
                "status": "PUBLISHED",
                "meta_title": "Docker ile Django Deploy | Mehmet Akalın",
                "meta_description": "Docker, Gunicorn ve GitHub Actions ile Django production deployment rehberi.",
            },
        )
        if created3:
            post3.categories.add(cat_devops)
            post3.tags.add(tag_docker, tag_django)

        # Taslak yazı
        BlogPost.objects.get_or_create(
            slug="postgresql-full-text-search",
            defaults={
                "title": "PostgreSQL Full-Text Search ile Arama Altyapısı",
                "summary": "Django'da PostgreSQL GIN indeksleri ve SearchVector kullanarak güçlü arama sistemi.",
                "content_html": "<p>Yakında...</p>",
                "status": "DRAFT",
            },
        )

        # Projeler
        Project.objects.get_or_create(
            slug="automotion-r",
            defaults={
                "title": "AUtomotion-R",
                "description": "İTÜ Araç Teknolojileri Topluluğu bünyesinde geliştirilen otonom araç projesi. "
                               "ROS2 Humble, Nav2 ve SLAM Toolbox kullanılarak gerçek zamanlı harita oluşturma "
                               "ve otonom navigasyon sistemi geliştirildi.",
                "tech_stack": ["ROS2", "Python", "SLAM", "Nav2", "Gazebo", "Ubuntu 22.04"],
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
                "title": "GrapesJS Headless CMS",
                "description": "GrapesJS görsel editörünü Django DRF backend ve React 18 frontend ile birleştiren "
                               "kişisel portfolyo ve içerik yönetim sistemi. İkili içerik saklama, JWT auth, "
                               "çift katman XSS koruma ve medya yönetimi içeriyor.",
                "tech_stack": ["Django", "DRF", "React", "TypeScript", "GrapesJS", "PostgreSQL", "Docker"],
                "github_url": "https://github.com/mehmetakalin/portfolyo",
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
                "description": "ROS2 tabanlı SLAM ve otonom navigasyon stack'i. "
                               "Gerçek zamanlı harita oluşturma, engel tespiti ve dinamik yol planlama.",
                "tech_stack": ["ROS2", "C++", "Python", "SLAM Toolbox", "OpenCV"],
                "status": "ACTIVE",
                "is_featured": False,
                "sort_order": 2,
            },
        )

        self.stdout.write(self.style.SUCCESS(
            f"OK: {Category.objects.count()} kategori, "
            f"{Tag.objects.count()} etiket, "
            f"{BlogPost.objects.count()} yazi, "
            f"{Project.objects.count()} proje olusturuldu."
        ))
