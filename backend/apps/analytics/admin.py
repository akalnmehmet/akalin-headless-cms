from django.contrib import admin

from .models import PageView


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display  = ("path", "country_code", "city", "device_type", "referrer", "timestamp")
    list_filter   = ("device_type", "country_code")
    search_fields = ("path", "country_name", "city", "referrer")
    readonly_fields = (
        "id", "path", "referrer", "country_code", "country_name",
        "city", "lat", "lng", "device_type", "timestamp",
    )
    ordering = ("-timestamp",)
    date_hierarchy = "timestamp"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
