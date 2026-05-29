"""
Newsletter gönderme yardımcı fonksiyonları.
Yeni bir BlogPost yayınlandığında tüm aktif abonelere e-posta gönderir.
"""
import html
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def _build_html(post, subscriber_token: str, site_url: str, frontend_url: str) -> str:
    title = html.escape(post.title)
    summary = html.escape(post.summary or "")
    post_url = f"{frontend_url}/tr/blog/{post.slug}"
    unsub_url = f"{site_url}/api/newsletter/unsubscribe/{subscriber_token}/"

    image_block = ""
    if post.featured_image:
        img_url = html.escape(post.featured_image.file_url)
        image_block = f"""
        <div style="margin:24px 0;border-radius:12px;overflow:hidden;">
          <img src="{img_url}" alt="{title}"
               style="width:100%;max-height:300px;object-fit:cover;display:block;" />
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0d14;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="border-bottom:1px solid #1f2d4a;padding-bottom:20px;margin-bottom:28px;">
      <span style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#e2e8f0;">
        Mehmet Akalın
      </span>
      <span style="margin-left:10px;font-size:12px;color:#00d4ff;font-family:monospace;
                   background:#003344;padding:2px 8px;border-radius:4px;">
        newsletter
      </span>
    </div>

    <!-- Etiket -->
    <div style="margin-bottom:12px;">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;color:#94a3b8;
                   text-transform:uppercase;font-family:monospace;">
        Yeni Blog Yazısı
      </span>
    </div>

    <!-- Başlık -->
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;line-height:1.3;
               letter-spacing:-0.02em;color:#e2e8f0;">
      {title}
    </h1>

    <!-- Görsel -->
    {image_block}

    <!-- Özet -->
    <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#94a3b8;">
      {summary}
    </p>

    <!-- CTA Butonu -->
    <div style="margin-bottom:40px;">
      <a href="{post_url}"
         style="display:inline-block;background:#00d4ff;color:#0a0d14;
                font-size:14px;font-weight:700;padding:12px 28px;
                border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
        Yazıyı Oku &rarr;
      </a>
    </div>

    <!-- Divider -->
    <div style="border-top:1px solid #1f2d4a;padding-top:20px;">
      <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
        Bu e-postayı Mehmet Akalın'ın blog newsletter'ına abone olduğunuz için alıyorsunuz.<br />
        <a href="{unsub_url}"
           style="color:#94a3b8;text-decoration:underline;">
          Aboneliği iptal et
        </a>
      </p>
    </div>

  </div>
</body>
</html>"""


def send_newsletter(post) -> int:
    """
    Yeni yayınlanan bir blog yazısı için tüm aktif abonelere e-posta gönderir.
    Gönderilen e-posta sayısını döndürür.
    """
    from .models import Subscriber  # local import (döngüsel önlem)

    subscribers = list(Subscriber.objects.filter(is_active=True))
    if not subscribers:
        logger.info("Newsletter: aktif abone yok, gönderilmedi. (post=%s)", post.slug)
        return 0

    site_url = getattr(settings, "BACKEND_URL", "https://akalin-backend.onrender.com")
    frontend_url = getattr(settings, "FRONTEND_URL", "https://akalin-cms.vercel.app").rstrip("/")
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "onboarding@resend.dev")

    sent = 0
    for sub in subscribers:
        try:
            plain = (
                f"{post.title}\n\n"
                f"{post.summary}\n\n"
                f"Oku: {frontend_url}/tr/blog/{post.slug}\n\n"
                f"Aboneliği iptal et: {site_url}/api/newsletter/unsubscribe/{sub.token}/"
            )
            html_body = _build_html(post, sub.token, site_url, frontend_url)

            msg = EmailMultiAlternatives(
                subject=f"[Blog] {post.title}",
                body=plain,
                from_email=from_email,
                to=[sub.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
            sent += 1
        except Exception as exc:
            logger.error(
                "Newsletter gönderilemedi: %s → %s",
                sub.email,
                exc,
                exc_info=True,
            )

    logger.info(
        "Newsletter gönderildi: %d/%d abone. (post=%s)",
        sent,
        len(subscribers),
        post.slug,
    )
    return sent
