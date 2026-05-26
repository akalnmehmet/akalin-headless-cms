import uuid

from django.db import models
from django.utils.text import slugify


class Project(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Aktif"
        ARCHIVED = "ARCHIVED", "Arşivlendi"
        IN_PROGRESS = "IN_PROGRESS", "Devam Ediyor"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=150)
    slug = models.SlugField(unique=True, max_length=180, allow_unicode=True)
    description = models.TextField()
    tech_stack = models.JSONField(default=list)
    thumbnail = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="project_thumbnails",
    )
    gallery = models.ManyToManyField(
        "media.Media",
        blank=True,
        related_name="project_gallery",
    )
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.ACTIVE, db_index=True
    )
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["sort_order", "-id"]
        verbose_name = "Proje"
        verbose_name_plural = "Projeler"
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
            models.Index(fields=["sort_order"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title, allow_unicode=True)
            slug = base_slug
            counter = 1
            while Project.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
