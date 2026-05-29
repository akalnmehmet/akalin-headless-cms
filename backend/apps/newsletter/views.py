import html
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Subscriber

logger = logging.getLogger(__name__)

FRONTEND_URL = getattr(settings, "FRONTEND_URL", "https://akalin-cms.vercel.app")


def _send_confirmation_email(subscriber: Subscriber):
    site_url = getattr(settings, "BACKEND_URL", "https://akalin-backend.onrender.com")
    confirm_url = f"{site_url}/api/newsletter/confirm/{subscriber.token}/"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "onboarding@resend.dev")

    plain = (
        "Merhaba!\n\n"
        "Newsletter aboneliğinizi onaylamak için aşağıdaki linke tıklayın:\n"
        f"{confirm_url}\n\n"
        "Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz."
    )
    email_esc = html.escape(subscriber.email)
    confirm_esc = html.escape(confirm_url)
    html_body = f"""<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#0a0d14;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 16px;">
    <div style="border-bottom:1px solid #1f2d4a;padding-bottom:20px;margin-bottom:28px;">
      <span style="font-size:20px;font-weight:700;color:#e2e8f0;">Mehmet Akalın</span>
      <span style="margin-left:10px;font-size:12px;color:#00d4ff;font-family:monospace;
                   background:#003344;padding:2px 8px;border-radius:4px;">newsletter</span>
    </div>
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#e2e8f0;">
      Aboneliğinizi onaylayın
    </h2>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#94a3b8;">
      <strong style="color:#e2e8f0;">{email_esc}</strong> adresiniz için
      newsletter aboneliği başlatıldı. Onaylamak için butona tıklayın.
    </p>
    <a href="{confirm_esc}"
       style="display:inline-block;background:#00d4ff;color:#0a0d14;
              font-size:14px;font-weight:700;padding:12px 28px;
              border-radius:8px;text-decoration:none;">
      Aboneliği Onayla &rarr;
    </a>
    <p style="margin:28px 0 0;font-size:12px;color:#64748b;line-height:1.6;">
      Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
    </p>
  </div>
</body>
</html>"""

    msg = EmailMultiAlternatives(
        subject="Newsletter aboneliğinizi onaylayın — Mehmet Akalın",
        body=plain,
        from_email=from_email,
        to=[subscriber.email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)


class SubscribeView(APIView):
    """POST /api/newsletter/subscribe/  { "email": "..." }"""

    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email or "@" not in email:
            return Response(
                {"detail": "Geçerli bir e-posta adresi girin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub, created = Subscriber.objects.get_or_create(email=email)

        if not created and sub.is_active:
            return Response(
                {"detail": "Bu e-posta zaten aktif olarak abone."},
                status=status.HTTP_409_CONFLICT,
            )

        # Yeni kayıt veya daha önce doğrulamamış → yeni token & onay maili
        if not created:
            # Önceden kayıt var ama aktif değil — yeni token üret
            from .models import _default_token
            sub.token = _default_token()
            sub.is_active = False
            sub.save(update_fields=["token", "is_active"])

        try:
            _send_confirmation_email(sub)
        except Exception as exc:
            logger.error("Abonelik onay maili gönderilemedi: %s → %s", email, exc, exc_info=True)
            return Response(
                {"detail": "Onay e-postası gönderilemedi. Lütfen tekrar deneyin."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"detail": "Onay e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin."},
            status=status.HTTP_201_CREATED,
        )


class ConfirmView(APIView):
    """GET /api/newsletter/confirm/<token>/  → frontend'e yönlendir"""

    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            sub = Subscriber.objects.get(token=token)
        except Subscriber.DoesNotExist:
            return redirect(f"{FRONTEND_URL}/tr/blog?newsletter=invalid")

        if not sub.is_active:
            sub.confirm()

        return redirect(f"{FRONTEND_URL}/tr/blog?newsletter=confirmed")


class UnsubscribeView(APIView):
    """GET /api/newsletter/unsubscribe/<token>/  → frontend'e yönlendir"""

    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            sub = Subscriber.objects.get(token=token)
            sub.unsubscribe()
        except Subscriber.DoesNotExist:
            pass  # Token geçersiz — sessizce yönlendir

        return redirect(f"{FRONTEND_URL}/tr/blog?newsletter=unsubscribed")


class SubscriberListView(APIView):
    """GET /api/newsletter/subscribers/  (admin only)"""

    permission_classes = [IsAdminUser]

    def get(self, request):
        subs = Subscriber.objects.values(
            "id", "email", "is_active", "created_at", "confirmed_at"
        )
        return Response({"count": len(list(subs)), "results": list(subs)})
