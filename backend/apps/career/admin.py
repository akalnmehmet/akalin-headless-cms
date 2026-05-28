from django.contrib import admin

from .models import CareerEntry


@admin.register(CareerEntry)
class CareerEntryAdmin(admin.ModelAdmin):
    list_display = ["position", "company", "entry_type", "start_date", "end_date", "is_current", "sort_order"]
    list_filter = ["entry_type", "is_current"]
    ordering = ["-start_date"]
    fields = [
        "company", "company_en", "position", "position_en",
        "location", "location_en", "entry_type",
        "description", "description_en", "tech_stack",
        "start_date", "end_date", "is_current",
        "sort_order",
    ]
