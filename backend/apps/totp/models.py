from django.conf import settings
from django.db import models


class UserTOTP(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="totp_device",
    )
    secret = models.CharField(max_length=64)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "2FA Cihazı"
        verbose_name_plural = "2FA Cihazları"

    def __str__(self):
        status = "aktif" if self.is_active else "bekliyor"
        return f"{self.user.username} ({status})"
