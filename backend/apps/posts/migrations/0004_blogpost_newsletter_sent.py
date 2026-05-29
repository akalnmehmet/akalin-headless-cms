from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0003_blogpost_content_html_en_blogpost_content_json_en_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="blogpost",
            name="newsletter_sent",
            field=models.BooleanField(
                default=False,
                verbose_name="Newsletter Gönderildi",
                help_text="Bu yazı için abonelere e-posta gönderildi mi?",
            ),
        ),
    ]
