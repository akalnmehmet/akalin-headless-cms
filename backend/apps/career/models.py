import uuid

from django.db import models


class CareerEntry(models.Model):
    ENTRY_TYPE_CHOICES = [
        ("WORK", "İş Deneyimi"),
        ("EDUCATION", "Eğitim"),
        ("VOLUNTEER", "Gönüllülük"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Temel bilgiler
    company = models.CharField(max_length=150, verbose_name="Kurum / Şirket")
    company_en = models.CharField(max_length=150, blank=True, null=True, verbose_name="Kurum / Şirket (EN)")
    position = models.CharField(max_length=150, verbose_name="Pozisyon / Unvan")
    position_en = models.CharField(max_length=150, blank=True, null=True, verbose_name="Pozisyon / Unvan (EN)")
    location = models.CharField(max_length=100, blank=True, verbose_name="Konum")
    location_en = models.CharField(max_length=100, blank=True, null=True, verbose_name="Konum (EN)")
    entry_type = models.CharField(
        max_length=20,
        choices=ENTRY_TYPE_CHOICES,
        default="WORK",
        verbose_name="Tür",
    )

    # Açıklama
    description = models.TextField(blank=True, verbose_name="Açıklama")
    description_en = models.TextField(blank=True, null=True, verbose_name="Açıklama (EN)")

    # Teknolojiler / Kullanılan araçlar
    tech_stack = models.JSONField(default=list, blank=True, verbose_name="Teknolojiler")

    # Tarihler
    start_date = models.DateField(verbose_name="Başlangıç Tarihi")
    end_date = models.DateField(null=True, blank=True, verbose_name="Bitiş Tarihi")
    is_current = models.BooleanField(default=False, verbose_name="Devam Ediyor")

    # Sıralama
    sort_order = models.PositiveIntegerField(default=0, verbose_name="Sıra")

    class Meta:
        ordering = ["-start_date", "sort_order"]
        verbose_name = "Kariyer Kaydı"
        verbose_name_plural = "Kariyer Kayıtları"

    def __str__(self) -> str:
        return f"{self.position} @ {self.company}"
