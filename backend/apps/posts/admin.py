from django.contrib import admin

from .models import BlogPost, Category, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "color"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "reading_time", "view_count", "created_at"]
    list_filter = ["status", "categories", "tags"]
    search_fields = ["title", "summary"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "created_at"
    filter_horizontal = ["categories", "tags"]
