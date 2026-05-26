from rest_framework import serializers

from .models import Media


class MediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = [
            "id", "file_url", "original_name", "mime_type",
            "file_size", "width", "height", "alt_text", "uploaded_at",
        ]
        read_only_fields = ["id", "file_url", "mime_type", "file_size", "width", "height", "uploaded_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None
