import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    name="apps.posts.tasks.publish_scheduled_posts",
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # Hata durumunda 60 saniye sonra tekrar dene
)
def publish_scheduled_posts(self):
    """
    Zamanı gelmiş tüm DRAFT yazıları PUBLISHED durumuna geçirir.

    Celery Beat tarafından her 5 dakikada bir çağrılır (CELERY_BEAT_SCHEDULE).
    publish_at değeri geçmiş olan ve hâlâ DRAFT durumundaki yazıları yayınlar.

    Not: Public API zaten Q filtresi ile zamanlanmış yazıları gösterir;
    bu görev ise status alanını veritabanında fiziksel olarak günceller,
    böylece admin panelinde ve RSS feed'inde durum doğru görünür.
    """
    from .models import BlogPost  # Döngüsel import'u önlemek için local import

    try:
        now = timezone.now()
        # Yayınlanacak post'ları önce çek (newsletter için pk'lara ihtiyacımız var)
        to_publish_qs = BlogPost.objects.filter(
            status=BlogPost.Status.DRAFT,
            publish_at__isnull=False,
            publish_at__lte=now,
        )
        to_publish_pks = list(to_publish_qs.values_list("pk", flat=True))
        updated_count = to_publish_qs.update(status=BlogPost.Status.PUBLISHED)

        if updated_count > 0:
            logger.info(
                "Zamanlanmış yayın: %d yazı PUBLISHED durumuna geçirildi. (Zaman: %s)",
                updated_count,
                now.isoformat(),
            )
            # Bulk update signals tetiklemez — newsletter'ı burada elle gönder
            try:
                from apps.newsletter.email import send_newsletter

                newly_published = BlogPost.objects.filter(
                    pk__in=to_publish_pks,
                    newsletter_sent=False,
                )
                for post in newly_published:
                    send_newsletter(post)
                    BlogPost.objects.filter(pk=post.pk).update(newsletter_sent=True)
            except Exception as nl_exc:
                logger.error("Zamanlanmış newsletter gönderilemedi: %s", nl_exc, exc_info=True)
        else:
            logger.debug(
                "Zamanlanmış yayın kontrolü tamamlandı: Yayınlanacak yazı yok. (Zaman: %s)",
                now.isoformat(),
            )

        return {"published": updated_count, "checked_at": now.isoformat()}

    except Exception as exc:
        logger.error(
            "Zamanlanmış yayın görevi başarısız oldu: %s",
            str(exc),
            exc_info=True,
        )
        raise self.retry(exc=exc)
