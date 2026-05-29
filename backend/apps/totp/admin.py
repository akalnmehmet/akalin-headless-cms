from django.contrib import admin
from .models import UserTOTP


@admin.register(UserTOTP)
class UserTOTPAdmin(admin.ModelAdmin):
    list_display = ["user", "is_active", "created_at", "activated_at"]
    list_filter = ["is_active"]
    readonly_fields = ["secret", "created_at", "activated_at"]
