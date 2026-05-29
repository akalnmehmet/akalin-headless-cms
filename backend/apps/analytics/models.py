import uuid

from django.db import models


class PageView(models.Model):
    """
    Her sayfa görüntülemesi için anonim bir kayıt.
    IP adresi SAKLANMAZ — yalnızca geo sonucu (ülke, şehir, koordinat) saklanır.
    """

    DEVICE_CHOICES = [
        ("desktop", "Desktop"),
        ("mobile",  "Mobile"),
        ("tablet",  "Tablet"),
        ("bot",     "Bot"),
        ("unknown", "Unknown"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Hangi sayfa
    path = models.CharField(max_length=500, db_index=True, verbose_name="Sayfa Yolu")

    # Referrer domain (örn. "google.com", "direct", "twitter.com")
    referrer = models.CharField(max_length=200, blank=True, default="direct", db_index=True)

    # Coğrafya (şehir merkez koordinatları, IP asla saklanmaz)
    country_code = models.CharField(max_length=2,   blank=True, db_index=True)
    country_name = models.CharField(max_length=100, blank=True)
    city         = models.CharField(max_length=100, blank=True)
    lat          = models.FloatField(null=True, blank=True)
    lng          = models.FloatField(null=True, blank=True)

    # Cihaz türü (user-agent'tan tespit edilir)
    device_type = models.CharField(
        max_length=10, choices=DEVICE_CHOICES, default="unknown", db_index=True
    )

    # Zaman
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Sayfa Görüntüleme"
        verbose_name_plural = "Sayfa Görüntülemeleri"
        indexes = [
            models.Index(fields=["path", "timestamp"]),
            models.Index(fields=["country_code", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.path} — {self.country_code or '?'} — {self.timestamp:%Y-%m-%d %H:%M}"
