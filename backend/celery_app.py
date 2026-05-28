import os

from celery import Celery

# Django ayar modülünü DJANGO_SETTINGS_MODULE env değişkeni ile belirle.
# Varsayılan olarak dev ayarlarını kullan; prod'da Docker env ile override edilir.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("akalin_portfolyo")

# Celery ayarlarını Django settings'den CELERY_ prefix'iyle oku.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tüm uygulamaların tasks.py dosyalarını otomatik olarak keşfet.
app.autodiscover_tasks()
