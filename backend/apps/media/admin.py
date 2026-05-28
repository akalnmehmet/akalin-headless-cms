from django.contrib import admin

from .models import Media


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ["original_name", "mime_type", "file_size", "width", "height", "uploaded_at"]
    search_fields = ["original_name", "alt_text"]
    readonly_fields = ["mime_type", "file_size", "width", "height", "uploaded_at"]

    def save_model(self, request, obj, form, change):
        if "file" in form.changed_data:
            uploaded = form.cleaned_data.get("file")
            if uploaded:
                obj.file_size = uploaded.size
                obj.mime_type = getattr(uploaded, "content_type", "application/octet-stream")
                try:
                    from PIL import Image
                    img = Image.open(uploaded)
                    obj.width, obj.height = img.size
                    uploaded.seek(0)
                except Exception:
                    obj.width = None
                    obj.height = None
        super().save_model(request, obj, form, change)
