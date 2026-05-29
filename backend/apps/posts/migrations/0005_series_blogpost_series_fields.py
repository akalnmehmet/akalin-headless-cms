import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0004_blogpost_newsletter_sent"),
    ]

    operations = [
        # 1. Series modeli
        migrations.CreateModel(
            name="Series",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title",          models.CharField(max_length=200, verbose_name="Başlık")),
                ("title_en",       models.CharField(blank=True, max_length=200, null=True, verbose_name="Başlık (EN)")),
                ("slug",           models.SlugField(allow_unicode=True, max_length=220, unique=True)),
                ("description",    models.TextField(blank=True, verbose_name="Açıklama")),
                ("description_en", models.TextField(blank=True, null=True, verbose_name="Açıklama (EN)")),
                ("created_at",     models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Seri",
                "verbose_name_plural": "Seriler",
                "ordering": ["title"],
            },
        ),
        # 2. BlogPost'a series FK ve series_order ekle
        migrations.AddField(
            model_name="blogpost",
            name="series",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="posts",
                to="posts.series",
                verbose_name="Seri",
            ),
        ),
        migrations.AddField(
            model_name="blogpost",
            name="series_order",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                verbose_name="Seri Sırası",
                help_text="Serideki sıra numarası (1'den başlar).",
            ),
        ),
    ]
