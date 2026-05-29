import secrets
import uuid

from django.db import models
from django.utils import timezone


def _default_token():
    return secrets.token_urlsafe(32)


class Subscriber(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name="E-posta")
    token = models.CharField(
        max_length=64,
        unique=True,
        default=_default_token,
        editable=False,
        verbose_name="Token",
    )
    is_active = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Aktif",
        help_text="E-posta doğrulandıktan sonra True olur.",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Kayıt Tarihi")
    confirmed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Doğrulama Tarihi"
    )
    unsubscribed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Çıkış Tarihi"
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Abone"
        verbose_name_plural = "Aboneler"

    def __str__(self):
        status = "aktif" if self.is_active else "doğrulanmadı"
        return f"{self.email} ({status})"

    def confirm(self):
        self.is_active = True
        self.confirmed_at = timezone.now()
        self.save(update_fields=["is_active", "confirmed_at"])

    def unsubscribe(self):
        self.is_active = False
        self.unsubscribed_at = timezone.now()
        self.save(update_fields=["is_active", "unsubscribed_at"])
