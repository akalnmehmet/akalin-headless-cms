import os
import uuid

from django.conf import settings as django_settings
from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteSettings
from .serializers import SiteSettingsAdminSerializer, SiteSettingsSerializer


class SiteSettingsPublicView(APIView):
    """GET /api/site-settings/ — herkese açık"""
    permission_classes = [AllowAny]

    def get(self, request):
        obj = SiteSettings.load()
        return Response(SiteSettingsSerializer(obj).data)


class SiteSettingsAdminView(APIView):
    """GET + PATCH /api/admin/site-settings/ — admin only"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        obj = SiteSettings.load()
        return Response(SiteSettingsAdminSerializer(obj).data)

    def patch(self, request):
        obj = SiteSettings.load()
        serializer = SiteSettingsAdminSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PUT de partial=True ile aynı davranışı sağlar
    put = patch


class CvUploadView(APIView):
    """POST /api/admin/site-settings/cv/ — PDF yükler, cv_url'yi günceller."""

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    MAX_SIZE = 10 * 1024 * 1024  # 10 MB

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Dosya gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        if file.content_type not in ("application/pdf", "application/x-pdf"):
            return Response(
                {"detail": "Yalnızca PDF dosyası yüklenebilir."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > self.MAX_SIZE:
            return Response(
                {"detail": "Dosya 10 MB'dan büyük olamaz."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext      = os.path.splitext(file.name)[1].lower() or ".pdf"
        filename = f"cv/{uuid.uuid4().hex}{ext}"
        saved_path = default_storage.save(filename, file)

        # Mutlak URL oluştur
        media_url = django_settings.MEDIA_URL.rstrip("/")
        file_url  = request.build_absolute_uri(f"{media_url}/{saved_path}")

        # SiteSettings'i güncelle
        obj = SiteSettings.load()
        # Eski dosyayı sil
        if obj.cv_url:
            old_path = obj.cv_url.split(media_url + "/")[-1] if media_url in obj.cv_url else ""
            if old_path:
                default_storage.delete(old_path)
        obj.cv_url = file_url
        obj.save(update_fields=["cv_url"])

        return Response({"cv_url": file_url}, status=status.HTTP_201_CREATED)
