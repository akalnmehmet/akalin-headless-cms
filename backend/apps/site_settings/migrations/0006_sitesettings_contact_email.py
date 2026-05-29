from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('site_settings', '0005_sitesettings_about_bio_sitesettings_about_bio_en'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='contact_email',
            field=models.EmailField(blank=True, default='', max_length=254, verbose_name='İletişim E-postası'),
        ),
    ]
