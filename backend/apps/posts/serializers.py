from django.db.models import Count
from rest_framework import serializers

from apps.media.serializers import MediaSerializer
from apps.utils.serializers import TranslatedSerializerMixin

from .models import BlogPost, Category, Comment, Reaction, Series, Tag


class CategorySerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True, allow_unicode=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "post_count"]
        translatable_fields = ["name", "description"]

    def get_post_count(self, obj):
        return obj.posts.filter(status=BlogPost.Status.PUBLISHED).count()


class TagSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, allow_unicode=True)

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "color"]
        translatable_fields = ["name"]


# ── Series ────────────────────────────────────────────────────────────────────

class SeriesPostStubSerializer(serializers.ModelSerializer):
    """Seri içindeki yazı özeti (tam serializer değil — döngüsel önlem)."""
    class Meta:
        model = BlogPost
        fields = ["id", "title", "slug", "series_order"]


class SeriesSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Series
        fields = ["id", "title", "slug", "description", "post_count", "created_at"]
        translatable_fields = ["title", "description"]

    def get_post_count(self, obj):
        return obj.posts.filter(status=BlogPost.Status.PUBLISHED).count()


class SeriesDetailSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    posts = serializers.SerializerMethodField()

    class Meta:
        model = Series
        fields = ["id", "title", "slug", "description", "posts", "created_at"]
        translatable_fields = ["title", "description"]

    def get_posts(self, obj):
        qs = (
            obj.posts.filter(status=BlogPost.Status.PUBLISHED)
            .order_by("series_order")
            .values("id", "title", "slug", "series_order", "reading_time")
        )
        return list(qs)


class SeriesAdminSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True, allow_unicode=True)

    class Meta:
        model = Series
        fields = [
            "id", "title", "title_en", "slug",
            "description", "description_en", "post_count", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_post_count(self, obj):
        return obj.posts.count()


# ── Comment ───────────────────────────────────────────────────────────────────

class CommentReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "name", "body", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    """Public — e-posta gösterilmez."""
    replies = CommentReplySerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "name", "body", "created_at", "parent", "replies"]


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["name", "email", "body", "parent"]

    def validate_body(self, value):
        stripped = value.strip()
        if len(stripped) < 3:
            raise serializers.ValidationError("Yorum en az 3 karakter olmalı.")
        return stripped

    def validate_name(self, value):
        return value.strip()[:100]


class CommentAdminSerializer(serializers.ModelSerializer):
    post_slug = serializers.CharField(source="post.slug", read_only=True)
    post_title = serializers.CharField(source="post.title", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id", "post_slug", "post_title",
            "name", "email", "body",
            "is_approved", "parent", "created_at",
        ]
        read_only_fields = ["id", "post_slug", "post_title", "created_at"]


# ── BlogPost ──────────────────────────────────────────────────────────────────

def _get_series_info(post):
    if not post.series_id:
        return None
    series = post.series
    posts = list(
        series.posts
        .filter(status=BlogPost.Status.PUBLISHED)
        .order_by("series_order")
        .values("id", "title", "slug", "series_order", "reading_time")
    )
    return {
        "id":            str(series.id),
        "title":         series.title,
        "title_en":      series.title_en,
        "slug":          series.slug,
        "posts":         posts,
        "current_order": post.series_order,
    }


def _get_reaction_counts(post):
    counts = {e: 0 for e in ("like", "heart", "fire", "thinking", "clap")}
    for r in post.reactions.values("emoji").annotate(n=Count("id")):
        counts[r["emoji"]] = r["n"]
    return counts


class PostListSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    featured_image = MediaSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    series_title = serializers.SerializerMethodField()
    series_slug  = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "summary", "status",
            "featured_image", "categories", "tags",
            "reading_time", "view_count", "created_at",
            "series_title", "series_slug",
        ]
        translatable_fields = ["title", "summary"]

    def get_series_title(self, obj):
        return obj.series.title if obj.series_id else None

    def get_series_slug(self, obj):
        return obj.series.slug if obj.series_id else None


class PostDetailSerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    featured_image = MediaSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    series_info     = serializers.SerializerMethodField()
    reaction_counts = serializers.SerializerMethodField()
    comment_count   = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "summary", "content_html", "status",
            "featured_image", "categories", "tags",
            "meta_title", "meta_description",
            "reading_time", "view_count", "created_at", "updated_at",
            "series_info", "reaction_counts", "comment_count",
        ]
        translatable_fields = ["title", "summary", "content_html"]

    def get_series_info(self, obj):
        return _get_series_info(obj)

    def get_reaction_counts(self, obj):
        return _get_reaction_counts(obj)

    def get_comment_count(self, obj):
        return obj.comments.filter(is_approved=True, parent__isnull=True).count()


class PostAdminSerializer(serializers.ModelSerializer):
    featured_image_detail = MediaSerializer(source="featured_image", read_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True, allow_unicode=True)

    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), required=False
    )
    categories_detail = CategorySerializer(source="categories", many=True, read_only=True)
    tags_detail       = TagSerializer(source="tags", many=True, read_only=True)

    series_detail = SeriesSerializer(source="series", read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "title_en", "slug", "summary", "summary_en",
            "content_html", "content_html_en", "content_json", "content_json_en",
            "status", "publish_at",
            "featured_image", "featured_image_detail",
            "categories", "categories_detail",
            "tags", "tags_detail",
            "series", "series_order", "series_detail",
            "meta_title", "meta_description",
            "reading_time", "view_count",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "reading_time", "view_count", "created_at", "updated_at",
        ]
