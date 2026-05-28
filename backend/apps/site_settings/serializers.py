from rest_framework import serializers

from apps.media.serializers import MediaSerializer
from apps.utils.serializers import TranslatedSerializerMixin

from .models import SiteSettings


class SiteSettingsSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    owner_image = MediaSerializer(read_only=True)

    class Meta:
        model = SiteSettings
        fields = [
            "id",
            "owner_name",
            "owner_image",
            "owner_title",
            "owner_bio",
            "about_bio",
            "status_text",
            "status_active",
            "skills",
            "github_url",
            "linkedin_url",
            "cv_url",
        ]
        translatable_fields = ["owner_title", "owner_bio", "about_bio", "status_text"]


class SiteSettingsAdminSerializer(serializers.ModelSerializer):
    owner_image_detail = MediaSerializer(source="owner_image", read_only=True)

    class Meta:
        model = SiteSettings
        fields = [
            "id",
            "owner_name",
            "owner_image",
            "owner_image_detail",
            "owner_title",
            "owner_title_en",
            "owner_bio",
            "owner_bio_en",
            "about_bio",
            "about_bio_en",
            "status_text",
            "status_text_en",
            "status_active",
            "skills",
            "github_url",
            "linkedin_url",
            "cv_url",
        ]
