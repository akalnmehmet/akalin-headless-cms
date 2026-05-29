import apps.newsletter.models
import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Subscriber",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("email", models.EmailField(unique=True, verbose_name="E-posta")),
                (
                    "token",
                    models.CharField(
                        default=apps.newsletter.models._default_token,
                        editable=False,
                        max_length=64,
                        unique=True,
                        verbose_name="Token",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        db_index=True,
                        default=False,
                        help_text="E-posta doğrulandıktan sonra True olur.",
                        verbose_name="Aktif",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Kayıt Tarihi")),
                ("confirmed_at", models.DateTimeField(blank=True, null=True, verbose_name="Doğrulama Tarihi")),
                ("unsubscribed_at", models.DateTimeField(blank=True, null=True, verbose_name="Çıkış Tarihi")),
            ],
            options={
                "verbose_name": "Abone",
                "verbose_name_plural": "Aboneler",
                "ordering": ["-created_at"],
            },
        ),
    ]
