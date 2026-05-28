# Bu import, Django başladığında Celery app'inin yüklenmesini sağlar.
# @shared_task dekoratörünün düzgün çalışması için gereklidir.
from celery_app import app as celery_app  # noqa: F401

__all__ = ("celery_app",)
