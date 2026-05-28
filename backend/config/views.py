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
    Her dil için hreflang alternate linkleriyle birlikte.
    15 dakikalık cache ile hızlandırılmıştır.
    """

    permission_classes = [AllowAny]
    CACHE_KEY = "sitemap_xml"
    CACHE_TIMEOUT = 900  # 15 dakika

    LANGS = ["tr", "en"]

    # (yol, priority, changefreq)  — her dil için /tr/yol ve /en/yol üretilir
    STATIC_PAGES = [
        ("",           "1.0", "daily"),
        ("blog",       "0.9", "daily"),
        ("projects",   "0.8", "weekly"),
        ("career",     "0.7", "monthly"),
        ("hakkimda",   "0.6", "monthly"),   # TR: /tr/hakkimda
        ("about",      "0.6", "monthly"),   # EN: /en/about
        ("iletisim",   "0.5", "monthly"),   # TR: /tr/iletisim
        ("contact",    "0.5", "monthly"),   # EN: /en/contact
    ]

    def get(self, request):
        cached = cache.get(self.CACHE_KEY)
        if cached:
            return HttpResponse(cached, content_type="application/xml; charset=utf-8")

        site_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        urls: list[str] = []

        # ── Statik sayfalar (her dil için) ──────────────────────────────
        # Ana sayfa özel: / → /tr ve /en
        tr_home = f"{site_url}/tr"
        en_home = f"{site_url}/en"
        urls.append(self._url_with_alternates(tr_home, now, "daily", "1.0", tr_home, en_home))
        urls.append(self._url_with_alternates(en_home, now, "daily", "1.0", tr_home, en_home))

        # Diğer statik sayfalar
        bilingual = {
            "blog":     ("blog",     "blog"),
            "projects": ("projects", "projects"),
            "career":   ("career",   "career"),
            "about":    ("hakkimda", "about"),
            "contact":  ("iletisim", "contact"),
        }
        priorities = {
            "blog": ("0.9", "daily"),
            "projects": ("0.8", "weekly"),
            "career": ("0.7", "monthly"),
            "about": ("0.6", "monthly"),
            "contact": ("0.5", "monthly"),
        }
        for key, (tr_path, en_path) in bilingual.items():
            priority, changefreq = priorities[key]
            tr_loc = f"{site_url}/tr/{tr_path}"
            en_loc = f"{site_url}/en/{en_path}"
            urls.append(self._url_with_alternates(tr_loc, now, changefreq, priority, tr_loc, en_loc))
            urls.append(self._url_with_alternates(en_loc, now, changefreq, priority, tr_loc, en_loc))

        # ── Blog yazıları ────────────────────────────────────────────────
        posts = BlogPost.objects.filter(
            status=BlogPost.Status.PUBLISHED
        ).values("slug", "updated_at").order_by("-updated_at")

        for post in posts:
            tr_loc = f"{site_url}/tr/blog/{post['slug']}"
            en_loc = f"{site_url}/en/blog/{post['slug']}"
            lastmod = post["updated_at"].strftime("%Y-%m-%d")
            urls.append(self._url_with_alternates(tr_loc, lastmod, "weekly", "0.8", tr_loc, en_loc))
            urls.append(self._url_with_alternates(en_loc, lastmod, "weekly", "0.8", tr_loc, en_loc))

        # ── Projeler ─────────────────────────────────────────────────────
        projects = Project.objects.exclude(
            status=Project.Status.ARCHIVED
        ).values("slug").order_by("sort_order")

        for project in projects:
            tr_loc = f"{site_url}/tr/projects/{project['slug']}"
            en_loc = f"{site_url}/en/projects/{project['slug']}"
            urls.append(self._url_with_alternates(tr_loc, now, "monthly", "0.6", tr_loc, en_loc))
            urls.append(self._url_with_alternates(en_loc, now, "monthly", "0.6", tr_loc, en_loc))

        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
            '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + "".join(urls)
            + "</urlset>"
        )

        cache.set(self.CACHE_KEY, xml, self.CACHE_TIMEOUT)
        return HttpResponse(xml, content_type="application/xml; charset=utf-8")

    @staticmethod
    def _url_with_alternates(
        loc: str, lastmod: str, changefreq: str, priority: str,
        tr_loc: str, en_loc: str,
    ) -> str:
        return (
            f"  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <lastmod>{lastmod}</lastmod>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"    <priority>{priority}</priority>\n"
            f'    <xhtml:link rel="alternate" hreflang="tr" href="{tr_loc}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="en" href="{en_loc}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="x-default" href="{tr_loc}"/>\n'
            f"  </url>\n"
        )
