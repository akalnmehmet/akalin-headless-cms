from django.contrib import admin

from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["owner_name", "owner_title", "status_text", "status_active"]
    fields = [
        "owner_name", "owner_image", "owner_title", "owner_title_en",
        "owner_bio", "owner_bio_en",
        "about_bio", "about_bio_en",
        "status_text", "status_text_en", "status_active",
        "skills", "github_url", "linkedin_url", "cv_url",
    ]

    def has_add_permission(self, request):
        # Singleton: Sadece bir tane olabilir, bu yüzden ekleme izni verilmez (zaten load() otomatik oluşturur)
        return False

    def has_delete_permission(self, request, obj=None):
        # Singleton silinemez
        return False
