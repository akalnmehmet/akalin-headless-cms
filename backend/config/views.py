import html
from datetime import datetime, timezone

from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
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
                safe_name    = html.escape(name)
                safe_email   = html.escape(email)
                safe_message = html.escape(message).replace("\n", "<br>")

                plain_body = (
                    f"Gönderen : {name} <{email}>\n"
                    f"{'─' * 40}\n\n"
                    f"{message}\n\n"
                    f"{'─' * 40}\n"
                    f"Bu mesaj akalin-cms.vercel.app iletişim formundan gönderildi."
                )

                html_body = f"""<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;
                    box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <!-- Başlık -->
        <tr>
          <td style="background:#111827;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">
              📬 Yeni İletişim Mesajı
            </h1>
          </td>
        </tr>

        <!-- Gönderen bilgileri -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table cellpadding="0" cellspacing="0" width="100%"
                   style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <tr style="background:#f9fafb;">
                <td style="padding:10px 16px;color:#6b7280;font-size:13px;width:80px;">Ad</td>
                <td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:600;">
                  {safe_name}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 16px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;">
                  E-posta
                </td>
                <td style="padding:10px 16px;border-top:1px solid #e5e7eb;">
                  <a href="mailto:{safe_email}"
                     style="color:#2563eb;font-size:14px;text-decoration:none;">
                    {safe_email}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Mesaj -->
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;
                      text-transform:uppercase;letter-spacing:.05em;">Mesaj</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;
                        padding:16px;color:#111827;font-size:15px;line-height:1.7;">
              {safe_message}
            </div>
          </td>
        </tr>

        <!-- Yanıtla butonu -->
        <tr>
          <td style="padding:0 32px 32px;">
            <a href="mailto:{safe_email}?subject=Re: Portfolyo İletişim"
               style="display:inline-block;background:#111827;color:#ffffff;
                      padding:10px 24px;border-radius:6px;font-size:14px;
                      text-decoration:none;font-weight:600;">
              ↩ Yanıtla
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                     padding:16px 32px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              akalin-cms.vercel.app · İletişim Formu
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

                msg = EmailMultiAlternatives(
                    subject=f"[Portfolyo] İletişim: {name}",
                    body=plain_body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[contact_email],
                    reply_to=[email],
                )
                msg.attach_alternative(html_body, "text/html")
                msg.send(fail_silently=False)

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
