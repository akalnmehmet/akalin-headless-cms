from django.contrib import admin

from .models import Media


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ["original_name", "mime_type", "file_size", "width", "height", "uploaded_at"]
    search_fields = ["original_name", "alt_text"]
    readonly_fields = ["mime_type", "file_size", "width", "height", "uploaded_at"]
