from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0006_comment"),
    ]

    operations = [
        migrations.CreateModel(
            name="Reaction",
            fields=[
                ("id",         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("post",       models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reactions", to="posts.blogpost")),
                ("emoji",      models.CharField(choices=[("like","like"),("heart","heart"),("fire","fire"),("thinking","thinking"),("clap","clap")], db_index=True, max_length=20)),
                ("ip_hash",    models.CharField(db_index=True, max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Tepki",
                "verbose_name_plural": "Tepkiler",
            },
        ),
        migrations.AddConstraint(
            model_name="reaction",
            constraint=models.UniqueConstraint(
                fields=["post", "emoji", "ip_hash"],
                name="unique_post_emoji_ip",
            ),
        ),
    ]
