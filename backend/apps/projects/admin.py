from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "is_featured", "sort_order", "start_date"]
    list_filter = ["status", "is_featured"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ["gallery"]
