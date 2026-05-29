from django.contrib import admin
from django.utils.html import format_html

from .models import BlogPost, Category, Comment, Reaction, Series, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    fields = ["name", "name_en", "slug", "description", "description_en"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "color"]
    prepopulated_fields = {"slug": ("name",)}
    fields = ["name", "name_en", "slug", "color"]


@admin.register(Series)
class SeriesAdmin(admin.ModelAdmin):
    list_display  = ["title", "slug", "post_count", "created_at"]
    prepopulated_fields = {"slug": ("title",)}
    fields = ["title", "title_en", "slug", "description", "description_en"]

    @admin.display(description="Yazı sayısı")
    def post_count(self, obj):
        return obj.posts.count()


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "series", "series_order", "reading_time", "view_count", "created_at"]
    list_filter  = ["status", "series", "categories", "tags"]
    search_fields = ["title", "summary"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "created_at"
    filter_horizontal = ["categories", "tags"]
    fields = [
        "title", "title_en", "slug", "summary", "summary_en",
        "content_html", "content_html_en", "content_json", "content_json_en", "status",
        "featured_image", "categories", "tags",
        "series", "series_order",
        "meta_title", "meta_description", "publish_at",
    ]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display  = ["name", "post_link", "is_approved", "created_at"]
    list_filter   = ["is_approved"]
    search_fields = ["name", "email", "body", "post__slug"]
    readonly_fields = ["ip_hash", "created_at"]
    ordering      = ["-created_at"]
    actions       = ["approve_comments", "reject_comments"]

    @admin.display(description="Yazı")
    def post_link(self, obj):
        return format_html('<a href="/admin/posts/blogpost/{}/change/">{}</a>',
                           obj.post.pk, obj.post.title[:40])

    @admin.action(description="Seçili yorumları onayla")
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Seçili yorumları reddet")
    def reject_comments(self, request, queryset):
        queryset.update(is_approved=False)


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ["post", "emoji", "created_at"]
    list_filter  = ["emoji"]
    readonly_fields = ["post", "emoji", "ip_hash", "created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
