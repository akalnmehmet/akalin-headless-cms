import uuid

from django.db import models


def media_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower()
    return f"uploads/{uuid.uuid4().hex}.{ext}"


class Media(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=media_upload_path)
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name = "Medya"
        verbose_name_plural = "Medyalar"

    def __str__(self):
        return self.original_name
