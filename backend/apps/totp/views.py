import base64
import io
import uuid

import pyotp
import qrcode
from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserTOTP

User = get_user_model()
TOTP_SESSION_TTL = 300  # 5 dakika


def _make_tokens(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class TOTPVerifyThrottle(AnonRateThrottle):
    scope = "totp_verify"


class AdminLoginView(APIView):
    """
    POST /api/auth/login/
    Kullanıcı adı + şifre doğrular.
    2FA aktifse session_key döner; değilse direkt JWT token döner.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        user = authenticate(request, username=username, password=password)
        if user is None or not user.is_staff:
            return Response(
                {"detail": "Kullanıcı adı veya şifre hatalı."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 2FA etkin mi?
        try:
            device = user.totp_device
            if device.is_active:
                session_key = str(uuid.uuid4())
                cache.set(f"totp_session:{session_key}", user.pk, TOTP_SESSION_TTL)
                return Response({"requires_2fa": True, "session_key": session_key})
        except UserTOTP.DoesNotExist:
            pass

        return Response(_make_tokens(user))


class TOTPVerifyView(APIView):
    """
    POST /api/auth/totp-verify/
    {session_key, code} → JWT tokens
    """
    permission_classes = [AllowAny]
    throttle_classes = [TOTPVerifyThrottle]

    def post(self, request):
        session_key = request.data.get("session_key", "")
        code = (request.data.get("code") or "").strip().replace(" ", "")

        user_pk = cache.get(f"totp_session:{session_key}")
        if not user_pk:
            return Response(
                {"detail": "Oturum süresi doldu veya geçersiz. Lütfen tekrar giriş yapın."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=user_pk)
            totp = pyotp.TOTP(user.totp_device.secret)
            if not totp.verify(code, valid_window=1):
                return Response(
                    {"detail": "Kod geçersiz. Lütfen tekrar deneyin."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (User.DoesNotExist, UserTOTP.DoesNotExist):
            return Response({"detail": "Hata oluştu."}, status=status.HTTP_400_BAD_REQUEST)

        cache.delete(f"totp_session:{session_key}")
        return Response(_make_tokens(user))


class TOTPSetupView(APIView):
    """
    GET  /api/auth/totp-setup/ → {is_active, secret, qr_image}
    POST /api/auth/totp-setup/ {code} → aktifleştirir
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        user = request.user

        # Zaten aktifse
        try:
            if user.totp_device.is_active:
                return Response({"is_active": True})
        except UserTOTP.DoesNotExist:
            pass

        # Yeni secret üret (veya bekleyen varsa güncelle)
        secret = pyotp.random_base32()
        UserTOTP.objects.update_or_create(
            user=user,
            defaults={"secret": secret, "is_active": False},
        )

        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.username,
            issuer_name="Mehmet Akalın CMS",
        )

        img = qrcode.make(provisioning_uri)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()

        return Response({
            "is_active": False,
            "secret": secret,
            "qr_image": f"data:image/png;base64,{qr_b64}",
            "provisioning_uri": provisioning_uri,
        })

    def post(self, request):
        code = (request.data.get("code") or "").strip().replace(" ", "")
        user = request.user

        try:
            device = user.totp_device
        except UserTOTP.DoesNotExist:
            return Response(
                {"detail": "Önce QR kodunu oluşturun (GET isteği)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(device.secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {"detail": "Kod geçersiz. Authenticator uygulamasından kodu tekrar girin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        device.is_active = True
        device.activated_at = timezone.now()
        device.save(update_fields=["is_active", "activated_at"])

        return Response({"detail": "2FA başarıyla etkinleştirildi."})


class TOTPDisableView(APIView):
    """
    POST /api/auth/totp-disable/ {code} → 2FA'yı siler
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        code = (request.data.get("code") or "").strip().replace(" ", "")
        user = request.user

        try:
            device = user.totp_device
        except UserTOTP.DoesNotExist:
            return Response({"detail": "2FA zaten devre dışı."}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(device.secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {"detail": "Kod geçersiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        device.delete()
        return Response({"detail": "2FA devre dışı bırakıldı."})


class TOTPStatusView(APIView):
    """GET /api/auth/totp-status/ → {is_active}"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            return Response({"is_active": request.user.totp_device.is_active})
        except UserTOTP.DoesNotExist:
            return Response({"is_active": False})
