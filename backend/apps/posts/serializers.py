from rest_framework import serializers

from apps.media.serializers import MediaSerializer
from apps.utils.serializers import TranslatedSerializerMixin

from .models import BlogPost, Category, Tag


class CategorySerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "post_count"]
        translatable_fields = ["name", "description"]

    def get_post_count(self, obj):
        return obj.posts.filter(status=BlogPost.Status.PUBLISHED).count()


class TagSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "color"]
        translatable_fields = ["name"]


class PostListSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    featured_image = MediaSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "summary", "status",
            "featured_image", "categories", "tags",
            "reading_time", "view_count", "created_at",
        ]
        translatable_fields = ["title", "summary"]


class PostDetailSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    featured_image = MediaSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "summary", "content_html", "status",
            "featured_image", "categories", "tags",
            "meta_title", "meta_description",
            "reading_time", "view_count", "created_at", "updated_at",
        ]
        translatable_fields = ["title", "summary", "content_html"]


class PostAdminSerializer(serializers.ModelSerializer):
    featured_image_detail = MediaSerializer(source="featured_image", read_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True, allow_unicode=True)

    # Yazma: UUID listesi  |  Okuma: tam nesne listesi
    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), required=False
    )
    categories_detail = CategorySerializer(source="categories", many=True, read_only=True)
    tags_detail = TagSerializer(source="tags", many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "title_en", "slug", "summary", "summary_en",
            "content_html", "content_html_en", "content_json", "content_json_en", "status", "publish_at",
            "featured_image", "featured_image_detail",
            "categories", "categories_detail",
            "tags", "tags_detail",
            "meta_title", "meta_description",
            "reading_time", "view_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "reading_time", "view_count", "created_at", "updated_at"]
