from rest_framework import serializers

from apps.media.serializers import MediaSerializer
from apps.utils.serializers import TranslatedSerializerMixin

from .models import Project


class ProjectListSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    thumbnail = MediaSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "title", "slug", "description", "tech_stack",
            "thumbnail", "github_url", "live_url",
            "status", "is_featured", "sort_order",
            "start_date", "end_date",
        ]
        translatable_fields = ["title", "description"]


class ProjectDetailSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    thumbnail = MediaSerializer(read_only=True)
    gallery = MediaSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "title", "slug", "description", "tech_stack",
            "thumbnail", "gallery",
            "github_url", "live_url",
            "status", "is_featured", "sort_order",
            "start_date", "end_date",
        ]
        translatable_fields = ["title", "description"]


class ProjectAdminSerializer(serializers.ModelSerializer):
    thumbnail_detail = MediaSerializer(source="thumbnail", read_only=True)
    gallery_detail = MediaSerializer(source="gallery", many=True, read_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True, allow_unicode=True)

    class Meta:
        model = Project
        fields = [
            "id", "title", "title_en", "slug", "description", "description_en", "tech_stack",
            "thumbnail", "thumbnail_detail",
            "gallery", "gallery_detail",
            "github_url", "live_url",
            "status", "is_featured", "sort_order",
            "start_date", "end_date",
        ]
        read_only_fields = ["id"]


class ProjectReorderSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    sort_order = serializers.IntegerField(min_value=0)
