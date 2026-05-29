import hashlib
import uuid

from django.db import models
from django.utils.text import slugify

from .utils import sanitize_html


def _ip_hash(ip: str) -> str:
    """IP'yi kalıcı olarak hash'le (asla orijinal IP saklanmaz)."""
    return hashlib.sha256(ip.strip().encode()).hexdigest()[:24]


class Series(models.Model):
    """Blog yazılarını seriler / koleksiyonlar halinde gruplar."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name="Başlık")
    title_en = models.CharField(max_length=200, blank=True, null=True, verbose_name="Başlık (EN)")
    slug = models.SlugField(unique=True, max_length=220, allow_unicode=True)
    description = models.TextField(blank=True, verbose_name="Açıklama")
    description_en = models.TextField(blank=True, null=True, verbose_name="Açıklama (EN)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["title"]
        verbose_name = "Seri"
        verbose_name_plural = "Seriler"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


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
    # ── Seri ──────────────────────────────────────────────────────────────────
    series = models.ForeignKey(
        Series,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="posts",
        verbose_name="Seri",
    )
    series_order = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Seri Sırası",
        help_text="Serideki sıra numarası (1'den başlar).",
    )

    reading_time = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    newsletter_sent = models.BooleanField(
        default=False,
        verbose_name="Newsletter Gönderildi",
        help_text="Bu yazı için abonelere e-posta gönderildi mi?",
    )
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


class Comment(models.Model):
    """Blog yazısına yapılan yorum. Onaylanmadan public API'de görünmez."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        BlogPost, on_delete=models.CASCADE, related_name="comments"
    )
    parent = models.ForeignKey(
        "self",
        null=True, blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
        verbose_name="Yanıtlanan Yorum",
    )
    name  = models.CharField(max_length=100, verbose_name="Ad")
    email = models.EmailField(verbose_name="E-posta")
    body  = models.TextField(max_length=2000, verbose_name="Yorum")
    is_approved = models.BooleanField(
        default=False, db_index=True, verbose_name="Onaylandı"
    )
    ip_hash = models.CharField(max_length=64, blank=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Yorum"
        verbose_name_plural = "Yorumlar"

    def __str__(self):
        return f"{self.name} → {self.post.slug[:30]}"


class Reaction(models.Model):
    """Blog yazısına anonim emoji tepkisi. IP bazlı tekrar önleme."""

    EMOJI_CHOICES = [
        ("like",     "like"),
        ("heart",    "heart"),
        ("fire",     "fire"),
        ("thinking", "thinking"),
        ("clap",     "clap"),
    ]

    post  = models.ForeignKey(
        BlogPost, on_delete=models.CASCADE, related_name="reactions"
    )
    emoji   = models.CharField(max_length=20, choices=EMOJI_CHOICES, db_index=True)
    ip_hash = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("post", "emoji", "ip_hash")]
        verbose_name = "Tepki"
        verbose_name_plural = "Tepkiler"

    def __str__(self):
        return f"{self.emoji} → {self.post.slug[:30]}"
