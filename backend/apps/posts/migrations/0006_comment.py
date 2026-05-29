import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0005_series_blogpost_series_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="Comment",
            fields=[
                ("id",         models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("post",       models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="posts.blogpost")),
                ("parent",     models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="replies", to="posts.comment", verbose_name="Yanıtlanan Yorum")),
                ("name",       models.CharField(max_length=100, verbose_name="Ad")),
                ("email",      models.EmailField(verbose_name="E-posta")),
                ("body",       models.TextField(max_length=2000, verbose_name="Yorum")),
                ("is_approved", models.BooleanField(db_index=True, default=False, verbose_name="Onaylandı")),
                ("ip_hash",    models.CharField(blank=True, editable=False, max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Yorum",
                "verbose_name_plural": "Yorumlar",
                "ordering": ["created_at"],
            },
        ),
    ]
