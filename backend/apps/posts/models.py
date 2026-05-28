import uuid

from django.db import models
from django.utils.text import slugify

from .utils import sanitize_html


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True, null=True)
    slug = models.SlugField(unique=True, max_length=120)
    description = models.TextField(blank=True)
    description_en = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Kategori"
        verbose_name_plural = "Kategoriler"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    name_en = models.CharField(max_length=50, blank=True, null=True)
    slug = models.SlugField(unique=True, max_length=70)
    color = models.CharField(max_length=7, default="#3B82F6")  # Tailwind blue-500

    class Meta:
        ordering = ["name"]
        verbose_name = "Etiket"
        verbose_name_plural = "Etiketler"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Taslak"
        PUBLISHED = "PUBLISHED", "Yayında"
        ARCHIVED = "ARCHIVED", "Arşivlendi"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(unique=True, max_length=280, allow_unicode=True)
    summary = models.TextField()
    summary_en = models.TextField(blank=True, null=True)
    content_html = models.TextField(blank=True)
    content_html_en = models.TextField(blank=True, null=True)
    content_json = models.JSONField(default=dict)
    content_json_en = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT, db_index=True)
    featured_image = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="featured_posts",
    )
    categories = models.ManyToManyField(Category, blank=True, related_name="posts")
    tags = models.ManyToManyField(Tag, blank=True, related_name="posts")
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.TextField(blank=True)
    publish_at = models.DateTimeField(
        null=True, blank=True, db_index=True,
        verbose_name="Zamanlanmış Yayın",
    )
    reading_time = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Blog Yazısı"
        verbose_name_plural = "Blog Yazıları"
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return self.title

    def _generate_unique_slug(self):
        base_slug = slugify(self.title, allow_unicode=True)
        slug = base_slug
        counter = 1
        while BlogPost.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def _calculate_reading_time(self):
        word_count = len(self.content_html.split())
        return max(1, word_count // 200)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        if self.content_html:
            self.content_html = sanitize_html(self.content_html)
            self.reading_time = self._calculate_reading_time()
        super().save(*args, **kwargs)
