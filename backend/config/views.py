import textwrap
from datetime import datetime, timezone

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.posts.models import BlogPost
from apps.projects.models import Project


class ContactRateThrottle(AnonRateThrottle):
    rate = "5/hour"


class ContactView(APIView):
    """POST /api/contact/ — İletişim formu, email gönderir."""

    permission_classes = [AllowAny]
    throttle_classes = [ContactRateThrottle]

    def post(self, request):
        name    = (request.data.get("name", "") or "").strip()
        email   = (request.data.get("email", "") or "").strip()
        message = (request.data.get("message", "") or "").strip()

        errors = {}
        if not name:
            errors["name"] = "Ad gereklidir."
        if not email:
            errors["email"] = "E-posta gereklidir."
        else:
            try:
                validate_email(email)
            except ValidationError:
                errors["email"] = "Geçerli bir e-posta adresi girin."
        if not message:
            errors["message"] = "Mesaj gereklidir."
        elif len(message) > 2000:
            errors["message"] = "Mesaj 2000 karakterden uzun olamaz."

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        contact_email = getattr(settings, "CONTACT_EMAIL", "")
        if contact_email:
            try:
                send_mail(
                    subject=f"[Portfolyo] İletişim: {name}",
                    message=f"Gönderen: {name} <{email}>\n\n{message}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[contact_email],
                    fail_silently=False,
                )
            except Exception:
                return Response(
                    {"detail": "Mail gönderilemedi, lütfen daha sonra tekrar deneyin."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        return Response({"detail": "Mesajınız iletildi."}, status=status.HTTP_200_OK)


class SitemapView(APIView):
    """
    /sitemap.xml — Statik sayfalar + yayınlanmış blog yazıları + aktif projeler.
    15 dakikalık cache ile hızlandırılmıştır.
    """

    permission_classes = [AllowAny]
    CACHE_KEY = "sitemap_xml"
    CACHE_TIMEOUT = 900  # 15 dakika

    STATIC_PAGES = [
        ("", "1.0", "daily"),
        ("blog", "0.9", "daily"),
        ("projects", "0.8", "weekly"),
        ("career", "0.7", "monthly"),
    ]

    def get(self, request):
        cached = cache.get(self.CACHE_KEY)
        if cached:
            return HttpResponse(cached, content_type="application/xml; charset=utf-8")

        site_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        urls: list[str] = []

        # Statik sayfalar
        for path, priority, changefreq in self.STATIC_PAGES:
            loc = f"{site_url}/{path}" if path else site_url
            urls.append(self._url(loc, now, changefreq, priority))

        # Blog yazıları
        posts = BlogPost.objects.filter(
            status=BlogPost.Status.PUBLISHED
        ).values("slug", "updated_at").order_by("-updated_at")

        for post in posts:
            loc = f"{site_url}/blog/{post['slug']}"
            lastmod = post["updated_at"].strftime("%Y-%m-%d")
            urls.append(self._url(loc, lastmod, "weekly", "0.8"))

        # Projeler
        projects = Project.objects.exclude(
            status=Project.Status.ARCHIVED
        ).values("slug").order_by("sort_order")

        for project in projects:
            loc = f"{site_url}/projects/{project['slug']}"
            urls.append(self._url(loc, now, "monthly", "0.6"))

        xml = textwrap.dedent(f"""\
            <?xml version="1.0" encoding="UTF-8"?>
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            {"".join(urls)}
            </urlset>""")

        cache.set(self.CACHE_KEY, xml, self.CACHE_TIMEOUT)
        return HttpResponse(xml, content_type="application/xml; charset=utf-8")

    @staticmethod
    def _url(loc: str, lastmod: str, changefreq: str, priority: str) -> str:
        return textwrap.dedent(f"""\
              <url>
                <loc>{loc}</loc>
                <lastmod>{lastmod}</lastmod>
                <changefreq>{changefreq}</changefreq>
                <priority>{priority}</priority>
              </url>
            """)
