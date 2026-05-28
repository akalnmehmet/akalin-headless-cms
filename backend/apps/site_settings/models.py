from django.db import models


class SiteSettings(models.Model):
    """Singleton model — her zaman pk=1 kaydı kullanılır."""

    owner_name    = models.CharField(max_length=100, default="Mehmet Akalın")
    owner_image   = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="site_settings_avatars",
        verbose_name="Profil Fotoğrafı"
    )
    owner_title   = models.CharField(max_length=200, default="Yazılım mühendisi")
    owner_title_en = models.CharField(max_length=200, blank=True, null=True, default="Software engineer")
    owner_bio     = models.TextField(
        blank=True,
        default="ROS2, Django ve React ile robotikten web'e uzanan sistemler geliştiriyorum.",
    )
    owner_bio_en  = models.TextField(
        blank=True,
        null=True,
        default="I build systems stretching from robotics to web using ROS2, Django, and React.",
    )
    about_bio     = models.TextField(
        blank=True,
        default="",
        verbose_name="Hakkımda Biyografisi"
    )
    about_bio_en  = models.TextField(
        blank=True,
        null=True,
        default="",
        verbose_name="Hakkımda Biyografisi (EN)"
    )
    status_text   = models.CharField(max_length=100, default="Aktif geliştirme yapıyor")
    status_text_en = models.CharField(max_length=100, blank=True, null=True, default="Actively developing")
    status_active = models.BooleanField(default=True)
    skills        = models.JSONField(
        default=list,
        help_text='JSON liste: ["Python", "Django", ...]',
    )
    github_url   = models.URLField(blank=True, default="")
    linkedin_url = models.URLField(blank=True, default="")
    cv_url       = models.URLField(blank=True, default="", verbose_name="CV Dosyası URL")

    class Meta:
        verbose_name        = "Site Ayarları"
        verbose_name_plural = "Site Ayarları"

    def save(self, *args, **kwargs):
        self.pk = 1          # singleton — yalnızca bir kayıt
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass                 # singleton silinemez

    @classmethod
    def load(cls) -> "SiteSettings":
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "skills": [
                    "Python", "Django", "React", "TypeScript",
                    "ROS2", "SLAM", "Docker", "PostgreSQL", "C++",
                ],
            },
        )
        return obj
