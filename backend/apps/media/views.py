from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Media
from .serializers import MediaSerializer


class MediaListCreateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    def get(self, request):
        media = Media.objects.all()
        serializer = MediaSerializer(media, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Dosya gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        if file.content_type not in settings.MEDIA_ALLOWED_TYPES:
            return Response(
                {"detail": f"Desteklenmeyen dosya türü: {file.content_type}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > settings.MEDIA_MAX_UPLOAD_SIZE:
            return Response(
                {"detail": "Dosya boyutu 5MB limitini aşıyor."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            img = Image.open(file)
            original_width, original_height = img.size

            img.thumbnail(
                (settings.MEDIA_MAX_DIMENSION, settings.MEDIA_MAX_DIMENSION),
                Image.LANCZOS,
            )

            output = BytesIO()
            img.save(output, format="WEBP", quality=85, optimize=True)
            output.seek(0)

            webp_content = ContentFile(output.read())
            original_name = file.name
            webp_name = original_name.rsplit(".", 1)[0] + ".webp"

            media_obj = Media(
                original_name=original_name,
                mime_type="image/webp",
                file_size=webp_content.size,
                width=img.width,
                height=img.height,
                alt_text=request.data.get("alt_text", ""),
            )
            media_obj.file.save(webp_name, webp_content, save=True)

        except Exception as exc:
            return Response(
                {"detail": f"Görsel işleme hatası: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MediaSerializer(media_obj, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MediaDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            media = Media.objects.get(pk=pk)
        except Media.DoesNotExist:
            return Response({"detail": "Bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        media.file.delete(save=False)
        media.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
