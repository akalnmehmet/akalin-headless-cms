import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="PageView",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("path", models.CharField(db_index=True, max_length=500, verbose_name="Sayfa Yolu")),
                ("referrer", models.CharField(blank=True, db_index=True, default="direct", max_length=200)),
                ("country_code", models.CharField(blank=True, db_index=True, max_length=2)),
                ("country_name", models.CharField(blank=True, max_length=100)),
                ("city",         models.CharField(blank=True, max_length=100)),
                ("lat",          models.FloatField(blank=True, null=True)),
                ("lng",          models.FloatField(blank=True, null=True)),
                (
                    "device_type",
                    models.CharField(
                        choices=[
                            ("desktop", "Desktop"),
                            ("mobile",  "Mobile"),
                            ("tablet",  "Tablet"),
                            ("bot",     "Bot"),
                            ("unknown", "Unknown"),
                        ],
                        db_index=True,
                        default="unknown",
                        max_length=10,
                    ),
                ),
                ("timestamp", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "verbose_name": "Sayfa Görüntüleme",
                "verbose_name_plural": "Sayfa Görüntülemeleri",
                "ordering": ["-timestamp"],
                "indexes": [
                    models.Index(fields=["path", "timestamp"], name="analytics_pageview_path_ts_idx"),
                    models.Index(fields=["country_code", "timestamp"], name="analytics_pageview_cc_ts_idx"),
                ],
            },
        ),
    ]
