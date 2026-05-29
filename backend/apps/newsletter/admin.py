from django.contrib import admin
from django.utils.html import format_html

from .models import Subscriber


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "status_badge", "created_at", "confirmed_at")
    list_filter = ("is_active",)
    search_fields = ("email",)
    readonly_fields = ("token", "created_at", "confirmed_at", "unsubscribed_at")
    ordering = ("-created_at",)

    @admin.display(description="Durum")
    def status_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="color:#10b981;font-weight:600;">Aktif</span>'
            )
        return format_html(
            '<span style="color:#94a3b8;">Doğrulanmadı</span>'
        )
